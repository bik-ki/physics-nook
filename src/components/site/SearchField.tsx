type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SearchField({ value, onChange, placeholder }: Props) {
  return (
    <div className="relative flex-1">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 select-none text-lg text-muted-foreground">
        ⌕
      </span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder ?? "Search by name or variable — try “force”, “v”, “λ”…"}
        className="w-full rounded-full border-2 border-border bg-card py-3.5 pl-11 pr-4 text-base placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-ring"
      />
    </div>
  );
}
