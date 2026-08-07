import { Search, X } from "lucide-react";
import type { Ref } from "react";

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
    return (
        <div className="mx-2.5 my-2 flex items-center gap-1.5 rounded-lg bg-muted px-2 py-1.5">
            <Search className="size-3.5 text-muted-foreground" />
            <input
                ref={inputRef}
                autoFocus={autoFocus}
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
                placeholder="Search"
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />
            {value && (
                <button type="button" onClick={() => setValue("")}>
                    <X className="size-3.5 text-muted-foreground" />
                </button>
            )}
        </div>
    )
}
