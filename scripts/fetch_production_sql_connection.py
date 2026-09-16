#!/usr/bin/env python3
"""Fetch the production SQL connection string via Kudu without printing it."""

from __future__ import annotations

import base64
import json
import os
import sys
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET

REMOTE_PATH = "/home/hoa_bootstrap_sql_connection.txt"
VFS_PATH = "/hoa_bootstrap_sql_connection.txt"



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
    if host.endswith(".azurewebsites.net") and ".scm." not in host:
        host = host.replace(".azurewebsites.net", ".scm.azurewebsites.net", 1)
    return f"https://{host}"


def _request(
    url: str,
    *,
    auth: str,
    method: str = "GET",
    data: bytes | None = None,
    content_type: str | None = None,
) -> bytes:
    headers = {"Authorization": f"Basic {auth}"}
    if content_type:
        headers["Content-Type"] = content_type
    request = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            return response.read()
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")[:300]
        raise SystemExit(f"Kudu {method} {url} failed with HTTP {error.code}: {body}") from error


def _looks_like_sql_connection(value: str) -> bool:
    lowered = value.lower()
    return ("server=" in lowered or "data source=" in lowered) and (
        "initial catalog=" in lowered or "database=" in lowered
    )


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
    scm = _scm_base(publish_url)

    # Write candidate env vars to a temp file inside the App Service sandbox.
    keys_path = "/home/hoa_bootstrap_sql_keys.txt"
    remote_script = (
        "bash -lc "
        f"\"rm -f {REMOTE_PATH} {keys_path}; "
        "printenv | awk -F= 'BEGIN{{IGNORECASE=1}} /connection|sqlazure|sqlconn|database/ {{print \$1}}' "
        f"> {keys_path}; "
        "for key in ConnectionStrings__DefaultConnection "
        "SQLAZURECONNSTR_DefaultConnection SQLCONNSTR_DefaultConnection "
        "CUSTOMCONNSTR_DefaultConnection DATABASE_URL; do "
        "val=$(printenv \"$key\" || true); "
        "if [ -n \"$val\" ]; then printf '%s' \"$val\" > "
        f"{REMOTE_PATH}; "
        "echo wrote:$key:len:${{#val}}; exit 0; fi; "
        "done; "
        "echo missing_connection_env; "
        f"echo keys_file={keys_path}; "
        "exit 2\""
    )
    command_body = json.dumps({"command": remote_script, "dir": "/home"}).encode()
    command_payload = json.loads(
        _request(
            f"{scm}/api/command",
            auth=auth,
            method="POST",
            data=command_body,
            content_type="application/json",
        ).decode()
    )
    exit_code = command_payload.get("ExitCode", command_payload.get("exitCode"))
    output = (command_payload.get("Output") or command_payload.get("output") or "").strip()
    if exit_code not in (0, "0"):
        try:
            keys = _request(f"{scm}/api/vfs/hoa_bootstrap_sql_keys.txt", auth=auth).decode("utf-8", errors="replace")
            key_lines = ",".join(line.strip() for line in keys.splitlines() if line.strip()) or "(none)"
        except SystemExit:
            key_lines = "(keys file unavailable)"
        print(
            f"::error::Could not locate a SQL connection env var in App Service (exit={exit_code}, output={output!r}, keys={key_lines}).",
            file=sys.stderr,
        )
        return 1

    # Brief settle for VFS visibility.
    time.sleep(1)
    raw = _request(f"{scm}/api/vfs{VFS_PATH}", auth=auth).decode("utf-8", errors="replace")
    connection = raw.strip().strip('"').strip("'")

    # Best-effort cleanup; ignore failure.
    try:
        _request(f"{scm}/api/vfs{VFS_PATH}", auth=auth, method="DELETE")
    except SystemExit:
        pass

    if not _looks_like_sql_connection(connection):
        print(
            "::error::Fetched App Service value is not a SQL connection string "
            f"(length={len(connection)}, starts_with_code={ord(connection[:1]) if connection else -1}).",
            file=sys.stderr,
        )
        return 1

    github_output = os.environ.get("GITHUB_OUTPUT")
    if not github_output:
        print("::error::GITHUB_OUTPUT is not set.", file=sys.stderr)
        return 1

    delimiter = "HOA_SQL_CONNECTION_EOF"
    with open(github_output, "a", encoding="utf-8") as handle:
        handle.write(f"connection_string<<{delimiter}\n")
        handle.write(f"{connection}\n")
        handle.write(f"{delimiter}\n")

    print(f"::add-mask::{connection}")
    print(f"Production SQL connection string loaded from App Service ({output}).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
