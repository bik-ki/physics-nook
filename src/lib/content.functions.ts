import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import {
  parseVariables,
  type Category,
  type CategoryWithCount,
  type Formula,
  type FormulaWithCategory,
  type Subject,
} from "./content-types";

function publicClient() {
  return createClient<Database>(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

/** Subjects (Physics today, Chemistry / Biology later). */
export const listSubjects = createServerFn({ method: "GET" }).handler(async (): Promise<Subject[]> => {
  const { data, error } = await publicClient()
    .from("subjects")
    .select("id, slug, name, description, is_active, sort_order")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
});

/** All categories of active subjects, with how many formulas each holds. */
export const listCategories = createServerFn({ method: "GET" }).handler(
  async (): Promise<CategoryWithCount[]> => {
    const supabase = publicClient();
    const [{ data: categories, error }, { data: formulas, error: formulaError }] = await Promise.all([
      supabase
        .from("categories")
        .select("id, subject_id, slug, name, description, symbol, tint, sort_order, subjects!inner(is_active)")
        .eq("subjects.is_active", true)
        .order("sort_order"),
      supabase.from("formulas").select("category_id"),
    ]);
    if (error) throw new Error(error.message);
    if (formulaError) throw new Error(formulaError.message);

    const counts = new Map<string, number>();
    for (const row of formulas ?? []) {
      counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1);
    }

    return (categories ?? []).map(({ subjects: _subjects, ...category }) => ({
      ...(category as Category),
      formula_count: counts.get(category.id) ?? 0,
    }));
  },
);

/** One category page: the category plus its formulas. */
export const getCategory = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => ({ slug: String(data.slug) }))
  .handler(async ({ data }): Promise<{ category: Category; formulas: Formula[] } | null> => {
    const supabase = publicClient();
    const { data: category, error } = await supabase
      .from("categories")
      .select("id, subject_id, slug, name, description, symbol, tint, sort_order")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!category) return null;

    const { data: formulas, error: formulaError } = await supabase
      .from("formulas")
      .select("*")
      .eq("category_id", category.id)
      .order("sort_order");
    if (formulaError) throw new Error(formulaError.message);

    return {
      category: category as Category,
      formulas: (formulas ?? []).map((f) => ({ ...f, variables: parseVariables(f.variables) })),
    };
  });

/** Every formula, used by the search page and the homepage preview. */
export const listFormulas = createServerFn({ method: "GET" }).handler(
  async (): Promise<FormulaWithCategory[]> => {
    const { data, error } = await publicClient()
      .from("formulas")
      .select("*, categories!inner(name, slug, sort_order)")
      .order("sort_order");
    if (error) throw new Error(error.message);

    return (data ?? []).map(({ categories, ...formula }) => ({
      ...formula,
      variables: parseVariables(formula.variables),
      category_name: categories.name,
      category_slug: categories.slug,
    }));
  },
);
