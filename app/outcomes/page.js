"use client";

import { useState } from "react";
import pubs from "../../data/publications.json";
import Card from "../../components/Card";

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeAuthorList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    return value
      .split(/;|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function renderAuthors(authors, keyPrefix, firstAuthors = [], correspondingAuthors = []) {
  if (!authors) {
    return null;
  }
  const highlightNames = new Set([
    "sung beom cho",
    "s beom cho",
    "sb cho"
  ]);
  const firstList = normalizeAuthorList(firstAuthors);
  const corrList = normalizeAuthorList(correspondingAuthors);
  const firstSet = new Set(firstList.map(normalizeName));
  const corrSet = new Set(corrList.map(normalizeName));
  const names = authors.split(",").map((name) => name.trim()).filter(Boolean);

  return names.map((name, index) => {
    const norm = normalizeName(name);
    const isFirst = firstSet.has(norm);
    const isCorr = corrSet.has(norm);
    const markers = `${isFirst ? "\u2020" : ""}${isCorr ? "*" : ""}`;
    const isHighlight = highlightNames.has(norm);

    return (
      <span key={`${keyPrefix}-${index}`}>
        {index > 0 ? ", " : ""}
        {isHighlight ? (
          <strong className="authorHighlight">{name}</strong>
        ) : (
          <span>{name}</span>
        )}
        {markers ? <span className="authorMarker">{markers}</span> : null}
      </span>
    );
  });
}

export default function OutcomesPage() {
  const selected = pubs.selected;
  const [activeFilter, setActiveFilter] = useState("overall");

  const totalCount = selected.length;
  const entries = selected.map((pub, index) => {
    let groupKey = "2021";
    if (pub.year >= 2026) groupKey = "2026";
    else if (pub.year === 2025) groupKey = "2025";
    else if (pub.year === 2024) groupKey = "2024";
    else if (pub.year === 2023) groupKey = "2023";
    else if (pub.year === 2022) groupKey = "2022";

    return {
      ...pub,
      groupKey,
      globalIndex: totalCount - index
    };
  });

  const groupOrder = [
    { key: "2026", label: "2026" },
    { key: "2025", label: "2025" },
    { key: "2024", label: "2024" },
    { key: "2023", label: "2023" },
    { key: "2022", label: "2022" },
    { key: "2021", label: "~ 2021" }
  ];

  const filterOptions = [
    { key: "overall", label: "Overall" },
    ...groupOrder
  ];

  return (
    <div>
      {/* <section className="section outcomesListSection">
        <h2>Recent Selected Publications</h2>
        <div className="grid publicationGrid">
          {selected.map((p, idx) => {
            const url = p.url || `${scholarSearchBase}${encodeURIComponent(p.title)}`;

            return (
              <Card
                key={`${p.year}-${idx}`}
                title={
                  <span className="publicationTitleLine">
                    <span className="publicationIndex">{idx + 1}.</span>
                    <a className="publicationTitleLink" href={url} target="_blank" rel="noreferrer">
                      {p.title}
                    </a>
                  </span>
                }
              >
                <div className="publicationAuthors">
                  {renderAuthors(p.authors, `${p.year}-${idx}`, p.first_authors, p.corresponding_authors)}
                </div>
                <div className="publicationVenue">{p.venue}</div>
              </Card>
            );
          })}
        </div>
      </section> */}

      <section className="section outcomesListSection">
        <h2>Research Tools</h2>
        <div className="grid publicationGrid">
          <Card
            title={
              <span className="publicationTitleLine">
                <a
                  className="publicationTitleLink"
                  href="https://materials-recipe.streamlit.app/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Recipe Generator
                </a>
              </span>
            }
          >
            <div className="publicationAuthors">Open-access materials synthesis recipe generator</div>
          </Card>
          <Card
            title={
              <span className="publicationTitleLine">
                <a
                  className="publicationTitleLink"
                  href="https://oxsemi.yconnect.ai.kr/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Oxsemi
                </a>
              </span>
            }
          >
            <div className="publicationAuthors">Oxide semiconductor big-data analysis and synthesis recipe recommendations</div>
          </Card>
        </div>
      </section>

      <section className="section outcomesListSection">
        <div className="publicationHeadingRow">
          <h2>Publications</h2>
          <a
            className="publicationScholarLink"
            href={pubs.google_scholar_url}
            target="_blank"
            rel="noreferrer"
            aria-label="Open Google Scholar"
            title="Open Google Scholar"
          >
            <span className="scholarBadge" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                <path d="M12 4.6 3.2 8.7 12 12.8 20.8 8.7 12 4.6z" />
                <path d="M6.1 12.1v3.4c0 1.2 2.7 2.2 5.9 2.2s5.9-1 5.9-2.2v-3.4l-5.9 2.9-5.9-2.9z" />
              </svg>
            </span>
          </a>
        </div>
        <div className="publicationFilter">
          {filterOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              className={`publicationFilterButton${activeFilter === option.key ? " isActive" : ""}`}
              onClick={() => setActiveFilter(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
        {groupOrder.map(({ key, label }) => {
          const items = entries.filter((entry) => entry.groupKey === key);
          if (!items.length) return null;
          if (activeFilter !== "overall" && activeFilter !== key) return null;

          return (
            <div className="publicationYearBlock" key={key}>
              <h3 className="publicationYear">{label}</h3>
              <div className="grid publicationGrid">
                {items.map((p) => {
                  const url = p.url;

                  return (
                    <Card
                      key={`${p.year}-${p.globalIndex}`}
                      title={
                        <span className="publicationTitleLine">
                          <span className="publicationIndex">{p.globalIndex}.</span>
                          {url ? (
                            <a className="publicationTitleLink" href={url} target="_blank" rel="noreferrer">
                              {p.title}
                            </a>
                          ) : (
                            <span>{p.title}</span>
                          )}
                        </span>
                      }
                    >
                      <div className="publicationAuthors">
                        {renderAuthors(p.authors, `${p.year}-${p.globalIndex}`, p.first_authors, p.corresponding_authors)}
                      </div>
                      <div className="publicationVenue">{p.venue}</div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
