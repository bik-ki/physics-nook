import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { parseVariables, TINTS, type Category, type Formula, type Subject } from "@/lib/content-types";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — FormulaLab" },
      { name: "description", content: "Manage FormulaLab subjects, categories and formulas." },
      { property: "og:title", content: "Admin — FormulaLab" },
      { property: "og:description", content: "Content management for FormulaLab." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function useAdminData() {
  return useQuery({
    queryKey: ["admin-data"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const [roles, subjects, categories, formulas] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", auth.user?.id ?? ""),
        supabase.from("subjects").select("*").order("sort_order"),
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("formulas").select("*").order("sort_order"),
      ]);
      return {
        isAdmin: (roles.data ?? []).some((r) => r.role === "admin"),
        subjects: (subjects.data ?? []) as Subject[],
        categories: (categories.data ?? []) as Category[],
        formulas: (formulas.data ?? []).map((f) => ({ ...f, variables: parseVariables(f.variables) })) as Formula[],
      };
    },
  });
}

function AdminPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading } = useAdminData();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-3xl font-semibold">Admin</h1>
          <Button variant="outline" onClick={signOut}>Sign out</Button>
        </div>
        {isLoading || !data ? (
          <p className="mt-8 text-muted-foreground">Loading…</p>
        ) : !data.isAdmin ? (
          <p className="mt-8 rounded-2xl border border-border bg-card p-6 text-muted-foreground">
            Your account doesn't have admin access.
          </p>
        ) : (
          <Tabs defaultValue="formulas" className="mt-8">
            <TabsList>
              <TabsTrigger value="formulas">Formulas</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="subjects">Subjects</TabsTrigger>
            </TabsList>
            <TabsContent value="formulas"><FormulasTab {...data} /></TabsContent>
            <TabsContent value="categories"><CategoriesTab {...data} /></TabsContent>
            <TabsContent value="subjects"><SubjectsTab {...data} /></TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}

type Data = NonNullable<ReturnType<typeof useAdminData>["data"]>;

function useSaver() {
  const qc = useQueryClient();
  return async (op: PromiseLike<{ error: { message: string } | null }>, msg: string) => {
    const { error } = await op;
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success(msg);
    await qc.invalidateQueries();
    return true;
  };
}

function Row({ title, sub, onEdit, onDelete }: { title: string; sub: string; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-0">
      <div className="min-w-0">
        <div className="truncate font-medium">{title}</div>
        <div className="truncate text-xs text-muted-foreground">{sub}</div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button size="sm" variant="outline" onClick={onEdit}>Edit</Button>
        <Button size="sm" variant="ghost" className="text-destructive" onClick={onDelete}>Delete</Button>
      </div>
    </div>
  );
}

function ListShell({ label, onAdd, children }: { label: string; onAdd: () => void; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <div className="mb-3 flex justify-end"><Button onClick={onAdd}>Add {label}</Button></div>
      <div className="rounded-2xl border border-border bg-card">{children}</div>
    </div>
  );
}

const selectCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm";

/* ---------- Formulas ---------- */
function FormulasTab({ categories, formulas }: Data) {
  const save = useSaver();
  const [edit, setEdit] = useState<Partial<Formula> | null>(null);
  const [vars, setVars] = useState("");
  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? "—";

  function open(f?: Formula) {
    setEdit(f ?? { category_id: categories[0]?.id, is_premium: false, sort_order: 0 });
    setVars((f?.variables ?? []).map((v) => `${v.symbol} = ${v.meaning}`).join("\n"));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    const variables = vars.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const [symbol, ...rest] = l.split("=");
      return { symbol: symbol.trim(), meaning: rest.join("=").trim() };
    });
    const row = {
      category_id: edit.category_id!, name: edit.name ?? "", equation: edit.equation ?? "",
      description: edit.description ?? "", variables, is_premium: !!edit.is_premium, sort_order: Number(edit.sort_order ?? 0),
    };
    const ok = await save(
      edit.id ? supabase.from("formulas").update(row).eq("id", edit.id) : supabase.from("formulas").insert(row),
      "Formula saved",
    );
    if (ok) setEdit(null);
  }

  return (
    <ListShell label="formula" onAdd={() => open()}>
      {formulas.map((f) => (
        <Row key={f.id} title={`${f.name}${f.is_premium ? " · Premium" : ""}`} sub={`${catName(f.category_id)} — ${f.equation}`}
          onEdit={() => open(f)}
          onDelete={() => confirm(`Delete "${f.name}"?`) && save(supabase.from("formulas").delete().eq("id", f.id), "Formula deleted")} />
      ))}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{edit?.id ? "Edit formula" : "New formula"}</DialogTitle></DialogHeader>
          {edit && (
            <form onSubmit={submit} className="space-y-3">
              <Field label="Category">
                <select className={selectCls} value={edit.category_id} onChange={(e) => setEdit({ ...edit, category_id: e.target.value })}>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Name"><Input required value={edit.name ?? ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
              <Field label="Equation"><Input required className="font-mono" value={edit.equation ?? ""} onChange={(e) => setEdit({ ...edit, equation: e.target.value })} /></Field>
              <Field label="Explanation"><Textarea value={edit.description ?? ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
              <Field label="Variables (one per line, e.g. v = final velocity)">
                <Textarea rows={4} className="font-mono" value={vars} onChange={(e) => setVars(e.target.value)} />
              </Field>
              <div className="flex items-center gap-6">
                <Field label="Order"><Input type="number" className="w-24" value={edit.sort_order ?? 0} onChange={(e) => setEdit({ ...edit, sort_order: Number(e.target.value) })} /></Field>
                <label className="flex items-center gap-2 text-sm"><Switch checked={!!edit.is_premium} onCheckedChange={(v) => setEdit({ ...edit, is_premium: v })} /> Premium (locked)</label>
              </div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </ListShell>
  );
}

/* ---------- Categories ---------- */
function CategoriesTab({ subjects, categories }: Data) {
  const save = useSaver();
  const [edit, setEdit] = useState<Partial<Category> | null>(null);
  const subName = (id: string) => subjects.find((s) => s.id === id)?.name ?? "—";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    const row = {
      subject_id: edit.subject_id!, name: edit.name ?? "", slug: edit.slug || slugify(edit.name ?? ""),
      description: edit.description ?? "", symbol: edit.symbol || "F", tint: edit.tint || "violet", sort_order: Number(edit.sort_order ?? 0),
    };
    const ok = await save(
      edit.id ? supabase.from("categories").update(row).eq("id", edit.id) : supabase.from("categories").insert(row),
      "Category saved",
    );
    if (ok) setEdit(null);
  }

  return (
    <ListShell label="category" onAdd={() => setEdit({ subject_id: subjects[0]?.id, tint: "violet", sort_order: 0 })}>
      {categories.map((c) => (
        <Row key={c.id} title={c.name} sub={`${subName(c.subject_id)} · /c/${c.slug}`} onEdit={() => setEdit(c)}
          onDelete={() => confirm(`Delete "${c.name}"? Its formulas must be removed first.`) && save(supabase.from("categories").delete().eq("id", c.id), "Category deleted")} />
      ))}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit?.id ? "Edit category" : "New category"}</DialogTitle></DialogHeader>
          {edit && (
            <form onSubmit={submit} className="space-y-3">
              <Field label="Subject">
                <select className={selectCls} value={edit.subject_id} onChange={(e) => setEdit({ ...edit, subject_id: e.target.value })}>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
              <Field label="Name"><Input required value={edit.name ?? ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
              <Field label="URL slug (optional)"><Input value={edit.slug ?? ""} onChange={(e) => setEdit({ ...edit, slug: e.target.value })} /></Field>
              <Field label="Description"><Textarea value={edit.description ?? ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Symbol"><Input value={edit.symbol ?? ""} onChange={(e) => setEdit({ ...edit, symbol: e.target.value })} /></Field>
                <Field label="Color">
                  <select className={selectCls} value={edit.tint} onChange={(e) => setEdit({ ...edit, tint: e.target.value })}>
                    {TINTS.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Order"><Input type="number" value={edit.sort_order ?? 0} onChange={(e) => setEdit({ ...edit, sort_order: Number(e.target.value) })} /></Field>
              </div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </ListShell>
  );
}

/* ---------- Subjects ---------- */
function SubjectsTab({ subjects }: Data) {
  const save = useSaver();
  const [edit, setEdit] = useState<Partial<Subject> | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    const row = {
      name: edit.name ?? "", slug: edit.slug || slugify(edit.name ?? ""), description: edit.description ?? "",
      is_active: !!edit.is_active, sort_order: Number(edit.sort_order ?? 0),
    };
    const ok = await save(
      edit.id ? supabase.from("subjects").update(row).eq("id", edit.id) : supabase.from("subjects").insert(row),
      "Subject saved",
    );
    if (ok) setEdit(null);
  }

  return (
    <ListShell label="subject" onAdd={() => setEdit({ is_active: true, sort_order: 0 })}>
      {subjects.map((s) => (
        <Row key={s.id} title={s.name} sub={s.is_active ? "Live" : "Coming soon"} onEdit={() => setEdit(s)}
          onDelete={() => confirm(`Delete "${s.name}"? Its categories must be removed first.`) && save(supabase.from("subjects").delete().eq("id", s.id), "Subject deleted")} />
      ))}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit?.id ? "Edit subject" : "New subject"}</DialogTitle></DialogHeader>
          {edit && (
            <form onSubmit={submit} className="space-y-3">
              <Field label="Name"><Input required value={edit.name ?? ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
              <Field label="URL slug (optional)"><Input value={edit.slug ?? ""} onChange={(e) => setEdit({ ...edit, slug: e.target.value })} /></Field>
              <Field label="Description"><Textarea value={edit.description ?? ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
              <div className="flex items-center gap-6">
                <Field label="Order"><Input type="number" className="w-24" value={edit.sort_order ?? 0} onChange={(e) => setEdit({ ...edit, sort_order: Number(e.target.value) })} /></Field>
                <label className="flex items-center gap-2 text-sm"><Switch checked={!!edit.is_active} onCheckedChange={(v) => setEdit({ ...edit, is_active: v })} /> Live</label>
              </div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </ListShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
