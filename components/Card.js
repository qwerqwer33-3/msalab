export default function Card({ title, meta, badges, children }) {
  return (
    <div className="card">
      {title ? <div className="cardTitle">{title}</div> : null}
      {meta ? <div className="cardMeta">{meta}</div> : null}
      {children}
      {badges && badges.length ? (
        <div className="badgeRow">
          {badges.map((b) => (
            <span className="badge" key={b}>{b}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
