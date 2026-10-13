#!/usr/bin/env python3
"""
Dot browser egress shim (ForgeOS workforce vertical slice).

Listens on 127.0.0.1:18923. Handles:
  - HTTP CONNECT (HTTPS tunneling): pre-injects Proxy-Authorization
    (re-read from the environment on EVERY connection — credentials rotate)
    and relays to the runtime egress proxy.
  - Plain-HTTP forward-proxy requests (absolute URI in request line):
    relays through the egress proxy with pre-injected auth, or fetches
    directly for localhost targets.

Localhost targets bypass the egress proxy (direct connection, 502 on failure).

SECURITY: this shim NEVER logs headers, credentials, URLs, or bodies.
Stdout carries only lifecycle lines (start/stop). The word "Authorization"
appears in this source only as a header NAME, never with a value.
"""
import os
import os
import sys
import socket
import threading
import base64
import urllib.parse

LISTEN_HOST = "127.0.0.1"
LISTEN_PORT = 18923  # default; --port overrides (ephemeral per run preferred)
LOCAL_HOSTS = {"127.0.0.1", "localhost", "::1"}

# Network-level allowlist (defense in depth). The browser executor ALSO
# enforces this via request interception, but a server-side redirect can
# bypass Playwright's Fetch handler for the navigation request (verified
# 2026-10-12). The shim is the network choke point: every byte of egress
# goes through here, so enforcement here cannot be bypassed by the page.
# Passed per task via --allowlist host1,host2 (or SHIM_ALLOWLIST env).
ALLOWLIST = set()


def parse_args():
    global ALLOWLIST, LISTEN_PORT
    args = sys.argv
    for i, a in enumerate(args):
        if a == "--allowlist" and i + 1 < len(args):
            ALLOWLIST = {h.strip().lower() for h in args[i + 1].split(",") if h.strip()}
        if a == "--port" and i + 1 < len(args) and args[i + 1].isdigit():
            LISTEN_PORT = int(args[i + 1])
    env = os.environ.get("SHIM_ALLOWLIST", "")
    if env and not ALLOWLIST:
        ALLOWLIST = {h.strip().lower() for h in env.split(",") if h.strip()}


def host_allowed(host):
    h = host.lower()
    if h in LOCAL_HOSTS:
        return True
    if not ALLOWLIST:
        return True  # no policy configured: permissive (dev default)
    return h in ALLOWLIST


def egress_target():
    """Re-read proxy URL from env per connection. Never log the result."""
    raw = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy") or ""
    u = urllib.parse.urlparse(raw)
    if not u.hostname:
        raise RuntimeError("no egress proxy configured in environment")
    user = urllib.parse.unquote(u.username or "")
    pwd = urllib.parse.unquote(u.password or "")
    auth = base64.b64encode(f"{user}:{pwd}".encode()).decode()
    return u.hostname, u.port or 8080, auth


def relay(src, dst):
    try:
        while True:
            data = src.recv(65536)
            if not data:
                break
            dst.sendall(data)
    except OSError:
        pass
    finally:
        for s in (src, dst):
            try:
                s.shutdown(socket.SHUT_RDWR)
            except OSError:
                pass


def header_lines(buf):
    head = buf.split(b"\r\n\r\n", 1)[0]
    return head.split(b"\r\n")[1:]  # skip request line


def strip_proxy_headers(lines):
    return [l for l in lines if not l.lower().startswith(b"proxy-")]


def handle(client):
    try:
        buf = b""
        while b"\r\n\r\n" not in buf:
            chunk = client.recv(4096)
            if not chunk:
                client.close()
                return
            buf += chunk
            if len(buf) > 65536:  # sanity cap on headers
                client.close()
                return
        parts = buf.split(b"\r\n", 1)[0].decode("latin1").split(" ", 2)
        if len(parts) != 3:
            client.sendall(b"HTTP/1.1 400 Bad Request\r\n\r\n")
            client.close()
            return
        method = parts[0].upper()
        headers = strip_proxy_headers(header_lines(buf))
        body = buf.split(b"\r\n\r\n", 1)[1]

        if method == "CONNECT":
            # Tunnel mode: "CONNECT host:port HTTP/1.1"
            host, _, port_s = parts[1].partition(":")
            port = int(port_s) if port_s.isdigit() else 443
            plain = None
        else:
            # Plain-HTTP forward mode: absolute URI in request line.
            try:
                abs_uri = urllib.parse.urlparse(parts[1])
                host = abs_uri.hostname or ""
                port = abs_uri.port or 80
            except Exception:
                client.sendall(b"HTTP/1.1 400 Bad Request\r\n\r\n")
                client.close()
                return
            origin = abs_uri.path or "/"
            if abs_uri.query:
                origin += "?" + abs_uri.query
            plain = (method, parts[1], origin, body)

        # Network-level allowlist enforcement (defense in depth — see header).
        # Localhost is always permitted (direct connection, no egress).
        # Anything else must be in the task allowlist, else rejected BEFORE
        # any upstream connection is opened. Only the hostname is logged.
        if host not in LOCAL_HOSTS and not host_allowed(host):
            print(f"shim: BLOCKED off-allowlist host: {host}", flush=True)
            client.sendall(b"HTTP/1.1 403 Forbidden\r\n\r\n")
            client.close()
            return

        if host in LOCAL_HOSTS:
            try:
                upstream = socket.create_connection((host, port), timeout=10)
            except OSError:
                client.sendall(b"HTTP/1.1 502 Bad Gateway\r\n\r\n")
                client.close()
                return
            if plain is None:
                client.sendall(b"HTTP/1.1 200 Connection Established\r\n\r\n")
            else:
                m, _abs, origin, bdy = plain
                upstream.sendall(
                    f"{m} {origin} HTTP/1.1\r\n".encode("latin1")
                    + b"\r\n".join(headers) + b"\r\n\r\n" + bdy
                )
                relay(upstream, client)  # one-shot response, then close
                client.close()
                upstream.close()
                return
        else:
            phost, pport, auth = egress_target()
            upstream = socket.create_connection((phost, pport), timeout=15)
            auth_hdr = f"Proxy-Authorization: Basic {auth}\r\n".encode("latin1")
            if plain is None:
                # Pre-inject auth: the egress proxy answers unauthenticated
                # CONNECT with 403 (not 407), so Chromium/Playwright would
                # never retry with credentials. We send them up front.
                upstream.sendall(
                    f"CONNECT {host}:{port} HTTP/1.1\r\n".encode("latin1")
                    + f"Host: {host}:{port}\r\n".encode("latin1")
                    + auth_hdr
                    + b"Proxy-Connection: Keep-Alive\r\n\r\n"
                )
                resp = b""
                while b"\r\n\r\n" not in resp:
                    chunk = upstream.recv(4096)
                    if not chunk:
                        break
                    resp += chunk
                if b" 200 " not in resp.split(b"\r\n", 1)[0]:
                    client.sendall(b"HTTP/1.1 502 Bad Gateway\r\n\r\n")
                    client.close()
                    upstream.close()
                    return
                client.sendall(b"HTTP/1.1 200 Connection Established\r\n\r\n")
            else:
                m, abs_uri_s, _origin, bdy = plain
                upstream.sendall(
                    f"{m} {abs_uri_s} HTTP/1.1\r\n".encode("latin1")
                    + b"\r\n".join(headers) + b"\r\n" + auth_hdr + b"\r\n" + bdy
                )
                relay(upstream, client)
                client.close()
                upstream.close()
                return

        t1 = threading.Thread(target=relay, args=(client, upstream), daemon=True)
        t2 = threading.Thread(target=relay, args=(upstream, client), daemon=True)
        t1.start()
        t2.start()
        t1.join()
        t2.join()
        client.close()
    except Exception:
        try:
            client.close()
        except OSError:
            pass


def main():
    parse_args()
    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind((LISTEN_HOST, LISTEN_PORT))
    srv.listen(32)
    scope = f"allowlist=[{','.join(sorted(ALLOWLIST))}]" if ALLOWLIST else "allowlist=OFF (permissive)"
    print(f"shim listening on {LISTEN_HOST}:{LISTEN_PORT} {scope}", flush=True)
    try:
        while True:
            client, _ = srv.accept()
            threading.Thread(target=handle, args=(client,), daemon=True).start()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
