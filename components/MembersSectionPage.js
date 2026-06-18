"use client";

import { useState } from "react";
import Link from "next/link";
import members from "../data/members.json";
import Card from "./Card";
import { withBasePath } from "../lib/basePath";

const currentSectionOrder = [
  { id: "postdoc", keys: ["Postdoc"], label: "Postdoctoral Researcher" },
  {
    id: "phd",
    keys: ["Ph.D.", "Integrated Ph.D."],
    label: "Ph.D. / Integrated Ph.D. Students"
  },
  { id: "masters", keys: ["Masters"], label: "M.S. Students" },
  { id: "undergrad", keys: ["Undergrad"], label: "Undergraduates" }
];

const alumniSectionOrder = [
  { id: "alumni", keys: ["Alumni"], label: "Alumni" }
];

const alumniCareerTrackConfig = {
  academia: {
    key: "academia",
    label: "Academia",
    color: "#5568a6"
  },
  graduate: {
    key: "graduate",
    label: "Study",
    color: "#5f8f76"
  },
  research: {
    key: "research",
    label: "Research",
    color: "#8577ba"
  },
  industry: {
    key: "industry",
    label: "Industry",
    color: "#ce8050"
  },
  exploring: {
    key: "exploring",
    label: "Exploring",
    color: "#92a0b3"
  }
};

const alumniCareerTrackOrder = ["academia", "research", "graduate", "industry", "exploring"];

const alumniCareerTrackManualByName = {
  "Junhyuk Kang": "industry",
  "Jun Hyuk Kang": "industry",
  "Hyunseok Ko": "research",
  "Giulio Fatti": "academia",
  "Upendra Kumar": "research",
  "Donggeon Lee": "industry",
  "Sangmin Jeong": "industry",
  "Sanggu Lee": "industry",
  "Yujeong Park": "industry",
  "Woongchan Kim": "industry",
  "Suyeon Jang": "graduate",
  "Gihwan Kim": "exploring"
};

function getManualCareerTrackByName(name) {
  const normalizedName = (name || "").trim();
  return alumniCareerTrackManualByName[normalizedName] || null;
}

function hexToRgba(hex, alpha) {
  if (typeof hex !== "string") {
    return `rgba(15, 23, 42, ${alpha})`;
  }
  const cleaned = hex.trim().replace("#", "");
  const normalized =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((ch) => `${ch}${ch}`)
          .join("")
      : cleaned;
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return `rgba(15, 23, 42, ${alpha})`;
  }
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function normalizeAlumniCareerTrack(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (
    normalized === "academia" ||
    normalized === "academic" ||
    normalized === "faculty" ||
    normalized === "university"
  ) {
    return "academia";
  }
  if (
    normalized === "graduate" ||
    normalized === "study" ||
    normalized === "graduate study" ||
    normalized === "further study" ||
    normalized === "higher education"
  ) {
    return "graduate";
  }
  if (
    normalized === "research" ||
    normalized === "research institute" ||
    normalized === "research sector" ||
    normalized === "institute"
  ) {
    return "research";
  }
  if (
    normalized === "industry" ||
    normalized === "company" ||
    normalized === "corporate" ||
    normalized === "private sector"
  ) {
    return "industry";
  }
  if (
    normalized === "exploring" ||
    normalized === "in transition" ||
    normalized === "open" ||
    normalized === "unknown" ||
    normalized === "unspecified" ||
    normalized === "tbd"
  ) {
    return "exploring";
  }
  return null;
}

function inferAlumniCareerTrack(member) {
  const explicitTrack =
    normalizeAlumniCareerTrack(member.careerTrack) ||
    normalizeAlumniCareerTrack(member.currentTrack) ||
    normalizeAlumniCareerTrack(member.currentCategory);
  if (explicitTrack) {
    return explicitTrack;
  }
  return getManualCareerTrackByName(member.name) || "exploring";
}

function getAlumniCareerTrackStats(alumniMembers) {
  const counts = alumniCareerTrackOrder.reduce((accumulator, key) => {
    accumulator[key] = 0;
    return accumulator;
  }, {});

  alumniMembers.forEach((member) => {
    const key = inferAlumniCareerTrack(member);
    counts[key] += 1;
  });

  return alumniCareerTrackOrder.map((key) => ({
    ...alumniCareerTrackConfig[key],
    count: counts[key]
  }));
}

function renderHighlightedText(text, highlights) {
  const safeText = text || "";
  const safeHighlights = Array.isArray(highlights) ? highlights.filter(Boolean) : [];
  if (!safeHighlights.length) {
    return safeText;
  }

  const highlighted = [];
  let cursor = 0;
  let keyIndex = 0;
  const orderedHighlights = [...safeHighlights].sort(
    (a, b) => safeText.indexOf(a) - safeText.indexOf(b)
  );

  orderedHighlights.forEach((segment) => {
    const start = safeText.indexOf(segment, cursor);
    if (start === -1) {
      return;
    }
    if (start > cursor) {
      highlighted.push(
        <span key={`text-${keyIndex++}`}>
          {safeText.slice(cursor, start)}
        </span>
      );
    }
    highlighted.push(
      <span key={`strong-${keyIndex++}`} className="memberOutcomeHighlight">
        {segment}
      </span>
    );
    cursor = start + segment.length;
  });

  if (cursor < safeText.length) {
    highlighted.push(
      <span key={`text-${keyIndex++}`}>
        {safeText.slice(cursor)}
      </span>
    );
  }

  return highlighted;
}

function formatPeopleCount(count) {
  const safeCount = Number.isFinite(count) ? count : 0;
  return `${safeCount} ${safeCount === 1 ? "person" : "people"}`;
}

function parseYearMonth(value) {
  if (!value || typeof value !== "string") {
    return null;
  }
  const matches = [...value.matchAll(/(\d{4})[.\-/](\d{1,2})(?:[.\-/](\d{1,2}))?/g)];
  if (!matches.length) {
    return null;
  }
  const last = matches[matches.length - 1];
  const year = Number(last[1]);
  const month = Number(last[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return null;
  }
  return year * 100 + month;
}

function getAlumniSortValue(member) {
  const fromExplicit = parseYearMonth(member.alumniSince);
  if (fromExplicit !== null) {
    return fromExplicit;
  }

  if (!Array.isArray(member.education) || !member.education.length) {
    return null;
  }

  const derived = member.education
    .map((entry) => parseYearMonth(entry))
    .filter((value) => value !== null);

  if (!derived.length) {
    return null;
  }
  return Math.max(...derived);
}

function sortAlumniByRecent(list) {
  return [...list].sort((a, b) => {
    const aValue = getAlumniSortValue(a);
    const bValue = getAlumniSortValue(b);

    if (aValue !== null && bValue === null) {
      return -1;
    }
    if (aValue === null && bValue !== null) {
      return 1;
    }
    if (aValue === bValue) {
      return b._sourceIndex - a._sourceIndex;
    }
    return bValue - aValue;
  });
}

export default function MembersSectionPage({ view = "current" }) {
  const [openDetails, setOpenDetails] = useState({});
  const indexedMembers = members.map((member, index) => ({
    ...member,
    _sourceIndex: index
  }));
  const isAlumniTestView = view === "alumni_test";
  const isAlumniView = view === "alumni" || isAlumniTestView;
  const isAlumniLikeView = isAlumniView;
  const pageTitle = isAlumniView ? "Alumni" : "Current Members";
  const sectionOrder = isAlumniLikeView ? alumniSectionOrder : currentSectionOrder;

  const grouped = sectionOrder.map((section) => {
    const filtered = indexedMembers.filter((member) => section.keys.includes(member.category));
    return {
      ...section,
      members: section.id === "alumni" ? sortAlumniByRecent(filtered) : filtered
    };
  });
  const alumniMembers = grouped.find((section) => section.id === "alumni")?.members || [];
  const alumniCareerStats = isAlumniView ? getAlumniCareerTrackStats(alumniMembers) : [];
  const alumniCareerTotal = alumniCareerStats.reduce((sum, item) => sum + item.count, 0);
  const alumniCareerStatsWithShare = alumniCareerStats.map((item) => ({
    ...item,
    share: alumniCareerTotal ? (item.count / alumniCareerTotal) * 100 : 0
  }));

  return (
    <div>
      <section className="section">
        <div className="sectionHeader">
          <h1>{pageTitle}</h1>
          <div className="publicationFilter">
            <Link
              href="/members/current"
              className={`publicationFilterButton ${!isAlumniLikeView ? "isActive" : ""}`}
            >
              Current Members
            </Link>
            <Link
              href="/members/alumni"
              className={`publicationFilterButton ${isAlumniView ? "isActive" : ""}`}
            >
              Alumni
            </Link>
          </div>
        </div>
      </section>

      {isAlumniView ? (
        <section className="section">
          <div className="card alumniCareerPanel">
            <div className="alumniCareerHeading">
              <div className="alumniCareerTopRow">
                <h2 className="alumniCareerTitle">Alumni Career Snapshot</h2>
                <div className="alumniCareerTotalPill" aria-label="Total alumni">
                  <span className="alumniCareerTotalLabel">Total Alumni</span>
                  <strong className="alumniCareerTotalValue">{alumniCareerTotal}</strong>
                </div>
              </div>
            </div>
            <div
              className="alumniCareerBar"
              role="img"
              aria-label={`Career distribution for ${alumniCareerTotal} alumni`}
            >
              {alumniCareerStatsWithShare.map((item) => (
                <span
                  key={item.key}
                  className="alumniCareerBarSegment"
                  style={{ width: `${item.share}%`, backgroundColor: item.color }}
                />
              ))}
            </div>
            <ul className="alumniCareerStats">
              {alumniCareerStatsWithShare.map((item) => (
                <li key={item.key} className="alumniCareerStat">
                  <span className="alumniCareerStatLabelWrap">
                    <span
                      className="alumniCareerLegendDot"
                      style={{ backgroundColor: item.color }}
                      aria-hidden="true"
                    />
                    <span className="alumniCareerStatLabel">{item.label}</span>
                  </span>
                  <span className="alumniCareerStatMeta">
                    <span className="alumniCareerStatCount">{formatPeopleCount(item.count)}</span>
                    <span className="alumniCareerStatMetaDivider" aria-hidden="true">
                      |
                    </span>
                    <span className="alumniCareerStatPercent">{item.share.toFixed(1)}%</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {grouped.map((section) =>
        section.members.length ? (
          <section className="section" key={section.id}>
            {!isAlumniLikeView ? <h2>{section.label}</h2> : null}
            <div className="grid membersGrid membersGrid--twoCol">
              {section.members.map((m, idx) => {
                const detailsId = `${section.id}-${idx}`;
                const isOpen = Boolean(openDetails[detailsId]);
                const application = m.application || (m.research && m.research[0]);
                const summaryTags = m.summaryTags && m.summaryTags.length ? m.summaryTags : null;
                const applicationItems =
                  m.applicationDetails && m.applicationDetails.length
                    ? m.applicationDetails
                    : null;
                const hasApplicationDetails = Boolean(applicationItems);
                const outcomes = m.outcomes && m.outcomes.length ? m.outcomes : null;
                const hasOutcomes = Boolean(outcomes);
                const hasMoreDetails =
                  (m.education && m.education.length) ||
                  hasApplicationDetails ||
                  hasOutcomes;
                const scholarUrl = m.scholar_url || m.scholar || m.google_scholar;
                const careerTrackKey = isAlumniView ? inferAlumniCareerTrack(m) : null;
                const careerTrack =
                  careerTrackKey && alumniCareerTrackConfig[careerTrackKey]
                    ? alumniCareerTrackConfig[careerTrackKey]
                    : null;

                return (
                  <Card key={m.name}>
                    <div className="memberHeader">
                      <div className="cardTitle">
                        {m.name}
                        {m.titleBadge ? ` (${m.titleBadge})` : ""}
                      </div>
                      <div className="memberWebsite">
                        {scholarUrl ? (
                          <a
                            className="memberScholarLink"
                            href={scholarUrl}
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
                        ) : (
                          <span
                            className="memberScholarLink memberScholarLink--disabled"
                            aria-label="Google Scholar not available"
                            title="Google Scholar not available"
                          >
                            <span className="scholarBadge" aria-hidden="true">
                              <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                                <path d="M12 4.6 3.2 8.7 12 12.8 20.8 8.7 12 4.6z" />
                                <path d="M6.1 12.1v3.4c0 1.2 2.7 2.2 5.9 2.2s5.9-1 5.9-2.2v-3.4l-5.9 2.9-5.9-2.9z" />
                              </svg>
                            </span>
                          </span>
                        )}
                        {m.website ? (
                          <a
                            className="memberHomeLink"
                            href={m.website}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="Open personal site"
                            title="Open personal site"
                          >
                            <span className="memberHomeBadge" aria-hidden="true">
                              <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                                <path d="M12 4.2 3 11.6h2.6V20h4.8v-5.2h3.2V20h4.8v-8.4H21L12 4.2z" />
                              </svg>
                            </span>
                          </a>
                        ) : (
                          <span
                            className="memberHomeLink memberHomeLink--disabled"
                            aria-label="Personal site not available"
                            title="Personal site not available"
                          >
                            <span className="memberHomeBadge" aria-hidden="true">
                              <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                                <path d="M12 4.2 3 11.6h2.6V20h4.8v-5.2h3.2V20h4.8v-8.4H21L12 4.2z" />
                              </svg>
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="memberCardContent memberCardContent--details">
                      <div className="memberPhoto">
                        <img src={withBasePath(m.photo)} alt={m.name} loading="lazy" decoding="async" />
                      </div>
                      <div className="memberInfo">
                        {careerTrack ? (
                          <span
                            className="memberCareerBadge"
                            style={{
                              "--career-track-color": careerTrack.color,
                              "--career-track-text": careerTrack.color,
                              "--career-track-bg": hexToRgba(careerTrack.color, 0.32),
                              "--career-track-border": hexToRgba(careerTrack.color, 0.62)
                            }}
                          >
                            <span
                              className="memberCareerBadgeDot"
                              style={{ backgroundColor: careerTrack.color }}
                              aria-hidden="true"
                            />
                            <span>Career Track: {careerTrack.label}</span>
                          </span>
                        ) : null}
                        <ul className="memberSummaryList">
                          {m.category !== "Alumni" && m.role ? <li>{m.role}</li> : null}
                          {m.category !== "Alumni" && m.affiliation ? <li>{m.affiliation}</li> : null}
                          {summaryTags
                            ? summaryTags.map((tag) => <li key={tag}>{tag}</li>)
                            : application
                              ? <li>{application}</li>
                              : null}
                          {m.email ? (
                            <li className="memberEmailInline">
                              <a href={`mailto:${m.email}`}>{m.email}</a>
                            </li>
                          ) : null}
                          {m.coAdvisor ? (
                            <li>Co-advisor: {m.coAdvisor}</li>
                          ) : null}
                          {m.currentAffiliation ? (
                            <li>Current: {m.currentAffiliation}</li>
                          ) : null}
                        </ul>
                        {hasMoreDetails ? (
                          <button
                            type="button"
                            className="memberDetailsButton"
                            aria-expanded={isOpen}
                            aria-controls={`${detailsId}-details`}
                            onClick={() =>
                              setOpenDetails((prev) => ({
                                ...prev,
                                [detailsId]: !prev[detailsId]
                              }))
                            }
                          >
                            More details
                          </button>
                        ) : null}
                      </div>
                      {hasMoreDetails && isOpen ? (
                        <div
                          id={`${detailsId}-details`}
                          className="memberDetailsRow"
                          role="region"
                          aria-label={`${m.name} details`}
                        >
                          <div className="memberDetailStack">
                            {m.education && (
                              <div className="memberDetailBlock">
                                <strong className="memberDetailLabel memberDetailLabel--emphasis">
                                  Education
                                </strong>
                                <ul className="bioList">
                                  {m.education.map((entry) => {
                                    const [date, rest] = entry.split(": ");
                                    return (
                                      <li key={entry}>
                                        {rest ? (
                                          <>
                                            <span className="educationDate">{date}:</span>{" "}
                                            <span>{rest}</span>
                                          </>
                                        ) : (
                                          entry
                                        )}
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            )}
                            {hasApplicationDetails ? (
                              <div className="memberDetailBlock">
                                <strong className="memberDetailLabel memberDetailLabel--emphasis">
                                  {m.applicationLabel || "Research Interests"}
                                </strong>
                                <ul className="researchDetailList">
                                  {applicationItems.map((item) => (
                                    <li key={item}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                            {hasOutcomes ? (
                              <div className="memberDetailBlock">
                                <strong className="memberDetailLabel memberDetailLabel--emphasis">
                                  {m.outcomesLabel || "Outcomes"}
                                </strong>
                                <ul className="researchDetailList">
                                  {outcomes.map((item) => {
                                    if (typeof item === "string") {
                                      return <li key={item}>{item}</li>;
                                    }
                                    if (item && item.title) {
                                      const key = `${item.title}-${item.url || ""}`;
                                      return (
                                        <li key={key}>
                                          {item.url ? (
                                            <a
                                              href={item.url}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="memberOutcomeLink"
                                            >
                                              {item.title}
                                            </a>
                                          ) : (
                                            <span>{item.title}</span>
                                          )}
                                          {item.detail ? (
                                            <span className="memberOutcomeDetail">
                                              , {renderHighlightedText(item.detail, item.highlights)}
                                            </span>
                                          ) : null}
                                        </li>
                                      );
                                    }
                                    const text = item.text || "";
                                    const highlights = Array.isArray(item.highlights)
                                      ? item.highlights.filter(Boolean)
                                      : [];
                                    return <li key={text}>{renderHighlightedText(text, highlights)}</li>;
                                  })}
                                </ul>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        ) : null
      )}
    </div>
  );
}

