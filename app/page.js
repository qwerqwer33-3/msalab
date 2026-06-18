"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { withBasePath } from "../lib/basePath";
import { useCmsCollection } from "../lib/useCmsCollection";
import activitiesSeed from "../data/activities.json";
import members from "../data/members.json";
import newsSeed from "../data/news.json";
import research from "../data/research.json";

const slides = [
  {
    title: "AI-assisted Discovery",
    description: "Data-driven workflows for synthesis recipe generation.",
    image: "/images/Home/Research_3.opt.jpg"
  },
  {
    title: "Multiscale Modeling",
    description: "Linked atomistic, process, and device-scale simulations.",
    image: "/images/Home/Research_1.opt.jpg"
  },
  {
    title: "Nucleation Theory",
    description: "Phase formation pathways and synthesis condition design.",
    image: "/images/Research/nucleation-theory.png"
  },
  {
    title: "Battery Safety Modeling",
    description: "Thermo-electro-mechanical coupling for safer energy systems.",
    image: "/images/Home/Research_1.opt.jpg"
  },
  {
    title: "Semiconductor Materials",
    description: "Atomic-scale modeling of oxide and dielectric stacks.",
    image: "/images/Home/Research_2.opt.jpg"
  },
  {
    title: "Process & Manufacturing",
    description: "Simulation-guided electrode and device fabrication.",
    image: "/images/Home/Research_4.opt.jpg"
  }
];

const heroBackground = "/images/Home/msq-hero-generated.png";

const focusGroups = [
  {
    key: "AI",
    label: "AI",
    summary: "Data-driven materials discovery and synthesis recipe generation.",
    icon: "AI"
  },
  {
    key: "Multi-scale",
    label: "Multi-scale",
    summary: "Linked first-principles, process, and device-scale simulations.",
    icon: "MS"
  },
  {
    key: "Nucleation",
    label: "Nucleation",
    summary: "Phase formation, reaction pathways, and synthesis condition design.",
    icon: "NT"
  }
];

const memberOrder = [
  "Hyeon Woo Kim",
  "Han Uk Lee",
  "Min Sung Kang",
  "Dong Won Jeon",
  "Juhyeon Ha",
  "Jeu Shin",
  "Jonghun Seo",
  "Junhyuk Kang",
  "Ji Hoon Hong",
  "Jimin Kim",
  "Jindong Hwang",
  "Seojun Moon",
  "Sungjun Kim",
  "Jaeseon Yoo"
];

const memberTags = {
  "Hyeon Woo Kim": ["DFT/MD", "Nucleation"],
  "Han Uk Lee": ["DFT/MD", "AI", "Nucleation"],
  "Min Sung Kang": ["DFT/MD", "Multi-scale", "Nucleation"],
  "Dong Won Jeon": ["DFT/MD", "AI"],
  "Juhyeon Ha": ["AI"],
  "Jeu Shin": ["DFT/MD", "Multi-scale"],
  "Jonghun Seo": ["Multi-scale"],
  "Junhyuk Kang": ["DFT/MD", "Multi-scale"],
  "Ji Hoon Hong": ["DFT/MD", "AI"],
  "Jimin Kim": ["DFT/MD", "Nucleation"],
  "Jindong Hwang": ["DFT/MD", "AI"],
  "Seojun Moon": ["DFT/MD", "Nucleation"],
  "Sungjun Kim": ["DFT/MD", "Nucleation"],
  "Jaeseon Yoo": ["DFT/MD", "Nucleation"]
};

const memberMap = new Map(members.map((member) => [member.name, member]));

const focusProfiles = focusGroups.map((group) => {
  const people = memberOrder
    .filter((name) => {
      const member = memberMap.get(name);
      return member && member.category !== "Alumni" && (memberTags[name] || []).includes(group.key);
    })
    .map((name) => memberMap.get(name))
    .filter(Boolean);
  return { ...group, people };
});

const researchBySlug = new Map(research.map((topic) => [topic.slug, topic]));

const theoreticalHomeResearch = [
  {
    slug: "ai-assisted-synthesis-recipes"
  },
  {
    slug: "multiscale-multiphysics",
    title: "Multiscale Modeling"
  },
  {
    slug: "nucleation-theory"
  }
].map((item) => {
  const topic = researchBySlug.get(item.slug);
  if (!topic) return null;

  return {
    ...topic,
    title: item.title || topic.title,
    href: `/research/${topic.slug}`,
    session: "Theoretical Session"
  };
}).filter(Boolean);

const homeResearchAreas = theoreticalHomeResearch;

function formatDate(value) {
  const [year, month, day] = value.split("-");
  return `${year}.${month}.${day}`;
}

function getActivityImage(item) {
  if (Array.isArray(item.images) && item.images.length) {
    return item.images[0];
  }
  return item.image || null;
}

export default function HomePage() {
  const liveNews = useCmsCollection("news", newsSeed);
  const liveActivities = useCmsCollection("activities", activitiesSeed);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [loadedSlideIndexes, setLoadedSlideIndexes] = useState(() => {
    const initialIndexes = new Set([0]);
    if (slides.length > 1) {
      initialIndexes.add(1);
    }
    return initialIndexes;
  });

  const loadedSlides = useMemo(
    () => slides.map((slide, index) => ({ ...slide, shouldLoad: loadedSlideIndexes.has(index) })),
    [loadedSlideIndexes]
  );
  const sortedLatestNews = useMemo(
    () =>
      [...liveNews]
        .sort((a, b) => {
          const dateOrder = b.date.localeCompare(a.date);
          if (dateOrder !== 0) return dateOrder;
          return (a.sortOrder ?? 50) - (b.sortOrder ?? 50);
        })
        .slice(0, 3),
    [liveNews]
  );
  const latestActivities = useMemo(
    () => [...liveActivities].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 3),
    [liveActivities]
  );
  const featuredResearch = homeResearchAreas;

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused]);

  useEffect(() => {
    const nextIndex = (currentIndex + 1) % slides.length;
    setLoadedSlideIndexes((prev) => {
      if (prev.has(currentIndex) && prev.has(nextIndex)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(currentIndex);
      next.add(nextIndex);
      return next;
    });
  }, [currentIndex]);

  useEffect(() => {
    const elements = document.querySelectorAll(".reveal-on-scroll");
    if (!("IntersectionObserver" in window)) {
      elements.forEach((el) => el.classList.add("isVisible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("isVisible");
          } else {
            entry.target.classList.remove("isVisible");
          }
        });
      },
      { threshold: 0.18 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="homePage">
      {showWelcome ? (
        <div
          className="welcomeOverlay"
          role="dialog"
          aria-modal="true"
          aria-label="Welcome message"
          onClick={() => setShowWelcome(false)}
        >
          <div className="welcomeCard" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="welcomeClose"
              aria-label="Close welcome message"
              onClick={() => setShowWelcome(false)}
            >
              x
            </button>
            <h2>Welcome</h2>
            <p>
              Welcome to M-Square Laboratory. We study advanced materials, devices, and energy
              systems through AI-guided discovery, multiscale simulation, and nucleation-aware
              process modeling.
            </p>
          </div>
        </div>
      ) : null}

      <section className="section hero homeHero">
        <div className="homeHeroBackdrop" aria-hidden="true">
          <img src={withBasePath(heroBackground)} alt="" />
        </div>
        <div className="homeHeroVeil" aria-hidden="true" />
        <div className="homeHeroCopy reveal-on-scroll">
          <p className="homeEyebrow">Sungkyunkwan University Materials Modeling Laboratory</p>
          <h1 className="heroTitle">M-Square Laboratory</h1>
          <div className="homeHeroSignal">
            <span>AI-Guided Discovery</span>
            <span>Multiscale Modeling</span>
            <span>Nucleation Theory</span>
          </div>
          <p className="heroSubtitle">
            AI-guided discovery, multiscale simulation, and nucleation-aware process modeling for
            advanced materials and devices.
          </p>
          <div className="homeHeroActions" aria-label="Primary links">
            <Link className="homeButton homeButtonPrimary" href="/research">
              Explore Research
            </Link>
            <Link className="homeButton homeButtonSecondary" href="/members/current">
              Meet the Team
            </Link>
          </div>
        </div>

        <div className="homeHeroMedia reveal-on-scroll">
          <div className="heroSlider">
            <div className="sliderView">
              <div className="sliderOverlay">
                <button
                  type="button"
                  className="sliderOverlayButton sliderOverlayButton--left"
                  onClick={goPrev}
                  aria-label="Previous slide"
                >
                  <svg viewBox="0 0 24 24" role="presentation">
                    <path d="M15 6l-6 6 6 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  className={`sliderOverlayButton sliderOverlayButton--center ${
                    isPaused ? "isPlay" : "isPause"
                  }`}
                  onClick={() => setIsPaused((prev) => !prev)}
                  aria-pressed={isPaused}
                  aria-label={isPaused ? "Play slideshow" : "Pause slideshow"}
                >
                  <svg className="iconPlay" viewBox="0 0 24 24" role="presentation">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <svg className="iconPause" viewBox="0 0 24 24" role="presentation">
                    <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="sliderOverlayButton sliderOverlayButton--right"
                  onClick={goNext}
                  aria-label="Next slide"
                >
                  <svg viewBox="0 0 24 24" role="presentation">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
              <div className="sliderTrack">
                {loadedSlides.map((slide, index) => {
                  const shouldLoad = slide.shouldLoad || index === currentIndex;
                  const isPrioritySlide = index === 0 || index === currentIndex;
                  return (
                    <div className={`slide${index === currentIndex ? " isActive" : ""}`} key={slide.title}>
                      {shouldLoad ? (
                        <img
                          src={withBasePath(slide.image)}
                          alt={slide.title}
                          loading={isPrioritySlide ? "eager" : "lazy"}
                          decoding="async"
                          fetchPriority={isPrioritySlide ? "high" : "auto"}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <div className="homeSlideCaption">
                <strong>{slides[currentIndex].title}</strong>
                <span>{slides[currentIndex].description}</span>
              </div>
            </div>
            <div className="sliderDots" aria-label="Slideshow pagination">
              {slides.map((slide, index) => (
                <button
                  key={slide.title}
                  type="button"
                  className={`sliderDot${index === currentIndex ? " isActive" : ""}`}
                  aria-label={`Slide ${index + 1}`}
                  aria-pressed={index === currentIndex}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section homeIntroSection reveal-on-scroll">
        <div className="homeIntroText">
          <p className="homeEyebrow">What we do</p>
          <h2>AI-guided materials design from multiscale mechanisms to nucleation-aware processes.</h2>
        </div>
        <p className="homeIntroBody">
          MSQ Lab connects machine learning, multiscale simulation, and nucleation-centered modeling
          to understand materials behavior and guide better design decisions in electronics,
          energy storage, synthesis, and manufacturing.
        </p>
      </section>

      <section className="section homeResearchSection">
        <div className="sectionHeader reveal-on-scroll">
          <p className="homeEyebrow">Research</p>
          <h2>Research Areas</h2>
          <p className="sectionDescription">
            A compact preview of the AI, multiscale, and nucleation tracks behind the lab's current projects.
          </p>
        </div>
        <div className="homeResearchGrid">
          {featuredResearch.map((topic, index) => (
            <Link
              className="homeResearchCard reveal-on-scroll"
              href={topic.href}
              key={`${topic.session}-${topic.title}`}
              style={{ transitionDelay: `${index * 70}ms` }}
            >
              <div className="homeResearchImage">
                <img src={withBasePath(topic.image)} alt={topic.title} loading="lazy" decoding="async" />
              </div>
              <div className="homeResearchCopy">
                <div className="homeResearchMeta">
                  <span className="homeResearchIndex">{String(index + 1).padStart(2, "0")}</span>
                  <span className="homeResearchSession">{topic.session}</span>
                </div>
                <h3>{topic.title}</h3>
                <p>{topic.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section homeFocusSection">
        <div className="sectionHeader reveal-on-scroll">
          <p className="homeEyebrow">People</p>
          <h2>Research Groups</h2>
          <p className="sectionDescription">Students grouped by core modeling approach.</p>
        </div>
        <div className="homeFocusGrid">
          {focusProfiles.map((group, index) => (
            <div
              className="homeFocusCard reveal-on-scroll"
              key={group.key}
              style={{ transitionDelay: `${index * 90}ms` }}
            >
              <div className="homeFocusHeader">
                <span className="homeFocusIcon" aria-hidden="true">
                  {group.icon}
                </span>
                <div>
                  <h3 className="homeFocusTitle">{group.label}</h3>
                  <p className="homeFocusSummary">{group.summary}</p>
                </div>
              </div>
              <div className="homeFocusAvatars">
                {group.people.slice(0, 6).map((person) => (
                  <div className="homeFocusAvatar" key={`${group.key}-${person.name}`}>
                    <img src={withBasePath(person.photo)} alt={person.name} loading="lazy" decoding="async" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section homeUpdatesSection">
        <div className="homeUpdatesGrid">
          <div className="homeUpdatePanel reveal-on-scroll">
            <div className="sectionHeader">
              <p className="homeEyebrow">News</p>
              <h2>Latest News</h2>
            </div>
            <div className="homePublicationList">
              {sortedLatestNews.map((item) => (
                <Link
                  className="homePublication"
                  href="/news"
                  key={item.id}
                >
                  <span>{formatDate(item.date)}</span>
                  <strong>{item.title}</strong>
                  <em>{item.text}</em>
                </Link>
              ))}
            </div>
          </div>

          <div className="homeUpdatePanel reveal-on-scroll">
            <div className="sectionHeader">
              <p className="homeEyebrow">Lab Life</p>
              <h2>Latest Activities</h2>
            </div>
            <div className="homeActivityList">
              {latestActivities.map((item) => {
                const image = getActivityImage(item);
                return (
                  <Link className="homeActivity" href="/activities" key={`${item.date}-${item.title}`}>
                    {image ? (
                      <img src={withBasePath(image)} alt={item.title} loading="lazy" decoding="async" />
                    ) : null}
                    <span>
                      <strong>{item.title}</strong>
                      <em>{formatDate(item.date)}</em>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
