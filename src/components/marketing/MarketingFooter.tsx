import { Link } from "@tanstack/react-router";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border-subtle bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="font-mono text-sm text-foreground">cooplink</div>
            <p className="mt-2 max-w-xs text-xs text-muted-foreground">
              A marketplace for GitHub source code. Built by developers, for developers.
            </p>
          </div>
          <FooterCol
            heading="Product"
            links={[
              { to: "/browse", label: "Browse" },
              { to: "/pricing", label: "Pricing" },
              { to: "/crack-it", label: "Crack It" },
              { to: "/dashboard", label: "Sell" },
            ]}
          />
          <FooterCol
            heading="Company"
            links={[
              { to: "/about", label: "About" },
              { to: "/terms", label: "Terms" },
              { to: "/privacy", label: "Privacy" },
            ]}
          />
          <FooterCol
            heading="Support"
            links={[
              { to: "/about", label: "Contact" },
              { to: "/terms", label: "Policies" },
            ]}
          />
        </div>

        <div className="mt-10 flex flex-col justify-between gap-3 border-t border-border-subtle pt-6 md:flex-row md:items-center">
          <div className="font-mono text-xs text-muted-foreground">
            © {new Date().getFullYear()} Cooplink
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            status: <span className="text-foreground">operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  heading,
  links,
}: {
  heading: string;
  links: { to: string; label: string }[];
}) {
  return (
    <div>
      <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        {heading}
      </div>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.to}>
            <Link
              to={l.to}
              className="text-sm text-foreground/80 transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
