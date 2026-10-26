// Tiny static web server for local preview and tests. Run: npm start, then open http://localhost:8080
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript",
  ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".jpg": "image/jpeg",
  ".webp": "image/webp", ".mp4": "video/mp4", ".woff2": "font/woff2", ".svg": "image/svg+xml",
  ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml" };

export function startServer(port = 0) {
  const server = http.createServer(async (req, res) => {
    try {
      let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
      p = normalize(p).replace(/^(\.\.[/\\])+/, "");
      let file = join(ROOT, p);
      if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
      let s = await stat(file).catch(() => null);
      if (s && s.isDirectory()) { file = join(file, "index.html"); s = await stat(file).catch(() => null); }
      if (!s) { res.writeHead(404, { "content-type": TYPES[".html"] }); return res.end(await readFile(join(ROOT, "404.html"))); }
      res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
      res.end(await readFile(file));
    } catch (e) { res.writeHead(500); res.end("Server error"); }
  });
  return new Promise((ok) => server.listen(port, () => ok(server)));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const port = Number(process.env.PORT) || 8080;
  startServer(port).then(() => console.log(`Awwfy site running at http://localhost:${port}`));
}
