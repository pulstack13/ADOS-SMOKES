"""Run the ADOS virtual lounge on localhost."""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import webbrowser

PORT = 8000
ROOT = Path(__file__).resolve().parent


def main():
    handler = lambda *args, **kwargs: SimpleHTTPRequestHandler(
        *args, directory=str(ROOT), **kwargs
    )
    server = ThreadingHTTPServer(("localhost", PORT), handler)
    url = f"http://localhost:{PORT}"
    print(f"ADOS is running at {url}")
    print("Press Ctrl+C to stop the server.")
    webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nADOS server stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
