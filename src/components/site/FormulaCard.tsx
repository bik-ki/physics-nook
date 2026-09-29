import type { Variable } from "@/lib/content-types";

type Props = {
  name: string;
  equation: string;
  description: string;
  variables: Variable[];
  isPremium: boolean;
};

export function FormulaCard({ name, equation, description, variables, isPremium }: Props) {
  return (
    <article className="card-lift rounded-2xl border-2 border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          {name}
        </span>
        {isPremium ? (
          <span className="rounded-full bg-locked-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-locked">
            Premium
          </span>
        ) : (
          <span className="rounded-full bg-free-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-free">
            Free
          </span>
        )}
      </div>

      <p className={`eq mt-3 text-2xl font-medium ${isPremium ? "text-muted-foreground" : ""}`}>
        {equation}
      </p>
      <p className={`mt-2 text-sm ${isPremium ? "text-muted-foreground" : "text-muted-foreground"}`}>
        {description}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {variables.map((variable) => (
          <span
            key={variable.symbol + variable.meaning}
            className={`eq rounded-md bg-muted px-2 py-1 text-xs ${isPremium ? "opacity-50" : ""}`}
          >
            <span className="font-semibold">{variable.symbol}</span>{" "}
            <span className="text-muted-foreground">{variable.meaning}</span>
          </span>
        ))}
      </div>

      {isPremium ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-secondary px-3 py-2.5">
          <span className="text-xs font-semibold text-secondary-foreground">
            🔒 Worked example coming with Premium
          </span>
          <span className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">
            Soon
          </span>
        </div>
      ) : null}
    </article>
  );
}
