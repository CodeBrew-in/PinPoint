#!/usr/bin/env python3
"""Gets the Gmail refresh token PinPoint needs to send e-mail. Run it on YOUR computer, once.

    python scripts/gmail_token.py

It asks for the Client ID and Client Secret of the OAuth client you made in Google Cloud (docs/EMAIL_SETUP.md),
opens your browser so you can sign in as the sending Gmail account and press Allow, and prints the three values to
paste into Render's Environment page.

Nothing is sent anywhere except to Google. Do not paste the printed values into a chat, an issue or a file in the
repository: type them only into Render's Environment page.
Uses only the Python standard library, so there is nothing to install.
"""
import base64
import getpass
import hashlib
import json
import secrets
import sys
import threading
import urllib.error
import urllib.parse
import urllib.request
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer

PORT = 8765
REDIRECT = f"http://127.0.0.1:{PORT}/"
SCOPE = "https://www.googleapis.com/auth/gmail.send"  # can only send mail: it cannot read the mailbox
AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"


class Catcher(BaseHTTPRequestHandler):
    result: dict = {}

    def do_GET(self):  # noqa: N802 (name required by the http.server module)
        query = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        Catcher.result = {k: v[0] for k, v in query.items()}
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(b"<h2>Done. You can close this tab and go back to the terminal.</h2>")

    def log_message(self, *args):  # keep the terminal quiet
        pass


def main() -> int:
    print("PinPoint: get a Gmail refresh token\n")
    client_id = input("Client ID: ").strip()
    client_secret = getpass.getpass("Client secret (hidden as you type): ").strip()
    sender = input("The Gmail address that will send the mail: ").strip()
    if not client_id or not client_secret or not sender:
        print("All three are needed.")
        return 1

    # PKCE: proves that the program asking for the token is the one that started the sign-in
    verifier = secrets.token_urlsafe(64)
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
    state = secrets.token_urlsafe(16)
    url = AUTH_URL + "?" + urllib.parse.urlencode({
        "client_id": client_id, "redirect_uri": REDIRECT, "response_type": "code", "scope": SCOPE,
        "access_type": "offline", "prompt": "consent", "login_hint": sender, "state": state,
        "code_challenge": challenge, "code_challenge_method": "S256",
    })

    server = HTTPServer(("127.0.0.1", PORT), Catcher)
    thread = threading.Thread(target=server.handle_request, daemon=True)
    thread.start()
    print("\nYour browser opens now. Sign in as", sender, "and press Allow.")
    print("(If Google warns that the app is not verified, press Advanced, then Go to the app. That is expected.)")
    print("If the browser does not open, open this address yourself:\n" + url + "\n")
    webbrowser.open(url)
    thread.join(timeout=300)
    server.server_close()

    result = Catcher.result
    if result.get("state") != state or "code" not in result:
        print("No valid answer from Google:", result.get("error", "timed out"))
        return 1

    body = urllib.parse.urlencode({
        "code": result["code"], "client_id": client_id, "client_secret": client_secret,
        "redirect_uri": REDIRECT, "grant_type": "authorization_code", "code_verifier": verifier,
    }).encode()
    try:
        with urllib.request.urlopen(urllib.request.Request(TOKEN_URL, data=body), timeout=30) as reply:
            tokens = json.load(reply)
    except urllib.error.HTTPError as error:
        print("Google refused the code:", error.read().decode())
        return 1

    refresh = tokens.get("refresh_token")
    if not refresh:
        print("Google did not return a refresh token. Remove PinPoint at https://myaccount.google.com/permissions and run this again.")
        return 1

    print("\n" + "=" * 70)
    print("Paste these into Render: your API service, Environment page. Nowhere else.\n")
    print("EMAIL_PROVIDER=gmail_api")
    print("GMAIL_CLIENT_ID=" + client_id)
    print("GMAIL_CLIENT_SECRET=" + client_secret)
    print("GMAIL_REFRESH_TOKEN=" + refresh)
    print("GMAIL_SENDER=" + sender)
    print("=" * 70)
    return 0


if __name__ == "__main__":
    sys.exit(main())
