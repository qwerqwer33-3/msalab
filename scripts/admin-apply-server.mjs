import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";

const PORT = Number(process.env.MSQ_ADMIN_APPLY_PORT || 3002);
const ROOT = process.cwd();
const MAX_BODY_BYTES = 1024 * 1024 * 3;

const TARGETS = {
  "data/news.json": ["data/news.json", "public/cms/news.json", "out/cms/news.json"],
  "data/activities.json": [
    "data/activities.json",
    "public/cms/activities.json",
    "out/cms/activities.json"
  ]
};

const send = (response, status, body) => {
  response.writeHead(status, {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    "content-type": "application/json"
  });
  response.end(JSON.stringify(body));
};

const readBody = (request) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("Request body is too large."));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });

    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });

const normalizeJson = (content) => {
  const parsed = typeof content === "string" ? JSON.parse(content) : content;
  if (!Array.isArray(parsed)) {
    throw new Error("CMS content must be a JSON array.");
  }
  return `${JSON.stringify(parsed, null, 2)}\n`;
};

const writeTarget = async (relativePath, content) => {
  const targetPath = path.resolve(ROOT, relativePath);
  if (!targetPath.startsWith(ROOT)) {
    throw new Error(`Refusing to write outside repository: ${relativePath}`);
  }
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, content, "utf8");
  return relativePath;
};

const server = http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    send(response, 204, {});
    return;
  }

  if (request.method === "GET" && request.url === "/health") {
    send(response, 200, { ok: true, targets: Object.keys(TARGETS) });
    return;
  }

  if (request.method !== "POST" || request.url !== "/apply") {
    send(response, 404, { ok: false, error: "Not found." });
    return;
  }

  try {
    const body = JSON.parse(await readBody(request));
    const targetList = TARGETS[body.fileName];
    if (!targetList) {
      send(response, 400, { ok: false, error: `Unsupported fileName: ${body.fileName}` });
      return;
    }

    const content = normalizeJson(body.content);
    const written = [];
    for (const target of targetList) {
      written.push(await writeTarget(target, content));
    }

    send(response, 200, { ok: true, fileName: body.fileName, written });
  } catch (error) {
    send(response, 500, { ok: false, error: error.message });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`MSQ admin apply server listening on http://127.0.0.1:${PORT}`);
});
