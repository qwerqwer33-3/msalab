import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";

const PORT = Number(process.env.MSQ_ADMIN_APPLY_PORT || 3002);
const ROOT = process.cwd();
const MAX_BODY_BYTES = 1024 * 1024 * 25;
const ACTIVITY_UPLOAD_PREFIX = "public/images/Activities/";
const ACTIVITY_UPLOAD_OUT_PREFIX = "out/images/Activities/";
const ALLOWED_UPLOAD_EXTENSIONS = new Set([".gif", ".jpeg", ".jpg", ".png", ".webp"]);

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

const resolveTargetPath = (relativePath) => {
  const targetPath = path.resolve(ROOT, relativePath);
  if (targetPath !== ROOT && !targetPath.startsWith(`${ROOT}${path.sep}`)) {
    throw new Error(`Refusing to write outside repository: ${relativePath}`);
  }
  return targetPath;
};

const writeTarget = async (relativePath, content) => {
  const targetPath = resolveTargetPath(relativePath);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, content, "utf8");
  return relativePath;
};

const normalizeUpload = (upload) => {
  if (!upload || typeof upload !== "object") {
    throw new Error("Upload must be an object.");
  }
  const repoPath = String(upload.repoPath || "").replace(/\\/g, "/");
  if (!repoPath.startsWith(ACTIVITY_UPLOAD_PREFIX)) {
    throw new Error(`Unsupported upload path: ${repoPath}`);
  }
  const extension = path.posix.extname(repoPath).toLowerCase();
  if (!ALLOWED_UPLOAD_EXTENSIONS.has(extension)) {
    throw new Error(`Unsupported upload extension: ${extension || "(none)"}`);
  }
  if (typeof upload.contentBase64 !== "string" || !upload.contentBase64) {
    throw new Error(`Missing base64 content for upload: ${repoPath}`);
  }
  const content = Buffer.from(upload.contentBase64, "base64");
  if (!content.length) {
    throw new Error(`Empty upload content: ${repoPath}`);
  }
  const outPath = repoPath.replace(ACTIVITY_UPLOAD_PREFIX, ACTIVITY_UPLOAD_OUT_PREFIX);
  return { repoPath, outPath, content };
};

const writeBinaryTarget = async (relativePath, content) => {
  const targetPath = resolveTargetPath(relativePath);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, content);
  return relativePath;
};

const writeUpload = async (upload) => {
  const normalized = normalizeUpload(upload);
  return [
    await writeBinaryTarget(normalized.repoPath, normalized.content),
    await writeBinaryTarget(normalized.outPath, normalized.content)
  ];
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
    const uploads = Array.isArray(body.uploads) ? body.uploads : [];
    const written = [];
    const uploaded = [];
    for (const upload of uploads) {
      uploaded.push(...(await writeUpload(upload)));
    }
    for (const target of targetList) {
      written.push(await writeTarget(target, content));
    }

    send(response, 200, { ok: true, fileName: body.fileName, written, uploaded });
  } catch (error) {
    send(response, 500, { ok: false, error: error.message });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`MSQ admin apply server listening on http://127.0.0.1:${PORT}`);
});
