const fs = require("fs");
const http = require("http");
const path = require("path");
const researchHandler = require("./api/competitive-research");

const root = __dirname;
const port = Number(process.env.PORT || 8000);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

const serveStatic = (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.normalize(path.join(root, pathname));

  if (!filePath.startsWith(root)) {
    res.statusCode = 403;
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.statusCode = 404;
      res.end("Not found");
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", contentTypes[path.extname(filePath)] || "application/octet-stream");
    res.end(data);
  });
};

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/competitive-research")) {
    researchHandler(req, res);
    return;
  }

  serveStatic(req, res);
});

server.listen(port, () => {
  console.log(`UX Research OS running at http://localhost:${port}`);
});
