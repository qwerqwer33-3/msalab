import counterparts from "../../data/counterparts.json";
import { withBasePath } from "../../lib/basePath";

function CounterpartCard({ item }) {
  const logoPath = item.logo || "/images/placeholder.svg";
  const isPlaceholderLogo = logoPath === "/images/placeholder.svg";

  return (
    <article className="counterpartCard">
      <div className="counterpartLogoFrame">
        <img
          src={withBasePath(logoPath)}
          alt={`${item.name} logo`}
          className={`counterpartLogo${isPlaceholderLogo ? " isPlaceholder" : ""}`}
          loading="lazy"
          decoding="async"
        />
      </div>
      <h3 className="counterpartName">{item.name}</h3>
      <p className="counterpartScope">{item.topic}</p>
    </article>
  );
}

export default function CounterpartPage() {
  return (
    <div className="counterpartPage">
      <section className="section counterpartIntroSection">
        <h1>Counterpart</h1>
      </section>

      {counterparts.sections.map((section) => (
        <section className="section counterpartSection" key={section.id}>
          <h2 className="counterpartSectionTitle">{section.title}</h2>
          <div className="counterpartGrid">
            {section.items.map((item, index) => (
              <CounterpartCard key={`${section.id}-${item.name}-${index}`} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
