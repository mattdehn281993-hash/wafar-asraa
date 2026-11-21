import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption<T extends string> = { value: T; label: string; icon?: ReactNode };

export interface SelectProps<T extends string> {
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
  /** Accessible name, e.g. "Sort products". */
  label: string;
  /** Small icon shown before the current value in the trigger. */
  icon?: ReactNode;
  className?: string;
  /** Which edge of the trigger the menu lines up with. "end" suits controls on the right of a row. */
  align?: "start" | "end";
  /** "pill": compact rounded control for toolbars. "field": full-width form input. */
  variant?: "pill" | "field";
}

const OPTION_HEIGHT = 42;
const MENU_PADDING = 12;
const GAP = 6;
const EDGE_MARGIN = 12;

/** The visible vertical area around `el`: the window, narrowed by any scrolling or clipping ancestor (e.g. a bottom sheet). */
function visibleBounds(el: HTMLElement) {
  let top = 0;
  let bottom = window.innerHeight;
  for (let node = el.parentElement; node && node !== document.body; node = node.parentElement) {
    if (/(auto|scroll|hidden|clip)/.test(getComputedStyle(node).overflowY)) {
      const r = node.getBoundingClientRect();
      top = Math.max(top, r.top);
      bottom = Math.min(bottom, r.bottom);
    }
  }
  return { top, bottom };
}

/**
 * A styled single-choice dropdown (ARIA "select-only combobox" pattern).
 * Keyboard: ↑/↓/Home/End move, Enter/Space choose, Esc closes, typing a letter jumps to it.
 */
export function Select<T extends string>({ value, options, onChange, label, icon, className, align = "end", variant = "pill" }: SelectProps<T>) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState<"bottom" | "top">("bottom");
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: "", at: 0 });

  const selectedIndex = Math.max(0, options.findIndex(o => o.value === value));
  const selected = options[selectedIndex];

  // Open upwards when the menu wouldn't fit below the trigger (e.g. last field in a bottom sheet).
  // If it fits on neither side, use the roomier side and let the menu scroll.
  const show = (index = selectedIndex) => {
    const trigger = triggerRef.current;
    const rect = trigger?.getBoundingClientRect();
    if (trigger && rect) {
      const bounds = visibleBounds(trigger);
      const needed = options.length * OPTION_HEIGHT + MENU_PADDING + GAP;
      const below = bounds.bottom - rect.bottom;
      const above = rect.top - bounds.top;
      const goUp = below < needed && above > below;
      setSide(goUp ? "top" : "bottom");
      const room = (goUp ? above : below) - GAP - EDGE_MARGIN;
      setMaxHeight(room < needed ? Math.max(OPTION_HEIGHT * 2 + MENU_PADDING, room) : undefined);
    }
    setActive(index);
    setOpen(true);
  };
  const close = (refocus = true) => { setOpen(false); if (refocus) triggerRef.current?.focus(); };
  const choose = (index: number) => { const option = options[index]; if (option && option.value !== value) onChange(option.value); close(); };

  // Close when tapping or clicking anywhere outside.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) close(false); };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Move focus into the list when it opens, and keep the active option in view.
  // Scroll only the menu, never the page or sheet behind it.
  useEffect(() => { if (open) listRef.current?.focus({ preventScroll: true }); }, [open]);
  useEffect(() => {
    const list = listRef.current;
    const option = document.getElementById(`${id}-option-${active}`);
    if (!open || !list || !option) return;
    if (option.offsetTop < list.scrollTop) list.scrollTop = option.offsetTop - 5;
    else if (option.offsetTop + option.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = option.offsetTop + option.offsetHeight - list.clientHeight + 5;
  }, [open, active, id]);

  const jumpToTyped = (key: string) => {
    const now = Date.now();
    typed.current = { text: now - typed.current.at > 700 ? key : typed.current.text + key, at: now };
    const query = typed.current.text.toLocaleLowerCase();
    const match = options.findIndex(o => o.label.toLocaleLowerCase().startsWith(query));
    if (match >= 0) setActive(match);
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      show(event.key === "ArrowUp" ? Math.max(0, selectedIndex - 1) : selectedIndex);
    }
  };

  const onListKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const last = options.length - 1;
    switch (event.key) {
      case "ArrowDown": event.preventDefault(); setActive(i => Math.min(last, i + 1)); break;
      case "ArrowUp": event.preventDefault(); setActive(i => Math.max(0, i - 1)); break;
      case "Home": event.preventDefault(); setActive(0); break;
      case "End": event.preventDefault(); setActive(last); break;
      case "Enter": case " ": event.preventDefault(); choose(active); break;
      case "Escape": event.preventDefault(); close(); break;
      case "Tab": close(false); break;
      default: if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) jumpToTyped(event.key);
    }
  };

  return (
    <div ref={rootRef} className={cn("ui-select", variant === "field" && "ui-select--field", open && "is-open", className)} data-align={align} data-side={side}>
      <button
        ref={triggerRef}
        type="button"
        className="ui-select-trigger"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        onClick={() => (open ? close() : show())}
        onKeyDown={onTriggerKeyDown}
      >
        {icon && <span className="ui-select-icon" aria-hidden="true">{icon}</span>}
        <span className="ui-select-value">{selected?.label}</span>
        <ChevronDown className="ui-select-chevron" size={15} strokeWidth={2.2} aria-hidden="true" />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={`${id}-list`}
          className="ui-select-menu"
          role="listbox"
          aria-label={label}
          tabIndex={-1}
          style={maxHeight ? { maxHeight, overflowY: "auto" } : undefined}
          aria-activedescendant={`${id}-option-${active}`}
          onKeyDown={onListKeyDown}
        >
          {options.map((option, index) => {
            const isSelected = index === selectedIndex;
            return (
              <li
                key={option.value}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={isSelected}
                className={cn("ui-select-option", index === active && "is-active", isSelected && "is-selected")}
                onPointerMove={() => setActive(index)}
                onClick={() => choose(index)}
              >
                {option.icon && <span className="ui-select-option-icon" aria-hidden="true">{option.icon}</span>}
                <span>{option.label}</span>
                {isSelected && <Check className="ui-select-check" size={16} strokeWidth={2.4} aria-hidden="true" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
