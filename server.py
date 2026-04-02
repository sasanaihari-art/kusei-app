import http.server, socketserver, os, sys
port = int(os.environ.get('PORT', 8080))
os.chdir(os.path.dirname(os.path.abspath(__file__)))
with socketserver.TCPServer(("", port), http.server.SimpleHTTPRequestHandler) as httpd:
    print(f"Serving on port {port}")
    httpd.serve_forever()
