import { Check, Ban } from "lucide-react";
import { ACCOUNT_COLORS } from "@/lib/colors";
import { cn } from "@/lib/utils";

/** Swatch row for choosing an account's row tint. `value` is a palette key, or
 * "" for none. Colours come from the theme-aware `--acct-*` CSS variables. */
export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        aria-label="No color"
        title="No color"
        onClick={() => onChange("")}
        className={cn(
          "flex size-6 items-center justify-center rounded-full border text-muted-foreground",
          !value && "ring-2 ring-ring ring-offset-1 ring-offset-background",
        )}
      >
        <Ban className="size-3.5" />
      </button>
      {ACCOUNT_COLORS.map((c) => (
        <button
          key={c.key}
          type="button"
          aria-label={c.label}
          title={c.label}
          onClick={() => onChange(c.key)}
          style={{ backgroundColor: `var(--acct-${c.key})` }}
          className={cn(
            "flex size-6 items-center justify-center rounded-full border",
            value === c.key && "ring-2 ring-ring ring-offset-1 ring-offset-background",
          )}
        >
          {value === c.key && <Check className="size-3.5 text-foreground" />}
        </button>
      ))}
    </div>
  );
}
