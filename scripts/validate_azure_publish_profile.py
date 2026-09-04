#!/usr/bin/env python3
"""Validate a direct-production Azure publish profile without exposing credentials."""

from __future__ import annotations

import os
import sys
import unittest
import xml.etree.ElementTree as ET


class PublishProfileValidationError(ValueError):
    """Raised when release configuration does not match the production app."""


def _first_publish_profile(root: ET.Element) -> ET.Element | None:
    for element in root.iter():
        if element.tag.rsplit("}", 1)[-1] == "publishProfile":
            return element
    return None


def validate_publish_profile(profile_xml: str, app_name: str) -> None:
    """Mirror Azure/webapps-deploy's app/slot check without exposing credentials."""
    if not app_name:
        raise PublishProfileValidationError("The App Service name is required.")
    if not profile_xml:
        raise PublishProfileValidationError("The Azure publish profile is required.")

    try:
        root = ET.fromstring(profile_xml)
    except ET.ParseError as error:
        raise PublishProfileValidationError("The Azure publish profile is malformed XML.") from error

    publish_profile = _first_publish_profile(root)
    if publish_profile is None:
        raise PublishProfileValidationError("The Azure publish profile has no publishProfile entry.")

    username = publish_profile.attrib.get("userName", "")
    if not username:
        raise PublishProfileValidationError("The Azure publish profile has no deployment username.")

    # The production deployment username is the app name; slot credentials
    # carry an __slot suffix and must not be accepted for this workflow.
    identity = username[1:] if username.startswith("$") else username
    identity_segments = identity.upper().split("__")
    app_matches = identity_segments[0] == app_name.upper()
    production_matches = len(identity_segments) == 1
    if not app_matches or not production_matches:
        raise PublishProfileValidationError(
            "The Azure publish profile must belong to the configured production App Service, not a slot."
        )


def validate_from_environment() -> None:
    validate_publish_profile(
        os.environ.get("PUBLISH_PROFILE", ""),
        os.environ.get("APP_NAME", ""),
    )


class PublishProfileValidatorTests(unittest.TestCase):
    @staticmethod
    def profile(username: str) -> str:
        return (
            '<publishData><publishProfile publishMethod="MSDeploy" '
            f'userName="{username}" userPWD="not-a-real-secret" /></publishData>'
        )

    def test_accepts_production_profile_with_azure_leading_dollar(self) -> None:
        validate_publish_profile(self.profile("$hoa-events"), "hoa-events")

    def test_accepts_kubeapp_style_username_without_leading_dollar(self) -> None:
        validate_publish_profile(self.profile("hoa-events"), "HOA-EVENTS")

    def test_rejects_missing_or_empty_values(self) -> None:
        valid = self.profile("$hoa-events")
        for profile, app in [
            ("", "hoa-events"),
            (valid, ""),
        ]:
            with self.subTest(profile=bool(profile), app=bool(app)):
                with self.assertRaises(PublishProfileValidationError):
                    validate_publish_profile(profile, app)

    def test_rejects_malformed_xml(self) -> None:
        with self.assertRaises(PublishProfileValidationError):
            validate_publish_profile("<publishData>", "hoa-events")

    def test_rejects_profile_for_wrong_app(self) -> None:
        with self.assertRaises(PublishProfileValidationError):
            validate_publish_profile(self.profile("$different-app"), "hoa-events")

    def test_rejects_slot_profiles(self) -> None:
        for slot in ("staging", "preview", "production"):
            with self.subTest(slot=slot):
                with self.assertRaises(PublishProfileValidationError):
                    validate_publish_profile(self.profile(f"$hoa-events__{slot}"), "hoa-events")


def main() -> int:
    if sys.argv[1:] == ["--self-test"]:
        suite = unittest.defaultTestLoader.loadTestsFromTestCase(PublishProfileValidatorTests)
        result = unittest.TextTestRunner(verbosity=2).run(suite)
        return 0 if result.wasSuccessful() else 1
    if len(sys.argv) != 1:
        print("Usage: validate_azure_publish_profile.py [--self-test]", file=sys.stderr)
        return 2

    try:
        validate_from_environment()
    except PublishProfileValidationError as error:
        print(f"::error::{error}", file=sys.stderr)
        return 1

    print("Azure production publish-profile identity validated.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
