export type Variable = { symbol: string; meaning: string };

export type Subject = {
  id: string;
  slug: string;
  name: string;
  description: string;
  is_active: boolean;
  sort_order: number;
};

export type Category = {
  id: string;
  subject_id: string;
  slug: string;
  name: string;
  description: string;
  symbol: string;
  tint: string;
  sort_order: number;
};

export type Formula = {
  id: string;
  category_id: string;
  name: string;
  equation: string;
  description: string;
  topic: string;
  variables: Variable[];
  is_premium: boolean;
  sort_order: number;
};

export type CategoryWithCount = Category & { formula_count: number };

export type FormulaWithCategory = Formula & {
  category_name: string;
  category_slug: string;
};

export const TINTS = ["violet", "amber", "sky", "rose", "teal"] as const;

export const tintClasses: Record<string, string> = {
  violet: "bg-tint-violet-soft text-tint-violet",
  amber: "bg-tint-amber-soft text-tint-amber",
  sky: "bg-tint-sky-soft text-tint-sky",
  rose: "bg-tint-rose-soft text-tint-rose",
  teal: "bg-tint-teal-soft text-tint-teal",
};

export function parseVariables(value: unknown): Variable[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const row = entry as Record<string, unknown>;
    if (typeof row["symbol"] !== "string") return [];
    return [{ symbol: row["symbol"], meaning: String(row["meaning"] ?? "") }];
  });
}

export function matchesQuery(formula: { name: string; equation: string; variables: Variable[] }, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    formula.name.toLowerCase().includes(q) ||
    formula.equation.toLowerCase().includes(q) ||
    formula.variables.some(
      (v) => v.symbol.toLowerCase().includes(q) || v.meaning.toLowerCase().includes(q),
    )
  );
}
