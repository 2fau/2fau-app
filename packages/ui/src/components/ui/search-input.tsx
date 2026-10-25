import { Search, X } from "lucide-react";
import type { Ref } from "react";
import { useT } from "@twofau/i18n/react";

export function SearchInput({
  value,
  setValue,
  inputRef,
  autoFocus,
}: {
  value: string;
  setValue: (val: string) => void;
  inputRef?: Ref<HTMLInputElement>;
  autoFocus?: boolean;
}) {
    const { t } = useT();
    return (
        <div className="mx-2.5 my-2 flex items-center gap-1.5 rounded-lg bg-muted px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring/60">
            <Search className="size-3.5 text-muted-foreground" />
            <input
                ref={inputRef}
                autoFocus={autoFocus}
                aria-label={t("Search")}
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
                placeholder={t("Search")}
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />
            {value && (
                <button type="button" aria-label={t("Clear search")} onClick={() => setValue("")}>
                    <X className="size-3.5 text-muted-foreground" />
                </button>
            )}
        </div>
    )
}
