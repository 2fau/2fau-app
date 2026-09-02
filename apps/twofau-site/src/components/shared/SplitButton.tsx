import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { CheckIcon, ChevronDownIcon } from "./icons";

export interface SplitButtonItem {
  /** Stable key, also used as the selection value. */
  id: string;
  /** Row label in the menu. */
  label: string;
  /** Right-aligned qualifier, e.g. the file extension. */
  meta?: string;
  /** Label the main segment shows while this item is selected. */
  button: string;
  href: string;
}

export interface SplitButtonProps {
  icon: ReactNode;
  items: SplitButtonItem[];
  /** Currently selected item id. */
  selectedId: string | null;
  /** Called when the chevron menu changes the selection. */
  onSelect: (id: string) => void;
  /** Main-segment label used when nothing is selected (detection failed). */
  fallbackLabel: string;
  /** Main-segment href used when nothing is selected. */
  fallbackHref: string;
  variant: "primary" | "secondary";
  /** Accessible name for the chevron, e.g. "Choose a platform". */
  menuLabel: string;
}

const SHELL = {
  primary:
    "box-border w-fit shrink-0 h-[42px] [box-shadow:0px_8px_28px_0px_#0A84FF3D] flex flex-row gap-0 justify-start items-center bg-[#0A84FF] rounded-[10px] overflow-hidden",
  secondary:
    "box-border w-fit shrink-0 h-[42px] flex flex-row gap-0 justify-start items-center bg-[#232326] [outline:1px_solid_#38383A] [outline-offset:-0.5px] rounded-[10px] overflow-hidden",
} as const;

const LABEL = {
  primary:
    "text-[14px]/[normal] box-border text-[#FFFFFF] font-[Inter,system-ui,sans-serif] font-semibold text-left [white-space:nowrap]",
  secondary:
    "text-[14px]/[normal] box-border text-[#F5F5F7] font-[Inter,system-ui,sans-serif] font-semibold text-left [white-space:nowrap]",
} as const;

const DIVIDER = {
  primary: "box-border w-[1px] shrink-0 h-full bg-[#FFFFFF47]",
  secondary: "box-border w-[1px] shrink-0 h-full bg-[#38383A]",
} as const;

const CHEVRON_FILL = { primary: "#FFFFFFCC", secondary: "#98989D" } as const;

export function SplitButton({
  icon,
  items,
  selectedId,
  onSelect,
  fallbackLabel,
  fallbackHref,
  variant,
  menuLabel,
}: SplitButtonProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();

  const selected = items.find((i) => i.id === selectedId) ?? null;
  const label = selected?.button ?? fallbackLabel;
  const href = selected?.href ?? fallbackHref;

  // Close on outside pointer or Escape; Escape returns focus to the chevron.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open && active >= 0) itemRefs.current[active]?.focus();
  }, [open, active]);

  const openMenu = (index: number) => {
    setActive(index);
    setOpen(true);
  };

  const choose = (id: string) => {
    onSelect(id);
    setOpen(false);
    trigger.current?.focus();
  };

  const onTriggerKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openMenu(Math.max(0, items.findIndex((i) => i.id === selectedId)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      openMenu(items.length - 1);
    }
  };

  const onMenuKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + items.length) % items.length);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(items.length - 1);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={root} className="relative w-fit shrink-0">
      <div
        data-pencil-name={`CTA ${variant === "primary" ? "Primary" : "Secondary"}`}
        className={SHELL[variant]}
      >
        <a
          href={href}
          data-pencil-name="Button Main"
          className={`box-border w-fit shrink-0 h-full flex flex-row gap-[8px] ${
            variant === "primary" ? "p-[0px_17px]" : "p-[0px_16px]"
          } justify-start items-center no-underline transition-[filter] hover:brightness-110`}
        >
          {icon}
          <span data-pencil-name="Label" className={LABEL[variant]}>
            {label}
          </span>
        </a>
        <div data-pencil-name="Segment Divider" className={DIVIDER[variant]}></div>
        <button
          ref={trigger}
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          aria-label={menuLabel}
          onClick={() =>
            open ? setOpen(false) : openMenu(Math.max(0, items.findIndex((i) => i.id === selectedId)))
          }
          onKeyDown={onTriggerKey}
          data-pencil-name={variant === "primary" ? "OS Select" : "Browser Select"}
          className="box-border w-fit shrink-0 h-full flex flex-row gap-0 p-[0px_11px] justify-center items-center bg-transparent border-0 cursor-pointer transition-[filter] hover:brightness-110"
        >
          <ChevronDownIcon
            className={`box-border w-[15px] shrink-0 h-[15px] transition-transform duration-150 ${
              open ? "rotate-180" : ""
            }`}
            fill={CHEVRON_FILL[variant]}
          />
        </button>
      </div>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={menuLabel}
          onKeyDown={onMenuKey}
          className="absolute left-0 top-[calc(100%+8px)] z-50 min-w-[252px] w-max p-[6px] flex flex-col gap-[2px] bg-[#1C1C1F] [outline:1px_solid_#38383A] [outline-offset:-0.5px] rounded-[10px] [box-shadow:0px_16px_40px_0px_#000000A6]"
        >
          {items.map((item, i) => {
            const isSelected = item.id === selectedId;
            return (
              <button
                key={item.id}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                tabIndex={i === active ? 0 : -1}
                onFocus={() => setActive(i)}
                onClick={() => choose(item.id)}
                className={`w-full flex flex-row gap-[12px] justify-between items-center px-[10px] py-[8px] rounded-[7px] bg-transparent border-0 text-left cursor-pointer outline-none hover:bg-[#2C2C30] focus-visible:bg-[#2C2C30] ${
                  isSelected ? "bg-[#232326]" : ""
                }`}
              >
                <span className="flex flex-row gap-[8px] items-center">
                  <CheckIcon
                    className={`w-[13px] h-[13px] shrink-0 ${isSelected ? "" : "invisible"}`}
                    stroke={variant === "primary" ? "#0A84FF" : "#F5F5F7"}
                  />
                  <span className="text-[13.5px]/[normal] text-[#F5F5F7] font-[Inter,system-ui,sans-serif] font-normal [white-space:nowrap]">
                    {item.label}
                  </span>
                </span>
                {item.meta ? (
                  <span className="text-[11.5px]/[normal] text-[#6E6E73] font-['JetBrains_Mono',system-ui,sans-serif] font-normal [white-space:nowrap]">
                    {item.meta}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
