"use client";

import { useEffect, useMemo, useState } from "react";
import newsSeed from "../../data/news.json";
import activitiesSeed from "../../data/activities.json";

const LAB_EMAIL_DOMAINS = ["skku.edu", "ajou.ac.kr"];
const STORAGE_KEY = "msq-admin-draft";
const SESSION_KEY = "msq-admin-session";
const GITHUB_CONFIG_KEY = "msq-admin-github-config";
const PREVIEW_CODE = process.env.NEXT_PUBLIC_MSQ_ADMIN_PREVIEW_CODE || "msq-lab-preview";
const MSQ_ADMIN_APPLY_ENDPOINT =
  process.env.NEXT_PUBLIC_MSQ_ADMIN_APPLY_ENDPOINT || "http://127.0.0.1:3002/apply";
const DEFAULT_GITHUB_OWNER = process.env.NEXT_PUBLIC_MSQ_GITHUB_OWNER || "qwerqwer33-3";
const DEFAULT_GITHUB_REPO = process.env.NEXT_PUBLIC_MSQ_GITHUB_REPO || "msalab";
const DEFAULT_GITHUB_BRANCH = process.env.NEXT_PUBLIC_MSQ_GITHUB_BRANCH || "main";
const activityUploadBasePath = "/images/Activities";
const activityUploadRepoBasePath = "public/images/Activities";

const githubTargetPaths = {
  "data/news.json": ["data/news.json", "public/cms/news.json"],
  "data/activities.json": ["data/activities.json", "public/cms/activities.json"]
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const formatJson = (value) => `${JSON.stringify(value, null, 2)}\n`;

const toBase64 = (value) => {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary);
};

const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary);
};

const readFileAsBase64 = async (file) => arrayBufferToBase64(await file.arrayBuffer());

const encodeGithubPath = (filePath) => filePath.split("/").map(encodeURIComponent).join("/");

const githubApiHeaders = (githubToken) => ({
  authorization: `Bearer ${githubToken}`,
  accept: "application/vnd.github+json",
  "x-github-api-version": "2022-11-28"
});

const githubRepoApiUrl = ({ githubOwner, githubRepo }, path = "") =>
  `https://api.github.com/repos/${encodeURIComponent(githubOwner)}/${encodeURIComponent(githubRepo)}${path}`;

const githubContentUrl = (settings, filePath) =>
  githubRepoApiUrl(settings, `/contents/${encodeGithubPath(filePath)}`);

const githubGitUrl = (settings, path) => githubRepoApiUrl(settings, `/git${path}`);

const isLabEmail = (email) => {
  const normalized = email.trim().toLowerCase();
  return LAB_EMAIL_DOMAINS.some((domain) => normalized.endsWith(`@${domain}`));
};

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

const today = () => new Date().toISOString().slice(0, 10);

const imageExtension = (file) => {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(extension)) return extension;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  return "jpg";
};

const imageStem = (file) => {
  const nameWithoutExtension = file.name.replace(/\.[^.]+$/, "");
  return slugify(nameWithoutExtension) || "image";
};

const createActivityImagePath = (activity, file, fileIndex) => {
  const datePart = (activity.date || today()).replaceAll("-", ".");
  const titlePart = slugify(activity.title || "activity") || "activity";
  const suffix = `${Date.now()}-${fileIndex + 1}`;
  return `${activityUploadBasePath}/${datePart}-${titlePart}-${imageStem(file)}-${suffix}.${imageExtension(file)}`;
};

const toUploadRepoPath = (publicPath) => publicPath.replace(activityUploadBasePath, activityUploadRepoBasePath);

const imageLines = (value) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const normalizeNews = (items) =>
  clone(items).map((item, index) => ({
    id: item.id || `${item.date || today()}-${slugify(item.title || `news-${index + 1}`)}`,
    date: item.date || today(),
    sortOrder: Number.isFinite(Number(item.sortOrder)) ? Number(item.sortOrder) : index * 10,
    title: item.title || "",
    text: item.text || ""
  }));

const activityImages = (item) => {
  if (Array.isArray(item.images) && item.images.length) return item.images;
  if (item.image) return [item.image];
  return [];
};

const normalizeActivities = (items) =>
  clone(items).map((item) => ({
    date: item.date || today(),
    title: item.title || "",
    description: item.description || "",
    imagesText: typeof item.imagesText === "string" ? item.imagesText : activityImages(item).join("\n")
  }));

const createInitialDraft = () => ({
  news: normalizeNews(newsSeed),
  activities: normalizeActivities(activitiesSeed)
});

const serializeNews = (items) =>
  items
    .map((item, index) => ({
      id: item.id || `${item.date}-${slugify(item.title || `news-${index + 1}`)}`,
      date: item.date,
      sortOrder: Number(item.sortOrder) || 0,
      title: item.title.trim(),
      text: item.text.trim()
    }))
    .filter((item) => item.date && item.title && item.text);

const serializeActivities = (items) =>
  items
    .map((item) => {
      const images = imageLines(item.imagesText);
      const output = {
        date: item.date,
        title: item.title.trim(),
        description: item.description.trim()
      };
      if (images.length === 1) {
        output.image = images[0];
      } else if (images.length > 1) {
        output.images = images;
      }
      return output;
    })
    .filter((item) => item.date && item.title && item.description);

const sortNews = (items) =>
  [...items].sort((a, b) => {
    const dateOrder = b.date.localeCompare(a.date);
    if (dateOrder !== 0) return dateOrder;
    return (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0);
  });

const sortActivities = (items) => [...items].sort((a, b) => b.date.localeCompare(a.date));

export default function AdminConsole() {
  const [draft, setDraft] = useState(createInitialDraft);
  const [activeCollection, setActiveCollection] = useState("news");
  const [identity, setIdentity] = useState({ email: "", code: "" });
  const [session, setSession] = useState(null);
  const [accessError, setAccessError] = useState("");
  const [status, setStatus] = useState("");
  const [editingKey, setEditingKey] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [applyMode, setApplyMode] = useState("github");
  const [pendingUploads, setPendingUploads] = useState([]);
  const [githubSettings, setGithubSettings] = useState({
    githubOwner: DEFAULT_GITHUB_OWNER,
    githubRepo: DEFAULT_GITHUB_REPO,
    githubBranch: DEFAULT_GITHUB_BRANCH,
    githubToken: ""
  });

  useEffect(() => {
    try {
      const storedDraft = window.localStorage.getItem(STORAGE_KEY);
      const storedSession = window.localStorage.getItem(SESSION_KEY);
      const storedGithubConfig = window.localStorage.getItem(GITHUB_CONFIG_KEY);
      if (storedDraft) {
        const parsed = JSON.parse(storedDraft);
        setDraft({
          news: normalizeNews(parsed.news || newsSeed),
          activities: normalizeActivities(parsed.activities || activitiesSeed)
        });
      }
      if (storedSession) {
        const parsedSession = JSON.parse(storedSession);
        if (parsedSession?.email && isLabEmail(parsedSession.email)) {
          setSession(parsedSession);
        }
      }
      if (storedGithubConfig) {
        const parsedGithubConfig = JSON.parse(storedGithubConfig);
        setGithubSettings((prev) => ({
          ...prev,
          githubOwner: parsedGithubConfig.githubOwner || prev.githubOwner,
          githubRepo: parsedGithubConfig.githubRepo || prev.githubRepo,
          githubBranch: parsedGithubConfig.githubBranch || prev.githubBranch,
          githubToken: ""
        }));
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(SESSION_KEY);
      window.localStorage.removeItem(GITHUB_CONFIG_KEY);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const host = window.location.hostname;
    if (host === "127.0.0.1" || host === "localhost") {
      setApplyMode("local");
    }
  }, [isReady]);

  useEffect(() => {
    if (!isReady) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft, isReady]);

  useEffect(() => {
    if (!isReady) return;
    window.localStorage.setItem(
      GITHUB_CONFIG_KEY,
      JSON.stringify({
        githubOwner: githubSettings.githubOwner,
        githubRepo: githubSettings.githubRepo,
        githubBranch: githubSettings.githubBranch
      })
    );
  }, [githubSettings.githubOwner, githubSettings.githubRepo, githubSettings.githubBranch, isReady]);

  const serialized = useMemo(
    () => ({
      news: serializeNews(draft.news),
      activities: serializeActivities(draft.activities)
    }),
    [draft]
  );

  const activeItems = activeCollection === "news" ? serialized.news : serialized.activities;
  const exportFileName = activeCollection === "news" ? "data/news.json" : "data/activities.json";
  const exportJson = formatJson(activeItems);
  const referencedActivityImagePaths = useMemo(() => {
    const paths = new Set();
    serialized.activities.forEach((item) => {
      if (item.image) paths.add(item.image);
      if (Array.isArray(item.images)) {
        item.images.forEach((image) => paths.add(image));
      }
    });
    return paths;
  }, [serialized.activities]);
  const pendingUploadsForApply =
    activeCollection === "activities"
      ? pendingUploads.filter((upload) => referencedActivityImagePaths.has(upload.publicPath))
      : [];
  const makeEditingKey = (collection, index) => `${collection}:${index}`;
  const isEditing = (collection, index) => editingKey === makeEditingKey(collection, index);
  const pendingUploadsForActivity = (item) => {
    const paths = new Set(imageLines(item.imagesText));
    return pendingUploads.filter((upload) => paths.has(upload.publicPath));
  };

  const openEditor = (collection, index) => {
    setEditingKey(makeEditingKey(collection, index));
    setStatus("");
  };

  const saveDraftItem = (collection, index) => {
    setEditingKey(null);
    setStatus(`${collection === "news" ? "News" : "Activity"} ${index + 1} saved to browser draft.`);
  };

  const handleUnlock = (event) => {
    event.preventDefault();
    const email = identity.email.trim().toLowerCase();
    if (!isLabEmail(email)) {
      setAccessError("Use an Ajou or Sungkyunkwan University lab email.");
      return;
    }
    if (identity.code !== PREVIEW_CODE) {
      setAccessError("Access code does not match this preview console.");
      return;
    }
    const nextSession = { email, unlockedAt: new Date().toISOString() };
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
    setAccessError("");
  };

  const updateNews = (index, field, value) => {
    setDraft((prev) => ({
      ...prev,
      news: prev.news.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: field === "sortOrder" ? Number(value) : value } : item
      )
    }));
  };

  const updateActivity = (index, field, value) => {
    setDraft((prev) => ({
      ...prev,
      activities: prev.activities.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleActivityImageUpload = async (index, fileList) => {
    const files = Array.from(fileList || []).filter((file) => file.type.startsWith("image/"));
    if (!files.length) {
      setStatus("Choose image files to attach to this activity.");
      return;
    }

    const activity = draft.activities[index];
    const uploads = await Promise.all(
      files.map(async (file, fileIndex) => {
        const publicPath = createActivityImagePath(activity, file, fileIndex);
        return {
          publicPath,
          repoPath: toUploadRepoPath(publicPath),
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          contentBase64: await readFileAsBase64(file)
        };
      })
    );

    setPendingUploads((prev) => {
      const nextPaths = new Set(uploads.map((upload) => upload.publicPath));
      return [...prev.filter((upload) => !nextPaths.has(upload.publicPath)), ...uploads];
    });

    setDraft((prev) => ({
      ...prev,
      activities: prev.activities.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const currentImages = imageLines(item.imagesText);
        const nextImages = [...currentImages, ...uploads.map((upload) => upload.publicPath)];
        return { ...item, imagesText: nextImages.join("\n") };
      })
    }));
    setStatus(`${uploads.length} image${uploads.length > 1 ? "s" : ""} attached to Activity ${index + 1}.`);
  };

  const addNews = () => {
    const date = today();
    setDraft((prev) => ({
      ...prev,
      news: [
        {
          id: `${date}-new-update`,
          date,
          sortOrder: 0,
          title: "New update",
          text: "Write the news text here."
        },
        ...prev.news
      ]
    }));
    setActiveCollection("news");
    setEditingKey(makeEditingKey("news", 0));
    setStatus("New news item added. Edit the draft, then export data/news.json.");
  };

  const addActivity = () => {
    setDraft((prev) => ({
      ...prev,
      activities: [
        {
          date: today(),
          title: "New activity",
          description: "Write the activity description here.",
          imagesText: ""
        },
        ...prev.activities
      ]
    }));
    setActiveCollection("activities");
    setEditingKey(makeEditingKey("activities", 0));
    setStatus("New activity added. Edit the draft, then export data/activities.json.");
  };

  const removeItem = (collection, index) => {
    setDraft((prev) => ({
      ...prev,
      [collection]: prev[collection].filter((_, itemIndex) => itemIndex !== index)
    }));
    setEditingKey(null);
    setStatus(`${collection === "news" ? "News" : "Activity"} ${index + 1} removed from browser draft.`);
  };

  const resetDraft = () => {
    setDraft(createInitialDraft());
    setPendingUploads([]);
    setEditingKey(null);
    setStatus("Draft reset to published data.");
  };

  const lock = () => {
    window.localStorage.removeItem(SESSION_KEY);
    setEditingKey(null);
    setSession(null);
  };

  const copyJson = async () => {
    try {
      await window.navigator.clipboard.writeText(exportJson);
      setStatus(`${exportFileName} copied.`);
    } catch {
      setStatus("Copy failed. Select the JSON preview and copy manually.");
    }
  };

  const downloadJson = () => {
    const blob = new Blob([exportJson], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = exportFileName.split("/").pop();
    anchor.click();
    window.URL.revokeObjectURL(url);
    setStatus(`${exportFileName} downloaded.`);
  };

  const updateGithubSetting = (field, value) => {
    setGithubSettings((prev) => ({ ...prev, [field]: value }));
  };

  const normalizedGithubSettings = () => ({
    githubOwner: githubSettings.githubOwner.trim(),
    githubRepo: githubSettings.githubRepo.trim(),
    githubBranch: githubSettings.githubBranch.trim(),
    githubToken: githubSettings.githubToken.trim()
  });

  const githubJsonRequest = async (settings, apiPath, options = {}) => {
    const response = await fetch(githubRepoApiUrl(settings, apiPath), {
      method: options.method || "GET",
      headers: {
        ...githubApiHeaders(settings.githubToken),
        "content-type": "application/json"
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.message || `GitHub request failed: ${apiPath}`);
    }
    return result;
  };

  const githubFilesForBatch = () => {
    const filesByPath = new Map();
    for (const upload of pendingUploadsForApply) {
      filesByPath.set(upload.repoPath, {
        path: upload.repoPath,
        content: upload.contentBase64,
        encoding: "base64",
        publicPath: upload.publicPath
      });
    }
    for (const filePath of githubTargetPaths[exportFileName] || [exportFileName]) {
      filesByPath.set(filePath, {
        path: filePath,
        content: exportJson,
        encoding: "utf-8"
      });
    }
    return [...filesByPath.values()];
  };

  const createGithubBatchCommit = async (settings, files) => {
    const branchPath = encodeGithubPath(settings.githubBranch);
    const currentRef = await githubJsonRequest(settings, `/git/ref/heads/${branchPath}`);
    const parentSha = currentRef.object?.sha;
    if (!parentSha) {
      throw new Error(`Could not find branch ${settings.githubBranch}.`);
    }

    const parentCommit = await githubJsonRequest(settings, `/git/commits/${parentSha}`);
    const treeEntries = [];
    for (const file of files) {
      const blob = await githubJsonRequest(settings, "/git/blobs", {
        method: "POST",
        body: {
          content: file.content,
          encoding: file.encoding
        }
      });
      treeEntries.push({
        path: file.path,
        mode: "100644",
        type: "blob",
        sha: blob.sha
      });
    }

    const tree = await githubJsonRequest(settings, "/git/trees", {
      method: "POST",
      body: {
        base_tree: parentCommit.tree?.sha,
        tree: treeEntries
      }
    });
    const commit = await githubJsonRequest(settings, "/git/commits", {
      method: "POST",
      body: {
        message: `Update ${activeCollection} CMS data`,
        tree: tree.sha,
        parents: [parentSha]
      }
    });
    await githubJsonRequest(settings, `/git/refs/heads/${branchPath}`, {
      method: "PATCH",
      body: {
        sha: commit.sha,
        force: false
      }
    });
    return { commit, files };
  };

  const applyViaGitHub = async () => {
    const settings = normalizedGithubSettings();
    if (!settings.githubOwner || !settings.githubRepo || !settings.githubBranch) {
      throw new Error("GitHub repository settings are incomplete.");
    }
    if (!settings.githubToken) {
      throw new Error("GitHub token is required for deployed publishing.");
    }

    const batchFiles = githubFilesForBatch();
    const batch = await createGithubBatchCommit(settings, batchFiles);
    if (pendingUploadsForApply.length) {
      const uploadedPaths = new Set(pendingUploadsForApply.map((upload) => upload.publicPath));
      setPendingUploads((prev) => prev.filter((upload) => !uploadedPaths.has(upload.publicPath)));
    }
    const imageCount = pendingUploadsForApply.length;
    setStatus(
      `Applied ${batch.files.length} file${batch.files.length > 1 ? "s" : ""}${imageCount ? `, including ${imageCount} activity image${imageCount > 1 ? "s" : ""}` : ""}, in one GitHub commit ${batch.commit.sha.slice(0, 7)}. GitHub Pages will redeploy shortly.`
    );
  };

  const applyViaLocal = async () => {
    try {
      const response = await fetch(MSQ_ADMIN_APPLY_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fileName: exportFileName,
          content: exportJson,
          uploads: pendingUploadsForApply
        })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Apply request failed.");
      }
      if (pendingUploadsForApply.length) {
        const uploadedPaths = new Set(pendingUploadsForApply.map((upload) => upload.publicPath));
        setPendingUploads((prev) => prev.filter((upload) => !uploadedPaths.has(upload.publicPath)));
      }
      setStatus(
        `Applied ${exportFileName}${pendingUploadsForApply.length ? ` with ${pendingUploadsForApply.length} activity image${pendingUploadsForApply.length > 1 ? "s" : ""}` : ""}. Reload Home, News, or Activities to see the update.`
      );
    } catch (error) {
      setStatus(`Apply failed: ${error.message}. Run npm run admin-server and try again.`);
    }
  };

  const applyToRepo = async () => {
    setStatus("Applying JSON to the repository...");
    try {
      if (applyMode === "github") {
        await applyViaGitHub();
        return;
      }
      await applyViaLocal();
    } catch (error) {
      setStatus(`Apply failed: ${error.message}`);
    }
  };

  if (!session) {
    return (
      <div className="adminPage">
        <section className="section adminHero">
          <p className="adminEyebrow">MSQ internal</p>
          <h1>Admin Console</h1>
          <p className="lead">
            A preview editor for lab updates. Published pages remain static; edits are exported as data files.
          </p>
        </section>
        <section className="section adminAccessSection">
          <form className="card adminAccessCard" onSubmit={handleUnlock}>
            <label className="adminField">
              <span>Lab email</span>
              <input
                value={identity.email}
                onChange={(event) => setIdentity((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="name@skku.edu"
                type="email"
              />
            </label>
            <label className="adminField">
              <span>Access code</span>
              <input
                value={identity.code}
                onChange={(event) => setIdentity((prev) => ({ ...prev, code: event.target.value }))}
                placeholder="Preview access code"
                type="password"
              />
            </label>
            {accessError ? <p className="adminError">{accessError}</p> : null}
            <button className="adminPrimaryButton" type="submit">
              Unlock editor
            </button>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="adminPage">
      <section className="section adminHero">
        <div>
          <p className="adminEyebrow">MSQ internal</p>
          <h1>Admin Console</h1>
          <p className="lead">Signed in as {session.email}</p>
        </div>
        <div className="adminHeroActions">
          <button className="adminSecondaryButton" type="button" onClick={resetDraft}>
            Reset draft
          </button>
          <button className="adminSecondaryButton" type="button" onClick={lock}>
            Lock
          </button>
        </div>
      </section>

      <section className="section adminToolbarSection">
        <div className="adminTabs" role="tablist" aria-label="Editable data">
          <button
            className={activeCollection === "news" ? "adminTab isActive" : "adminTab"}
            type="button"
            onClick={() => {
              setActiveCollection("news");
              setEditingKey(null);
            }}
          >
            News
          </button>
          <button
            className={activeCollection === "activities" ? "adminTab isActive" : "adminTab"}
            type="button"
            onClick={() => {
              setActiveCollection("activities");
              setEditingKey(null);
            }}
          >
            Activities
          </button>
        </div>
        <button
          className="adminPrimaryButton"
          type="button"
          onClick={activeCollection === "news" ? addNews : addActivity}
        >
          Add item
        </button>
      </section>

      <section className="section adminWorkspace">
        <div className="adminEditorList">
          {activeCollection === "news"
            ? draft.news.map((item, index) => {
                const editing = isEditing("news", index);
                return (
                <article className={editing ? "card adminEditCard isEditing" : "card adminEditCard"} key={`${item.id}-${index}`}>
                  <div className="adminCardHead">
                    <strong>News {index + 1}</strong>
                    <div className="adminCardActions">
                      {editing ? (
                        <button className="adminPrimaryButton adminSmallButton" type="button" onClick={() => saveDraftItem("news", index)}>
                          Save draft
                        </button>
                      ) : (
                        <button className="adminTextButton" type="button" onClick={() => openEditor("news", index)}>
                          Edit
                        </button>
                      )}
                      <button className="adminTextButton" type="button" onClick={() => removeItem("news", index)}>
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="adminFieldGrid">
                    <label className="adminField">
                      <span>Date</span>
                      <input
                        disabled={!editing}
                        type="date"
                        value={item.date}
                        onChange={(event) => updateNews(index, "date", event.target.value)}
                      />
                    </label>
                    <label className="adminField">
                      <span>Sort</span>
                      <input
                        disabled={!editing}
                        type="number"
                        value={item.sortOrder}
                        onChange={(event) => updateNews(index, "sortOrder", event.target.value)}
                      />
                    </label>
                  </div>
                  <label className="adminField">
                    <span>ID</span>
                    <input disabled={!editing} value={item.id} onChange={(event) => updateNews(index, "id", event.target.value)} />
                  </label>
                  <label className="adminField">
                    <span>Title</span>
                    <input disabled={!editing} value={item.title} onChange={(event) => updateNews(index, "title", event.target.value)} />
                  </label>
                  <label className="adminField">
                    <span>Text</span>
                    <textarea disabled={!editing} value={item.text} onChange={(event) => updateNews(index, "text", event.target.value)} />
                  </label>
                </article>
                );
              })
            : draft.activities.map((item, index) => {
                const editing = isEditing("activities", index);
                return (
                <article className={editing ? "card adminEditCard isEditing" : "card adminEditCard"} key={`${item.date}-${item.title}-${index}`}>
                  <div className="adminCardHead">
                    <strong>Activity {index + 1}</strong>
                    <div className="adminCardActions">
                      {editing ? (
                        <button className="adminPrimaryButton adminSmallButton" type="button" onClick={() => saveDraftItem("activities", index)}>
                          Save draft
                        </button>
                      ) : (
                        <button className="adminTextButton" type="button" onClick={() => openEditor("activities", index)}>
                          Edit
                        </button>
                      )}
                      <button className="adminTextButton" type="button" onClick={() => removeItem("activities", index)}>
                        Remove
                      </button>
                    </div>
                  </div>
                  <label className="adminField">
                    <span>Date</span>
                    <input
                      disabled={!editing}
                      type="date"
                      value={item.date}
                      onChange={(event) => updateActivity(index, "date", event.target.value)}
                    />
                  </label>
                  <label className="adminField">
                    <span>Title</span>
                    <input disabled={!editing} value={item.title} onChange={(event) => updateActivity(index, "title", event.target.value)} />
                  </label>
                  <label className="adminField">
                    <span>Description</span>
                    <textarea
                      disabled={!editing}
                      value={item.description}
                      onChange={(event) => updateActivity(index, "description", event.target.value)}
                    />
                  </label>
                  <label className="adminField">
                    <span>Image paths</span>
                    <textarea
                      disabled={!editing}
                      value={item.imagesText}
                      onChange={(event) => updateActivity(index, "imagesText", event.target.value)}
                    />
                  </label>
                  <label className="adminField adminUploadField">
                    <span>Add images</span>
                    <input
                      accept="image/*"
                      disabled={!editing}
                      multiple
                      type="file"
                      onChange={(event) => {
                        void handleActivityImageUpload(index, event.target.files);
                        event.target.value = "";
                      }}
                    />
                  </label>
                  {pendingUploadsForActivity(item).length ? (
                    <div className="adminUploadList">
                      {pendingUploadsForActivity(item).map((upload) => (
                        <span key={upload.publicPath}>{upload.publicPath}</span>
                      ))}
                    </div>
                  ) : null}
                </article>
                );
              })}
        </div>

        <aside className="adminExportPanel">
          <div className="card adminPreviewCard">
            <div className="adminCardHead">
              <strong>{exportFileName}</strong>
              <span>{activeItems.length} items</span>
            </div>
            <p className="adminPublishNote">
              {applyMode === "github"
                ? "GitHub mode commits this JSON to the repository and lets the Pages workflow redeploy it."
                : "Local mode writes this JSON through the helper server on this computer."}
            </p>
            <div className="adminApplyMode" role="group" aria-label="Apply target">
              <button
                className={applyMode === "github" ? "adminTab isActive" : "adminTab"}
                type="button"
                onClick={() => setApplyMode("github")}
              >
                GitHub
              </button>
              <button
                className={applyMode === "local" ? "adminTab isActive" : "adminTab"}
                type="button"
                onClick={() => setApplyMode("local")}
              >
                Local
              </button>
            </div>
            {applyMode === "github" ? (
              <div className="adminGithubGrid">
                <label className="adminField">
                  <span>Owner</span>
                  <input
                    value={githubSettings.githubOwner}
                    onChange={(event) => updateGithubSetting("githubOwner", event.target.value)}
                  />
                </label>
                <label className="adminField">
                  <span>Repo</span>
                  <input
                    value={githubSettings.githubRepo}
                    onChange={(event) => updateGithubSetting("githubRepo", event.target.value)}
                  />
                </label>
                <label className="adminField">
                  <span>Branch</span>
                  <input
                    value={githubSettings.githubBranch}
                    onChange={(event) => updateGithubSetting("githubBranch", event.target.value)}
                  />
                </label>
                <label className="adminField">
                  <span>GitHub token</span>
                  <input
                    autoComplete="off"
                    type="password"
                    value={githubSettings.githubToken}
                    onChange={(event) => updateGithubSetting("githubToken", event.target.value)}
                    placeholder="Fine-grained token"
                  />
                </label>
              </div>
            ) : null}
            <div className="adminExportActions">
              <button className="adminPrimaryButton" type="button" onClick={applyToRepo}>
                Apply to repo
              </button>
              <button className="adminSecondaryButton" type="button" onClick={copyJson}>
                Copy JSON
              </button>
              <button className="adminSecondaryButton" type="button" onClick={downloadJson}>
                Download
              </button>
            </div>
            {status ? <p className="adminStatus">{status}</p> : null}
            <textarea className="adminJsonPreview" readOnly value={exportJson} />
          </div>

          <div className="card adminPreviewCard">
            <div className="adminCardHead">
              <strong>Preview order</strong>
            </div>
            <div className="adminMiniList">
              {(activeCollection === "news" ? sortNews(serialized.news) : sortActivities(serialized.activities))
                .slice(0, 8)
                .map((item) => (
                  <div className="adminMiniItem" key={`${item.date}-${item.title}`}>
                    <span>{item.date}</span>
                    <strong>{item.title}</strong>
                  </div>
              ))}
            </div>
          </div>

          <div className="card adminPreviewCard">
            <div className="adminCardHead">
              <strong>Publish steps</strong>
            </div>
            <ol className="adminPublishSteps">
              <li>Edit an item and save the browser draft.</li>
              <li>Use GitHub mode on the deployed site, or Local mode with the helper server.</li>
              <li>Click Apply to repo.</li>
              <li>Reload the public page after the Pages workflow finishes.</li>
            </ol>
          </div>
        </aside>
      </section>
    </div>
  );
}
