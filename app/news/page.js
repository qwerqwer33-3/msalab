"use client";

import { useMemo } from "react";
import newsItems from "../../data/news.json";
import { useCmsCollection } from "../../lib/useCmsCollection";

function formatDate(date) {
  return date.replaceAll("-", ".");
}

export default function NewsPage() {
  const liveNewsItems = useCmsCollection("news", newsItems);
  const sortedNewsItems = useMemo(
    () =>
      [...liveNewsItems].sort((a, b) => {
        const dateOrder = b.date.localeCompare(a.date);
        if (dateOrder !== 0) return dateOrder;
        return (a.sortOrder ?? 50) - (b.sortOrder ?? 50);
      }),
    [liveNewsItems]
  );

  return (
    <div>
      <section className="section">
        <h1>News</h1>
      </section>

      <section className="section newsSection">
        <div className="newsCardList">
          {sortedNewsItems.map((item) => (
            <article key={item.id} className="card newsSimpleItem newsSimpleCard">
              <p className="newsSimpleHead">
                <span className="newsSimpleDate">{formatDate(item.date)}</span>
                <span className="newsSimpleTitle">{item.title}</span>
              </p>
              <p className="newsSimpleText">{item.text}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
