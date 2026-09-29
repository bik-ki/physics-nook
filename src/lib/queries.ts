import { queryOptions } from "@tanstack/react-query";

import { getCategory, listCategories, listFormulas, listSubjects } from "./content.functions";

export const subjectsQuery = () =>
  queryOptions({ queryKey: ["subjects"], queryFn: () => listSubjects() });

export const categoriesQuery = () =>
  queryOptions({ queryKey: ["categories"], queryFn: () => listCategories() });

export const formulasQuery = () =>
  queryOptions({ queryKey: ["formulas"], queryFn: () => listFormulas() });

export const categoryQuery = (slug: string) =>
  queryOptions({
    queryKey: ["category", slug],
    queryFn: () => getCategory({ data: { slug } }),
  });
