const http = require("node:http");
const { readFile } = require("node:fs");
const { extname, join } = require("node:path");

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
const ROOT = join(process.cwd(), "local-test-site");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);
  const pathname = reqUrl.pathname;

  // Endpoint to simulate robots.txt failure (HTTP 503)
  if (reqUrl.searchParams.get("robots") === "503" || pathname.startsWith("/robots-503")) {
    res.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("503 Service Unavailable (Simulasi kegagalan robots.txt)");
    return;
  }

  // Endpoint to simulate robots.txt disallow rule
  if (reqUrl.searchParams.get("robots") === "disallow" || pathname.startsWith("/robots-disallow")) {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("User-agent: *\nDisallow: /disallowed.html\nDisallow: /robots-disallow/\n");
    return;
  }

  let filePath = pathname;
  if (filePath.endsWith("/")) filePath += "index.html";
  const file = join(ROOT, filePath);
  readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not Found");
      return;
    }
    const type = MIME[extname(file)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Local test site running at http://127.0.0.1:${PORT}`);
});
