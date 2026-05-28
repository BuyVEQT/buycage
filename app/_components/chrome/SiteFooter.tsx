import Link from "next/link";

export function SiteFooter({
  left,
  right,
}: {
  left?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <footer>
      <div className="inner">
        <div className="left">
          {left ?? "© 2026 BuyCage · Not investment advice · Independent · Real Yahoo data"}
        </div>
        <div className="right">
          {right ?? (
            <>
              buycage.ca · <Link href="/">Back to Today →</Link>
            </>
          )}
        </div>
      </div>
    </footer>
  );
}
