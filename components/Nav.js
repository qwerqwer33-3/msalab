"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { withBasePath } from "../lib/basePath";

const links = [
  { href: "/", label: "Home" },
  { href: "/pi", label: "PI" },
  { href: "/research", label: "Research" },
  { href: "/members", label: "Members" },
  // { href: "/members2", label: "Members 2" },
  { href: "/outcomes", label: "Outcomes" },
  { href: "/counterpart", label: "Counterpart" },
  { href: "/activities", label: "Activities" },
  { href: "/news", label: "News" }
];

export default function Nav() {
  const pathname = usePathname() || "/";
  const trimSlash = (value) => {
    if (!value) return "/";
    if (value === "/") return "/";
    return value.replace(/\/+$/, "");
  };

  const isActiveLink = (href) => {
    const normalizedPath = trimSlash(pathname);
    const rawHref = trimSlash(href);
    const basedHref = trimSlash(withBasePath(href));

    if (href === "/") {
      return normalizedPath === rawHref || normalizedPath === basedHref;
    }

    return (
      normalizedPath === rawHref ||
      normalizedPath.startsWith(`${rawHref}/`) ||
      normalizedPath === basedHref ||
      normalizedPath.startsWith(`${basedHref}/`)
    );
  };

  return (
    <header className="navbar">
      <div className="container navInner">
        <Link className="navBrand" href="/">
          <img
            className="navLogo navLogoFull"
            src={withBasePath("/LAB_logo.png")}
            width="2804"
            height="561"
            alt="Materials Modeling Laboratory"
            decoding="async"
          />
          <span className="navBrandText">MSQ Lab</span>
        </Link>
        <nav className="navLinks">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={isActiveLink(l.href) ? "isActive" : ""}
              aria-current={isActiveLink(l.href) ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
