const resolveBasePath = () => {
  if (process.env.NEXT_PUBLIC_BASE_PATH) {
    return process.env.NEXT_PUBLIC_BASE_PATH;
  }
  if (typeof window === "undefined") {
    return "";
  }
  if (!window.location.host.endsWith("github.io")) {
    return "";
  }
  const parts = window.location.pathname.split("/").filter(Boolean);
  return parts.length ? `/${parts[0]}` : "";
};

export const withBasePath = (path = "") => {
  if (!path) return path;
  const basePath = resolveBasePath();
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("mailto:") ||
    path.startsWith("tel:") ||
    path.startsWith("#")
  ) {
    return path;
  }
  if (basePath && path.startsWith(basePath)) {
    return path;
  }
  if (path.startsWith("/")) {
    return `${basePath}${path}`;
  }
  return path;
};
