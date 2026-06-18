import members from "../../data/members.json";
import { withBasePath } from "../../lib/basePath";
import Card from "../../components/Card";

const sectionOrder = [
  { id: "postdoc", keys: ["Postdoc"], label: "Postdoctoral Researcher" },
  {
    id: "phd",
    keys: ["Ph.D.", "Integrated Ph.D."],
    label: "Ph.D. / Integrated Ph.D. Students"
  },
  { id: "masters", keys: ["Masters"], label: "M.S. Students" },
  { id: "undergrad", keys: ["Undergrad"], label: "Undergraduates" },
  { id: "alumni", keys: ["Alumni"], label: "Alumni" }
];

export default function Members2Page() {
  const grouped = sectionOrder.map((section) => ({
    ...section,
    members: members.filter((m) => section.keys.includes(m.category))
  }));

  return (
    <div>
      <section className="section">
        <h1>Members</h1>
      </section>

      {grouped.map((section) =>
        section.members.length ? (
          <section className="section" key={section.id}>
            <h2>{section.label}</h2>
            <div className="grid membersGrid">
              {section.members.map((m) => (
                <Card
                  key={m.name}
                >
                  <div className="memberHeader">
                    <div className="cardTitle">{m.name}</div>
                    <div className="memberWebsite">
                      {m.website ? (
                        <a
                          className="websiteButton"
                          href={m.website}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Personal site
                        </a>
                      ) : (
                        <span className="websiteButton websiteButton--disabled">
                          Personal site
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="memberCardContent">
                    <div className="memberPhoto">
                      <img src={withBasePath(m.photo)} alt={m.name} loading="lazy" decoding="async" />
                    </div>
                    <div className="memberInfo">
                      {m.education && (
                        <div className="memberDetailBlock">
                          <strong>Education</strong>
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
                      {m.research && (
                        <div className="memberDetailBlock">
                          <strong>Research</strong>
                          <ul className="researchList">
                            {m.research.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {m.currentAffiliation && (
                        <div className="memberDetailBlock">
                          <strong>Current affiliation</strong>
                          <ul className="bioList">
                            <li>{m.currentAffiliation}</li>
                          </ul>
                        </div>
                      )}
                      {m.email && (
                        <div className="memberDetailBlock memberEmailBlock">
                          <strong>Email</strong>
                          <ul className="emailList">
                            <li>
                              <a href={`mailto:${m.email}`}>{m.email}</a>
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ) : null
      )}
    </div>
  );
}
