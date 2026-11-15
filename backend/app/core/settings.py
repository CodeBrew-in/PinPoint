"""Switches that can be changed with an environment variable, without a code change."""
import os


def signups_open() -> bool:
    """SIGNUPS=closed stops new accounts at once (existing people can still sign in)."""
    return os.getenv("SIGNUPS", "open").strip().lower() != "closed"
