import research from "../../../data/research.json";
import Link from "next/link";
import { notFound } from "next/navigation";
import { withBasePath } from "../../../lib/basePath";

export const dynamicParams = false;

export function generateStaticParams() {
  return research.map((topic) => ({ slug: topic.slug }));
}

export function generateMetadata({ params }) {
  const topic = research.find((item) => item.slug === params.slug);
  if (!topic) {
    return { title: "Research | MSQ Lab" };
  }
  return { title: `${topic.title} | MSQ Lab` };
}

function renderLabelledText(item) {
  if (typeof item !== "string") {
    return item;
  }
  const separatorIndex = item.indexOf(":");
  if (separatorIndex <= 0 || separatorIndex > 40) {
    return item;
  }
  const label = item.slice(0, separatorIndex).trim();
  const body = item.slice(separatorIndex + 1).trim();
  if (!label || !body) {
    return item;
  }
  return (
    <>
      <span className="researchInlineLead">{label}:</span> {body}
    </>
  );
}

export default function ResearchDetailPage({ params }) {
  const topic = research.find((item) => item.slug === params.slug);
  if (!topic) {
    return notFound();
  }
  const focusText =
    topic.focus ||
    topic.detailIntro ||
    "This topic page is being prepared with focused scope, methods, outcomes, and representative papers.";
  const methods = Array.isArray(topic.methods) ? topic.methods : [];
  const deliverables = Array.isArray(topic.deliverables) ? topic.deliverables : [];
  const relatedPapers = Array.isArray(topic.relatedPapers) ? topic.relatedPapers : [];

  return (
    <div>
      <section className="section">
        <div className="sectionHeader researchDetailHero">
          <p className="sectionDescription">
            <Link className="researchBackLink" href="/research">
              {"\u2190 Back to Topics"}
            </Link>
          </p>
          <p className="researchKicker">Research Topic</p>
          <h1>{topic.title}</h1>
          <p className="sectionDescription researchLead">{topic.description}</p>
        </div>
      </section>

      <section className="section">
        <div className="researchDetailGrid">
          <div className="researchTopicImage researchDetailMedia">
            <img src={withBasePath(topic.image)} alt={topic.title} loading="eager" decoding="async" />
          </div>
          <div className="researchDetailCard">
            <h2>Details</h2>
            <div className="researchDetailSections">
              <div className="researchDetailBlockCard">
                <h3 className="researchDetailHeading">Focus</h3>
                <p className="sectionDescription researchDetailIntro">{focusText}</p>
              </div>

              <div className="researchDetailTwoCol">
                <div className="researchDetailBlockCard">
                  <h3 className="researchDetailHeading">Methods</h3>
                  {methods.length ? (
                    <ul className="researchDetailList researchDetailList--pretty">
                      {methods.map((item) => (
                        <li key={item}>{renderLabelledText(item)}</li>
                      ))}
                    </ul>
                  ) : (
                    <ul className="researchDetailList researchDetailList--pretty">
                      <li>Method details are being prepared.</li>
                    </ul>
                  )}
                </div>

                <div className="researchDetailBlockCard">
                  <h3 className="researchDetailHeading">What we deliver</h3>
                  {deliverables.length ? (
                    <ul className="researchDetailList researchDetailList--pretty">
                      {deliverables.map((item) => (
                        <li key={item}>{renderLabelledText(item)}</li>
                      ))}
                    </ul>
                  ) : (
                    <ul className="researchDetailList researchDetailList--pretty">
                      <li>Deliverables are being prepared.</li>
                    </ul>
                  )}
                </div>
              </div>

              <div className="researchDetailBlockCard">
                <h3 className="researchDetailHeading">Related Papers</h3>
                {relatedPapers.length ? (
                  <ol className="researchPaperList">
                    {relatedPapers.map((paper) => (
                      <li key={`${paper.title}-${paper.url || ""}`}>
                        {paper.url ? (
                          <a
                            className="researchPaperLink"
                            href={paper.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {paper.title}
                          </a>
                        ) : (
                          <span>{paper.title}</span>
                        )}
                        {paper.meta ? <span className="researchPaperMeta"> ({paper.meta})</span> : null}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="sectionDescription researchDetailIntro">
                    Representative papers for this topic will be linked here.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

