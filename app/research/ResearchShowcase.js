"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { withBasePath } from "../../lib/basePath";

function ResearchFlowLead({ topic, priority = false, sessionKey }) {
  const body = (
    <>
      <div className="researchFlowLeadFrame">
        <div className="researchFlowLeadMedia">
          <img
            src={withBasePath(topic.image)}
            alt={topic.title}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
          />
        </div>
      </div>
      <div className="researchFlowLeadFooter">
        <div className="researchFlowLeadFooterTop">
          <span className="researchFlowLeadTag">
            {sessionKey === "theoretical" ? "Theory Focus" : "Application Focus"}
          </span>
          {topic.href ? <span className="researchFlowLeadHint">Open topic</span> : null}
        </div>
        <h3 className="researchFlowLeadTitle">{topic.title}</h3>
      </div>
    </>
  );

  if (topic.href) {
    return (
      <Link href={topic.href} className={`researchFlowLead researchFlowLead--${sessionKey}`}>
        {body}
      </Link>
    );
  }

  return <article className={`researchFlowLead researchFlowLead--${sessionKey}`}>{body}</article>;
}

function ResearchFlowSelector({ topic, active, sessionKey, onActivate }) {
  const className = [
    "researchFlowSelector",
    `researchFlowSelector--${sessionKey}`,
    active ? "researchFlowSelector--active" : ""
  ]
    .filter(Boolean)
    .join(" ");

  const activate = () => {
    startTransition(() => {
      onActivate();
    });
  };

  const body = (
    <>
      <div className="researchFlowSelectorThumb">
        <img
          src={withBasePath(topic.image)}
          alt=""
          loading="lazy"
          decoding="async"
        />
      </div>
      <span className="researchFlowSelectorLabel">{topic.title}</span>
    </>
  );

  if (topic.href) {
    return (
      <Link
        href={topic.href}
        className={className}
        onPointerEnter={activate}
        onFocus={activate}
      >
        {body}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onPointerEnter={activate}
      onFocus={activate}
      onClick={activate}
      aria-pressed={active}
    >
      {body}
    </button>
  );
}

function ResearchFlowSection({ session }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeTopic = session.topics[activeIndex] ?? session.topics[0];

  return (
    <section className={`section researchFlowSection researchFlowSection--${session.key}`}>
      <div className="researchFlowShell">
        <div className="researchFlowRail">
          <span className="researchFlowIndex">{session.index}</span>
          <div className="researchFlowCopy">
            <h2 className="researchFlowTitle">{session.title}</h2>
          </div>
        </div>

        <div className="researchFlowStage">
          <div className="researchFlowLeadWrap">
            <ResearchFlowLead
              key={`${session.key}-${activeTopic.title}`}
              topic={activeTopic}
              priority
              sessionKey={session.key}
            />
          </div>

          <div className={`researchFlowSelectorGrid researchFlowSelectorGrid--${session.key}`}>
            {session.topics.map((topic, index) => (
              <ResearchFlowSelector
                key={`${session.key}-${topic.title}`}
                topic={topic}
                sessionKey={session.key}
                active={index === activeIndex}
                onActivate={() => setActiveIndex(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ResearchShowcase({ sessions }) {
  return (
    <div className="researchFlowPage">
      <section className="section researchFlowIntroSection">
        <div className="researchFlowIntro">
          <div className="researchFlowHeroCopy">
            <p className="researchFlowEyebrow">MSQ Lab</p>
            <h1 className="researchFlowHeroTitle">Research</h1>
            <p className="researchFlowHeroLead">
              MSQ Lab develops AI-assisted synthesis planning, multiscale modeling, and nucleation control workflows
              for semiconductors, ferroics, topological materials, and battery systems.
            </p>
          </div>
        </div>
      </section>

      {sessions.map((session) => (
        <ResearchFlowSection key={session.key} session={session} />
      ))}
    </div>
  );
}
