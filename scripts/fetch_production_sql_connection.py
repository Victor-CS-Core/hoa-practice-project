#!/usr/bin/env python3
"""Fetch the production SQL connection string via Kudu without printing it."""

from __future__ import annotations

import base64
import json
import os
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET


def _msdeploy_profile(root: ET.Element) -> ET.Element:
    for element in root.iter():
        if element.tag.rsplit("}", 1)[-1] != "publishProfile":
            continue
        if element.attrib.get("publishMethod") == "MSDeploy":
            return element
    raise SystemExit("No MSDeploy publishProfile entry found.")


def _scm_base(publish_url: str) -> str:
    host = publish_url.split(":")[0].strip()
    if not host:
        raise SystemExit("MSDeploy publishUrl is empty.")
    if not host.endswith(".scm.azurewebsites.net") and ".scm." not in host:
        # Some profiles omit .scm in publishUrl host shape; prefer explicit scm host.
        if host.endswith(".azurewebsites.net"):
            host = host.replace(".azurewebsites.net", ".scm.azurewebsites.net", 1)
    return f"https://{host}"


def main() -> int:
    profile_xml = os.environ.get("PUBLISH_PROFILE", "")
    if not profile_xml:
        print("::error::PUBLISH_PROFILE is required.", file=sys.stderr)
        return 1

    root = ET.fromstring(profile_xml)
    profile = _msdeploy_profile(root)
    username = profile.attrib.get("userName", "")
    password = profile.attrib.get("userPWD", "")
    publish_url = profile.attrib.get("publishUrl", "")
    if not username or not password or not publish_url:
        print("::error::Publish profile is missing MSDeploy credentials.", file=sys.stderr)
        return 1

    auth = base64.b64encode(f"{username}:{password}".encode()).decode()
    body = json.dumps(
        {
            "command": (
                "bash -lc "
                "'printenv ConnectionStrings__DefaultConnection "
                "|| printenv SQLAZURECONNSTR_DefaultConnection "
                "|| printenv SQLCONNSTR_DefaultConnection'"
            ),
            "dir": "/home/site/wwwroot",
        }
    ).encode()
    request = urllib.request.Request(
        f"{_scm_base(publish_url)}/api/command",
        data=body,
        method="POST",
        headers={
            "Authorization": f"Basic {auth}",
            "Content-Type": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            payload = json.loads(response.read().decode())
    except urllib.error.HTTPError as error:
        print(f"::error::Kudu command failed with HTTP {error.code}.", file=sys.stderr)
        return 1

    output = (payload.get("Output") or payload.get("output") or "").strip()
    error_output = (payload.get("Error") or payload.get("error") or "").strip()
    # Prefer stdout; some hosts write the value to Error.
    connection = output or error_output
    # Drop trailing shell noise / newlines.
    connection = connection.splitlines()[0].strip() if connection else ""
    if not connection or connection.lower() in {"null", "none"}:
        print(
            "::error::Could not read DefaultConnection from the App Service environment.",
            file=sys.stderr,
        )
        return 1

    github_output = os.environ.get("GITHUB_OUTPUT")
    if not github_output:
        print("::error::GITHUB_OUTPUT is not set.", file=sys.stderr)
        return 1

    # Connection strings contain '=' / ';' and must use a heredoc delimiter.
    delimiter = "HOA_SQL_CONNECTION_EOF"
    with open(github_output, "a", encoding="utf-8") as handle:
        handle.write(f"connection_string<<{delimiter}\n")
        handle.write(f"{connection}\n")
        handle.write(f"{delimiter}\n")

    # Register a secret mask so later steps cannot leak it.
    print(f"::add-mask::{connection}")
    print("Production SQL connection string loaded from App Service.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
