import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";

import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SearchField } from "@/components/site/SearchField";
import { FormulaCard } from "@/components/site/FormulaCard";
import { categoriesQuery, formulasQuery, subjectsQuery } from "@/lib/queries";
import { tintClasses } from "@/lib/content-types";

const title = "FormulaLab — every high school physics formula, understood";
const description =
  "A clean NEB and CBSE physics formula reference: equations, what each one is for, and every variable defined.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(categoriesQuery()),
      context.queryClient.ensureQueryData(formulasQuery()),
      context.queryClient.ensureQueryData(subjectsQuery()),
    ]);
  },
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { data: categories } = useSuspenseQuery(categoriesQuery());
  const { data: formulas } = useSuspenseQuery(formulasQuery());
  const { data: subjects } = useSuspenseQuery(subjectsQuery());

  const upcoming = subjects.filter((subject) => !subject.is_active);
  const popular = formulas.filter((formula) => !formula.is_premium).slice(0, 4);

  function submit() {
    navigate({ to: "/search", search: { q: query } });
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        <section className="pb-8 pt-12 sm:pt-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-secondary-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> High school physics
          </span>
          <h1 className="mt-5 max-w-3xl font-display text-[2.6rem] font-semibold leading-[1.02] tracking-tight sm:text-6xl">
            Every physics formula, <span className="text-accent">understood.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Clean, scannable formula sheets for NEB and CBSE — each equation with its variables
            defined, so you learn what it means, not just copy it.
          </p>

          <form
            className="mt-7 flex max-w-xl flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <SearchField value={query} onChange={setQuery} />
            <button
              type="submit"
              className="rounded-full bg-accent px-6 py-3.5 font-semibold text-accent-foreground hover:bg-accent/90"
            >
              Find formula
            </button>
          </form>

          <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
            {["Mechanics", "F = ma", "E = hf", "λ"].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => navigate({ to: "/search", search: { q: chip } })}
                className="rounded-full border border-border bg-card px-3 py-1.5 hover:text-foreground"
              >
                {chip}
              </button>
            ))}
          </div>
        </section>

        <section className="py-8">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Browse by subject
            </h2>
            <Link to="/search" search={{ q: "" }} className="text-sm font-semibold text-primary hover:underline">
              See all →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                to="/c/$slug"
                params={{ slug: category.slug }}
                className="group rounded-3xl border-2 border-border bg-card p-6 transition-colors hover:border-primary/50"
              >
                <div
                  className={`grid h-12 w-12 place-items-center rounded-2xl font-display text-2xl ${
                    tintClasses[category.tint] ?? tintClasses["violet"]
                  }`}
                >
                  {category.symbol}
                </div>
                <h3 className="mt-4 font-display text-xl font-medium">{category.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
                <div className="mt-5 flex items-center justify-between text-sm font-semibold">
                  <span className="text-muted-foreground">{category.formula_count} formulas</span>
                  <span className="text-primary">Open →</span>
                </div>
              </Link>
            ))}

            {upcoming.length > 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-border bg-card/40 p-6">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-muted font-display text-2xl text-muted-foreground">
                  +
                </div>
                <h3 className="mt-4 font-display text-xl font-medium">
                  {upcoming.map((subject) => subject.name).join(" & ")}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  More subjects plug in — no rebuild.
                </p>
                <div className="mt-5 flex items-center justify-between text-sm font-semibold text-muted-foreground">
                  <span>Coming soon</span>
                  <span>Soon</span>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="py-8">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Most looked up
            </h2>
            <span className="text-sm font-medium text-muted-foreground">
              Showing {popular.length} of {formulas.length}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {popular.map((formula) => (
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
      </main>

      <SiteFooter />
    </div>
  );
}
