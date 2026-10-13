"""
YouTube upload for ForgeOS MediaPilot Dot.

Uses the official YouTube Data API v3 with OAuth 2.0.
Based on Google's documented upload pattern; clean-room implementation.

Usage:
    python3 youtube_upload.py --file video.mp4 --title "Title" --description "Desc" --privacy unlisted

Prerequisites:
    pip3 install google-api-python-client google-auth-oauthlib google-auth-httplib2
    - OAuth 2.0 Client ID (Desktop app) from Google Cloud Console
    - YouTube Data API v3 enabled
    - Save credentials as client_secret.json (NEVER commit this file)

Security:
    - OAuth tokens stored in token.pickle (local only, never commit)
    - Minimal scope: youtube.upload only
    - Secrets stay server-side; never in chat, logs, or Git
"""
import argparse
import os
import sys
import pickle

from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request

SCOPES = ['https://www.googleapis.com/auth/youtube.upload']
TOKEN_FILE = 'token.pickle'


def get_service(client_secret_file):
    creds = None
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, 'rb') as f:
            creds = pickle.load(f)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(client_secret_file):
                print(f"Error: client secret not found: {client_secret_file}", file=sys.stderr)
                sys.exit(1)
            flow = InstalledAppFlow.from_client_secrets_file(client_secret_file, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(TOKEN_FILE, 'wb') as f:
            pickle.dump(creds, f)
    return build('youtube', 'v3', credentials=creds)


def upload(youtube, file_path, title, description, privacy, category_id='22'):
    body = {
        'snippet': {'title': title, 'description': description, 'categoryId': category_id},
        'status': {'privacyStatus': privacy, 'selfDeclaredMadeForKids': False},
    }
    request = youtube.videos().insert(
        part=','.join(body.keys()),
        body=body,
        media_body=MediaFileUpload(file_path, chunksize=-1, resumable=True),
    )
    response = None
    while response is None:
        status, response = request.next_chunk()
        if status:
            print(f"Uploaded {int(status.progress() * 100)}%", flush=True)
    video_id = response.get('id')
    print(f"VIDEO_ID={video_id}")
    print(f"URL=https://youtu.be/{video_id}")
    return video_id


def main():
    p = argparse.ArgumentParser(description='Upload video to YouTube via ForgeOS MediaPilot')
    p.add_argument('--file', required=True, help='Path to video file')
    p.add_argument('--title', required=True, help='Video title')
    p.add_argument('--description', default='', help='Video description')
    p.add_argument('--privacy', default='unlisted', choices=['public', 'private', 'unlisted'])
    p.add_argument('--category', default='22', help='YouTube category ID (default 22 = People & Blogs)')
    p.add_argument('--secrets', default='client_secret.json', help='Path to OAuth client secrets')
    args = p.parse_args()

    if not os.path.exists(args.file):
        print(f"Error: file not found: {args.file}", file=sys.stderr)
        sys.exit(1)
    if os.path.getsize(args.file) == 0:
        print(f"Error: file is empty: {args.file}", file=sys.stderr)
        sys.exit(1)

    youtube = get_service(args.secrets)
    upload(youtube, args.file, args.title, args.description, args.privacy, args.category)


if __name__ == '__main__':
    main()
