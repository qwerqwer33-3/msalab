"use client";

import { useEffect, useState } from "react";
import { withBasePath } from "./basePath";

export function useCmsCollection(name, fallbackItems) {
  const [items, setItems] = useState(fallbackItems);

  useEffect(() => {
    let isActive = true;
    const url = `${withBasePath(`/cms/${name}.json`)}?v=${Date.now()}`;

    fetch(url, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load ${name}`);
        }
        return response.json();
      })
      .then((nextItems) => {
        if (isActive && Array.isArray(nextItems)) {
          setItems(nextItems);
        }
      })
      .catch(() => {
        if (isActive) {
          setItems(fallbackItems);
        }
      });

    return () => {
      isActive = false;
    };
  }, [name, fallbackItems]);

  return items;
}
