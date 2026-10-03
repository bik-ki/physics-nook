import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";

import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SearchField } from "@/components/site/SearchField";
import { FormulaCard } from "@/components/site/FormulaCard";
import { categoryQuery } from "@/lib/queries";
import { matchesQuery, tintClasses } from "@/lib/content-types";

export const Route = createFileRoute("/c/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(categoryQuery(params.slug));
    if (!data) throw notFound();
    return { name: data.category.name, description: data.category.description };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Unavailable — FormulaLab" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.name} formulas — FormulaLab`;
    const description = `${loaderData.description} Every formula with its equation, use and variables defined.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  notFoundComponent: CategoryNotFound,
  component: CategoryPage,
});

function CategoryNotFound() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Category not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This category may have been renamed or removed.
        </p>
        <Link to="/" className="mt-6 inline-block text-sm font-semibold text-primary hover:underline">
          ← Back to all subjects
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}

function CategoryPage() {
  const { slug } = Route.useParams();
  const [query, setQuery] = useState("");
  const { data } = useSuspenseQuery(categoryQuery(slug));

  if (!data) return <CategoryNotFound />;

  const { category, formulas } = data;
  const results = formulas.filter((formula) => matchesQuery(formula, query));
  const premiumCount = formulas.filter((formula) => formula.is_premium).length;

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
        <Link to="/" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
          ← All subjects
        </Link>

        <div className="mt-5 flex items-center gap-4">
          <div
            className={`grid h-12 w-12 place-items-center rounded-2xl font-display text-2xl ${
              tintClasses[category.tint] ?? tintClasses["violet"]
            }`}
          >
            {category.symbol}
          </div>
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">{category.name}</h1>
            <p className="text-sm text-muted-foreground">{category.description}</p>
          </div>
        </div>

        <div className="mt-6 flex max-w-xl">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder={`Search in ${category.name}…`}
          />
        </div>

        <p className="mt-5 text-sm font-medium text-muted-foreground">
          {results.length} of {formulas.length} formulas · {premiumCount} premium
        </p>

        <div className="mt-4 space-y-8">
          {Array.from(new Set(results.map((formula) => formula.topic || "General"))).sort((a, b) => a.localeCompare(b)).map((topic) => (
            <section key={topic} aria-label={topic}>
              <h2 className="mb-3 border-b border-border pb-2 font-display text-xl font-semibold">{topic}</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {results.filter((formula) => (formula.topic || "General") === topic).map((formula) => (
                  <FormulaCard
                    key={formula.id}
                    name={formula.name}
                    equation={formula.equation}
                    description={formula.description}
                    variables={formula.variables}
                    isPremium={formula.is_premium}
                    topic={formula.topic}
                  />
              ))}
              </div>
            </section>
          ))}
        </div>

        {results.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">
            No formula here matches “{query}”.
          </p>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}
