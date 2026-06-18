const clone = (value) => JSON.parse(JSON.stringify(value));

const today = () => new Date().toISOString().slice(0, 10);

export const imageLines = (value = "") =>
  String(value)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

export const activityImages = (item) => {
  if (Array.isArray(item.images) && item.images.length) return item.images;
  if (item.image) return [item.image];
  return [];
};

const activityKey = (item) =>
  `${item.date || ""}::${String(item.title || "")
    .trim()
    .toLowerCase()}`;

export const createActivityImageFallbacks = (items = []) => {
  const fallbacks = new Map();
  for (const item of items) {
    const images = activityImages(item);
    const key = activityKey(item);
    if (key && images.length) {
      fallbacks.set(key, images.join("\n"));
    }
  }
  return fallbacks;
};

const activityImageText = (item, imageFallbacks) => {
  const typedImages =
    typeof item.imagesText === "string" ? imageLines(item.imagesText).join("\n") : "";
  const directImages = activityImages(item).join("\n");
  const fallbackImages = imageFallbacks?.get(activityKey(item)) || "";
  return typedImages || directImages || fallbackImages;
};

export const normalizeActivities = (items, imageFallbacks = new Map()) =>
  clone(items).map((item) => ({
    date: item.date || today(),
    title: item.title || "",
    description: item.description || "",
    imagesText: activityImageText(item, imageFallbacks)
  }));

export const serializeActivities = (items) =>
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
