import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SearchField } from "@/components/site/SearchField";
import { FormulaCard } from "@/components/site/FormulaCard";
import { formulasQuery } from "@/lib/queries";
import { matchesQuery } from "@/lib/content-types";

const title = "Search physics formulas — FormulaLab";
const description = "Search every NEB and CBSE physics formula by name, equation or variable.";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>) => ({ q: String(search["q"] ?? "") }),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(formulasQuery());
  },
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const { data: formulas } = useSuspenseQuery(formulasQuery());

  const results = formulas.filter((formula) => matchesQuery(formula, q));

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight">All formulas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search by formula name, equation or a variable symbol.
        </p>

        <div className="mt-5 flex max-w-xl">
          <SearchField
            value={q}
            onChange={(value) => navigate({ to: "/search", search: { q: value }, replace: true })}
          />
        </div>

        <p className="mt-5 text-sm font-medium text-muted-foreground">
          {results.length} {results.length === 1 ? "result" : "results"}
          {q ? ` for “${q}”` : ""}
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {results.map((formula) => (
            <div key={formula.id}>
              <Link
                to="/c/$slug"
                params={{ slug: formula.category_slug }}
                className="mb-1.5 inline-block text-xs font-semibold uppercase tracking-[0.15em] text-primary hover:underline"
              >
                {formula.category_name}
              </Link>
              <FormulaCard
                name={formula.name}
                equation={formula.equation}
                description={formula.description}
                variables={formula.variables}
                isPremium={formula.is_premium}
                topic={formula.topic}
              />
            </div>
          ))}
        </div>

        {results.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">
            Nothing matched. Try a shorter word or a single symbol like “v”.
          </p>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}
