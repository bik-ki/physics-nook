import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary font-display text-xl text-primary-foreground">
            Σ
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">FormulaLab</span>
          <span className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:inline-block">
            NEB · CBSE
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
          <Link to="/" className="rounded-full px-3 py-2 hover:text-foreground" activeProps={{ className: "text-foreground" }}>
            Subjects
          </Link>
          <Link
            to="/search"
            search={{ q: "" }}
            className="rounded-full px-3 py-2 hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            Formulas
          </Link>
        </nav>
      </div>
    </header>
  );
}
