import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const failures = [];

const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

assert(exists("data/news.json"), "data/news.json should exist so news can be edited outside page code.");
assert(exists("next.config.js"), "next.config.js should exist for static export settings.");

if (exists("next.config.js")) {
  const nextConfig = read("next.config.js");
  assert(
    nextConfig.includes("outputFileTracingRoot"),
    "next.config.js should pin outputFileTracingRoot to this project."
  );
  assert(
    nextConfig.includes("GITHUB_REPOSITORY"),
    "next.config.js should derive the GitHub Pages base path from the repository name."
  );
}

if (exists("data/news.json")) {
  const news = JSON.parse(read("data/news.json"));
  assert(Array.isArray(news), "data/news.json should contain an array.");
  assert(news.length >= 2, "data/news.json should include the current news items.");
  for (const [index, item] of news.entries()) {
    assert(typeof item.id === "string" && item.id, `news item ${index} should have an id.`);
    assert(/^\d{4}-\d{2}-\d{2}$/.test(item.date), `news item ${index} should use YYYY-MM-DD date.`);
    assert(typeof item.title === "string" && item.title, `news item ${index} should have a title.`);
    assert(typeof item.text === "string" && item.text, `news item ${index} should have text.`);
  }
}

assert(exists("app/admin/page.js"), "app/admin/page.js should define the hidden admin route.");
assert(exists("app/admin/AdminConsole.js"), "app/admin/AdminConsole.js should contain the editor UI.");

if (exists("app/news/page.js")) {
  assert(
    read("app/news/page.js").includes("../../data/news.json"),
    "News page should import data/news.json."
  );
}

if (exists("app/page.js")) {
  assert(
    read("app/page.js").includes("../data/news.json"),
    "Home page should import data/news.json for Latest News."
  );
}

if (exists("app/admin/AdminConsole.js")) {
  const admin = read("app/admin/AdminConsole.js");
  assert(admin.includes("data/news.json"), "Admin console should export data/news.json.");
  assert(admin.includes("data/activities.json"), "Admin console should export data/activities.json.");
  assert(admin.includes("msq-admin-draft"), "Admin console should persist browser drafts.");
  assert(admin.includes("LAB_EMAIL_DOMAINS"), "Admin console should gate prototype access by lab email domain.");
  assert(admin.includes("editingKey"), "Admin console should track which item is being edited.");
  assert(admin.includes("Edit"), "Admin console should expose an explicit Edit button.");
  assert(admin.includes("Save draft"), "Admin console should expose an explicit Save draft button.");
  assert(admin.includes("disabled={!editing}"), "Admin fields should be locked until an item is being edited.");
  assert(admin.includes("Apply to repo"), "Admin console should expose an explicit Apply to repo button.");
  assert(admin.includes("MSQ_ADMIN_APPLY_ENDPOINT"), "Admin console should call the local apply endpoint.");
  assert(admin.includes("applyToRepo"), "Admin console should implement applying exported JSON to the repository.");
  assert(admin.includes("applyMode"), "Admin console should let the user choose local or deployed apply mode.");
  assert(admin.includes("githubTargetPaths"), "Admin console should map editable data to GitHub repository paths.");
  assert(admin.includes("applyViaGitHub"), "Admin console should support applying changes through the GitHub API.");
  assert(admin.includes("api.github.com/repos"), "Admin console should call GitHub's repository contents API.");
  assert(admin.includes("githubToken"), "Admin console should accept a session-only GitHub token for deployed publishing.");
  assert(admin.includes("qwerqwer33-3"), "Admin console should default to the current GitHub owner.");
  assert(admin.includes("msalab"), "Admin console should default to the test GitHub repository.");
  assert(admin.includes("public/cms/news.json"), "Admin console should publish news runtime CMS data to GitHub.");
  assert(admin.includes("public/cms/activities.json"), "Admin console should publish activity runtime CMS data to GitHub.");
  assert(admin.includes("pendingUploads"), "Admin console should track pending image uploads for activities.");
  assert(admin.includes("handleActivityImageUpload"), "Admin console should let users attach image files to activities.");
  assert(admin.includes('type="file"'), "Activity editor should expose a file picker for images.");
  assert(admin.includes('accept="image/*"'), "Activity image picker should accept image files.");
  assert(admin.includes("readFileAsBase64"), "Admin console should convert selected images for GitHub/local apply.");
  assert(admin.includes("activityUploadBasePath"), "Admin console should generate activity image paths.");
  assert(admin.includes("writePendingGithubUploads"), "GitHub apply should upload pending activity images.");
  assert(admin.includes("uploads:"), "Local apply payload should include pending activity image uploads.");
  assert(
    !admin.includes("localStorage.setItem(\"msq-admin-github-token\""),
    "Admin console should not persist GitHub tokens in localStorage."
  );
  assert(exists("scripts/admin-apply-server.mjs"), "A local apply server should exist for writing CMS JSON files.");
  if (exists("scripts/admin-apply-server.mjs")) {
    const applyServer = read("scripts/admin-apply-server.mjs");
    assert(applyServer.includes("public/images/Activities"), "Local apply server should write activity image uploads.");
    assert(applyServer.includes("out/images/Activities"), "Local apply server should refresh static activity images.");
    assert(applyServer.includes("contentBase64"), "Local apply server should accept base64 image uploads.");
    assert(applyServer.includes("writeUpload"), "Local apply server should validate and write uploaded images.");
  }
  assert(exists("public/cms/news.json"), "public/cms/news.json should exist for runtime news updates.");
  assert(exists("public/cms/activities.json"), "public/cms/activities.json should exist for runtime activity updates.");
}

if (exists("app/news/page.js")) {
  assert(read("app/news/page.js").includes('useCmsCollection("news"'), "News page should load live CMS news.");
}

if (exists("app/activities/page.js")) {
  assert(
    read("app/activities/page.js").includes('useCmsCollection("activities"'),
    "Activities page should load live CMS activities."
  );
}

if (exists("app/page.js")) {
  const home = read("app/page.js");
  assert(home.includes('useCmsCollection("news"'), "Home page should load live CMS news.");
  assert(home.includes('useCmsCollection("activities"'), "Home page should load live CMS activities.");
}

if (exists("components/Nav.js")) {
  assert(!read("components/Nav.js").includes("/admin"), "Admin route should stay hidden from the public nav.");
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Admin prototype structure looks good.");
