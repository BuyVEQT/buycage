import Link from "next/link";

export type SitePage = "today" | "inside" | "why";

const TAG: Record<SitePage, string> = { today: "Today", inside: "Inside", why: "Why" };

export function SiteHeader({
  active,
  right,
}: {
  active: SitePage;
  right?: React.ReactNode;
}) {
  return (
    <header className="hdr">
      <div className="hdr-inner">
        <Link href="/" className="wordmark" aria-label="JustBuyCage — Today">
          <span className="a">JUST</span>
          <span className="b">BUYCAGE</span>
          <span className="c">{TAG[active]}</span>
        </Link>
        <nav className="primary">
          <Link href="/" className={active === "today" ? "active" : undefined}>
            Today
          </Link>
          <Link href="/inside" className={active === "inside" ? "active" : undefined}>
            Inside
          </Link>
          <Link href="/why" className={active === "why" ? "active" : undefined}>
            Why
          </Link>
        </nav>
        <div className="hdr-right">{right}</div>
      </div>
    </header>
  );
}
