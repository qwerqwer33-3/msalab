"use client";

import { useMemo, useState } from "react";
import activities from "../../data/activities.json";
import Card from "../../components/Card";
import { withBasePath } from "../../lib/basePath";
import { useCmsCollection } from "../../lib/useCmsCollection";

const getImages = (item) =>
  Array.isArray(item.images) && item.images.length
    ? item.images
    : item.image
      ? [item.image]
      : [];

const formatDisplayDate = (date) => {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
};

const startsWithDateLikePrefix = (title) => /^\d{1,2}-\d{1,2}\/\d{2}\/\d{4}/.test(title || "");

export default function ActivitiesPage() {
  const liveActivities = useCmsCollection("activities", activities);
  const sorted = useMemo(
    () => [...liveActivities].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [liveActivities]
  );
  const [indexByKey, setIndexByKey] = useState({});
  const [activeKey, setActiveKey] = useState(null);
  const [modalIndex, setModalIndex] = useState(0);

  const moveSlide = (key, length, delta) => {
    setIndexByKey((prev) => {
      const current = prev[key] ?? 0;
      const next = (current + delta + length) % length;
      return { ...prev, [key]: next };
    });
  };

  const activeItem = sorted.find((e) => `${e.date}-${e.title}` === activeKey) ?? null;
  const activeImages = activeItem ? getImages(activeItem) : [];
  const activeImage = activeImages[modalIndex] ?? null;

  const openModal = (key, initialIndex) => {
    setActiveKey(key);
    setModalIndex(initialIndex);
  };

  const closeModal = () => {
    setActiveKey(null);
    setModalIndex(0);
  };

  const moveModal = (delta) => {
    if (!activeImages.length) return;
    setModalIndex((prev) => (prev + delta + activeImages.length) % activeImages.length);
  };

  return (
    <div>
      <section className="section">
        <h1>Activities</h1>
      </section>

      <section className="section">
        <div className="grid activitiesGrid">
          {sorted.map((e) => {
            const key = `${e.date}-${e.title}`;
            const images = getImages(e);
            const currentIdx = indexByKey[key] ?? 0;
            const currentImage = images[currentIdx];
            const showArrows = images.length > 1;

            return (
              <Card
                key={key}
                title={
                  startsWithDateLikePrefix(e.title)
                    ? e.title
                    : `${formatDisplayDate(e.date)} - ${e.title}`
                }
              >
                <div
                  className="activityMediaWrap activityMediaPreview"
                  role="button"
                  tabIndex={0}
                  onClick={() => openModal(key, currentIdx)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openModal(key, currentIdx);
                    }
                  }}
                >
                  {currentImage ? (
                    <img
                      src={withBasePath(currentImage)}
                      alt={`${e.title} ${currentIdx + 1}`}
                      className="activityImage"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null}
                  {showArrows ? (
                    <>
                      <button
                        type="button"
                        className="activityNav activityNavLeft"
                        aria-label={`Previous image for ${e.title}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          moveSlide(key, images.length, -1);
                        }}
                      >
                        {"<"}
                      </button>
                      <button
                        type="button"
                        className="activityNav activityNavRight"
                        aria-label={`Next image for ${e.title}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          moveSlide(key, images.length, 1);
                        }}
                      >
                        {">"}
                      </button>
                      <div className="activityCounter">
                        {currentIdx + 1}/{images.length}
                      </div>
                    </>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {activeItem ? (
        <div className="activityModalBackdrop" onClick={closeModal} role="presentation">
          <div className="activityModal" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="activityModalClose"
              onClick={closeModal}
              aria-label="Close details"
            >
              x
            </button>
            <h3 className="activityModalTitle">
              {startsWithDateLikePrefix(activeItem.title)
                ? activeItem.title
                : `${formatDisplayDate(activeItem.date)} - ${activeItem.title}`}
            </h3>
            <p className="activityModalDescription">{activeItem.description}</p>
            <div className="activityMediaWrap activityModalMedia">
              {activeImage ? (
                <img
                  src={withBasePath(activeImage)}
                  alt={`${activeItem.title} ${modalIndex + 1}`}
                  className="activityImage"
                  loading="eager"
                  decoding="sync"
                />
              ) : null}
              {activeImages.length > 1 ? (
                <>
                  <button
                    type="button"
                    className="activityNav activityNavLeft activityNavStatic"
                    aria-label={`Previous image for ${activeItem.title}`}
                    onClick={() => moveModal(-1)}
                  >
                    {"<"}
                  </button>
                  <button
                    type="button"
                    className="activityNav activityNavRight activityNavStatic"
                    aria-label={`Next image for ${activeItem.title}`}
                    onClick={() => moveModal(1)}
                  >
                    {">"}
                  </button>
                  <div className="activityCounter activityCounterStatic">
                    {modalIndex + 1}/{activeImages.length}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
