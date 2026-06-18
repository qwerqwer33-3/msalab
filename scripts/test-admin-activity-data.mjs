import assert from "node:assert/strict";
import activitiesSeed from "../data/activities.json" with { type: "json" };
import {
  createActivityImageFallbacks,
  normalizeActivities,
  serializeActivities
} from "../lib/adminActivityData.mjs";

const hasImages = (item) => Boolean(item.image || (Array.isArray(item.images) && item.images.length));

const brokenStoredDraft = activitiesSeed.map(({ date, title, description }) => ({
  date,
  title,
  description,
  imagesText: ""
}));

const restored = serializeActivities(
  normalizeActivities(
    [
      {
        date: "2026-06-18",
        title: "New activity",
        description: "A newly added activity.",
        imagesText: "/images/Activities/2026.06.18-new-activity.jpg"
      },
      ...brokenStoredDraft
    ],
    createActivityImageFallbacks(activitiesSeed)
  )
);

assert.equal(restored.length, activitiesSeed.length + 1);
assert.equal(restored.filter(hasImages).length, activitiesSeed.filter(hasImages).length + 1);

const birthday = restored.find((item) => item.title === "Happy Birthday, Juhyeon!");
assert.equal(birthday.image, "/images/Activities/2026.03.18.jpg");

const graduation = restored.find((item) => item.title === "Graduation Ceremony");
assert.deepEqual(graduation.images, [
  "/images/Activities/2026.02.20_1.jpg",
  "/images/Activities/2026.02.20_2.jpg"
]);

console.log("Admin activity image data survives stale browser drafts.");
