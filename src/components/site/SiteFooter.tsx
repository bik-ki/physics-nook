export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <p className="font-display font-medium text-foreground">
          FormulaLab — learn the why behind the equation.
        </p>
        <p>NEB · CBSE · © {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
