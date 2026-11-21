// Built using Hyperiux Vault: https://vault.hyperiux.com
// Adapted for Wafar Asraa:
// - `to` renders a react-router Link (no full page reload); `href` still renders a plain <a>.
// - `size="compact"` uses fixed pixel sizes for the 430px app frame; "fluid" keeps the original vw sizing.
// - Logical properties (start/end) and a mirrored arrow so it works in Arabic (RTL).
// - Touch: the fill also plays while a finger is down; keyboard focus plays it too.

import { useEffect, useRef, useState, type ComponentPropsWithoutRef, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { Link, type To } from "react-router";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_HREF = "#";
const ANIMATION_DURATION_MS = 450;
const EASE = "ease-[cubic-bezier(0.785,0.135,0.15,0.86)]";

// Active state = hover, keyboard focus or touch press. Written out in full so Tailwind can find every class.
const FILL_ACTIVE = "group-hover:bg-(--btn-fill-bg-hover) group-hover:[inset-block:0] group-hover:[inset-inline:0] group-focus-visible:bg-(--btn-fill-bg-hover) group-focus-visible:[inset-block:0] group-focus-visible:[inset-inline:0] group-data-[pressed=true]:bg-(--btn-fill-bg-hover) group-data-[pressed=true]:[inset-block:0] group-data-[pressed=true]:[inset-inline:0]";
const LABEL_ACTIVE = "group-hover:text-(--btn-fill-text-hover) group-hover:[clip-path:inset(0_0_0_0)] group-focus-visible:text-(--btn-fill-text-hover) group-focus-visible:[clip-path:inset(0_0_0_0)] group-data-[pressed=true]:text-(--btn-fill-text-hover) group-data-[pressed=true]:[clip-path:inset(0_0_0_0)]";
const CIRCLE_ACTIVE = "group-hover:bg-(--btn-fill-bg-hover) group-hover:text-(--btn-arrow-hover) group-focus-visible:bg-(--btn-fill-bg-hover) group-focus-visible:text-(--btn-arrow-hover) group-data-[pressed=true]:bg-(--btn-fill-bg-hover) group-data-[pressed=true]:text-(--btn-arrow-hover)";
const ARROW_IN_ACTIVE = "group-hover:-translate-x-1/2 group-hover:-translate-y-1/2 group-hover:scale-100 group-focus-visible:-translate-x-1/2 group-focus-visible:-translate-y-1/2 group-focus-visible:scale-100 group-data-[pressed=true]:-translate-x-1/2 group-data-[pressed=true]:-translate-y-1/2 group-data-[pressed=true]:scale-100";
const ARROW_OUT_ACTIVE = "group-hover:translate-x-[70%] group-hover:-translate-y-1/2 group-hover:scale-0 group-focus-visible:translate-x-[70%] group-focus-visible:-translate-y-1/2 group-focus-visible:scale-0 group-data-[pressed=true]:translate-x-[70%] group-data-[pressed=true]:-translate-y-1/2 group-data-[pressed=true]:scale-0";

const SIZES = {
  fluid: {
    root: "h-[4.2vw] ps-[3vw] pe-[calc(var(--icon-circle)+var(--icon-end)+2vw)] text-[1.155vw] [--icon-circle:3.1vw] [--icon-end:0.55vw] max-[1025px]:h-[11vw] max-[1025px]:ps-[5vw] max-[1025px]:pe-[calc(var(--icon-circle)+var(--icon-end)+4vw)] max-[1025px]:text-[3.15vw] max-[1025px]:[--icon-circle:8vw] max-[1025px]:[--icon-end:1.5vw] max-md:h-[15vw] max-md:ps-[7vw] max-md:pe-[calc(var(--icon-circle)+var(--icon-end)+5vw)] max-md:text-[4.41vw] max-md:[--icon-circle:11vw] max-md:[--icon-end:2vw]",
    label: "ps-[3vw] pe-[calc(var(--icon-circle)+var(--icon-end)+2vw)] max-[1025px]:ps-[5vw] max-[1025px]:pe-[calc(var(--icon-circle)+var(--icon-end)+4vw)] max-md:ps-[7vw] max-md:pe-[calc(var(--icon-circle)+var(--icon-end)+5vw)]",
    arrow: "size-[1.5vw] max-[1025px]:size-[4vw] max-md:size-[5vw]",
  },
  compact: {
    root: "h-11 ps-4 pe-[calc(var(--icon-circle)+var(--icon-end)+10px)] text-[13px] [--icon-circle:32px] [--icon-end:6px]",
    label: "ps-4 pe-[calc(var(--icon-circle)+var(--icon-end)+10px)]",
    arrow: "size-4",
  },
} as const;

export interface ArrowFillButtonOwnProps {
  btnText?: ReactNode;
  /** In-app route. Renders a react-router Link. */
  to?: To;
  /** External or plain link, used when `to` is not set. */
  href?: string;
  size?: keyof typeof SIZES;
  className?: string;
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  fillBgColor?: string;
  fillTextColor?: string;
  hoverFillBgColor?: string;
  hoverFillTextColor?: string;
  arrowColor?: string;
  hoverArrowColor?: string;
}

export type ArrowFillButtonProps = ArrowFillButtonOwnProps & Omit<ComponentPropsWithoutRef<"a">, keyof ArrowFillButtonOwnProps>;

function ArrowFillButton({
  btnText = "Hover Me",
  to,
  href = DEFAULT_HREF,
  size = "fluid",
  className = "",

  bgColor = "#ff5f00",
  textColor = "#ffffff",
  borderColor,

  fillBgColor = "#ffffff",
  fillTextColor = "#ff5f00",

  hoverFillBgColor = "#ffffff",
  hoverFillTextColor = "#ff5f00",

  arrowColor,
  hoverArrowColor,

  style,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  ...props
}: ArrowFillButtonProps) {
  const [isReady, setIsReady] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const releaseTimeoutRef = useRef<number | null>(null);
  const sizing = SIZES[size];

  const usesUtilityBackground = /\b(bg|from|via|to)-/.test(className);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => () => {
    if (releaseTimeoutRef.current) window.clearTimeout(releaseTimeoutRef.current);
  }, []);

  const releaseSoon = () => {
    if (releaseTimeoutRef.current) window.clearTimeout(releaseTimeoutRef.current);
    releaseTimeoutRef.current = window.setTimeout(() => {
      setIsPressed(false);
      releaseTimeoutRef.current = null;
    }, ANIMATION_DURATION_MS);
  };

  // Mouse users get the fill from :hover; touch and pen get it while pressed.
  const handlePointerDown = (event: PointerEvent<HTMLAnchorElement>) => {
    onPointerDown?.(event);
    if (event.pointerType === "mouse") return;
    if (releaseTimeoutRef.current) {
      window.clearTimeout(releaseTimeoutRef.current);
      releaseTimeoutRef.current = null;
    }
    setIsPressed(true);
  };
  const handlePointerUp = (event: PointerEvent<HTMLAnchorElement>) => {
    onPointerUp?.(event);
    if (event.pointerType !== "mouse") releaseSoon();
  };
  const handlePointerCancel = (event: PointerEvent<HTMLAnchorElement>) => {
    onPointerCancel?.(event);
    if (event.pointerType !== "mouse") releaseSoon();
  };

  const transition = isReady ? `duration-450 ${EASE} motion-reduce:transition-none` : "";

  const rootClassName = cn(
    "group relative inline-flex w-fit min-w-fit max-w-none cursor-pointer items-center justify-center overflow-hidden rounded-full border border-solid border-(--btn-border) whitespace-nowrap font-medium leading-none no-underline [text-rendering:geometricPrecision] [--circle-inset-y:calc((100%-var(--icon-circle))/2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--btn-bg)",
    // Where the arrow circle sits, for the label clip. Swapped in RTL so it stays on the end side.
    "[--clip-left:calc(100%-var(--icon-end)-var(--icon-circle))] [--clip-right:var(--icon-end)] rtl:[--clip-left:var(--icon-end)] rtl:[--clip-right:calc(100%-var(--icon-end)-var(--icon-circle))]",
    sizing.root,
    usesUtilityBackground ? "" : "bg-(--btn-bg)",
    "text-(--btn-text)",
    className,
  );

  const rootStyle = {
    "--btn-bg": bgColor,
    "--btn-text": textColor,
    "--btn-border": borderColor ?? bgColor,
    "--btn-fill-bg": fillBgColor,
    "--btn-fill-text": fillTextColor,
    "--btn-fill-bg-hover": hoverFillBgColor,
    "--btn-fill-text-hover": hoverFillTextColor,
    "--btn-arrow": arrowColor || fillTextColor,
    "--btn-arrow-hover": hoverArrowColor || hoverFillTextColor,
    visibility: isReady ? "visible" : "hidden",
    ...style,
  } as CSSProperties & Record<string, string | number>;

  const content = (
    <>
      <span className="relative z-1 pb-px">{btnText}</span>

      {/* Fill: starts as the arrow circle, grows to cover the whole button. */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute z-2 rounded-full bg-(--btn-fill-bg) [inset-block:var(--circle-inset-y)] [inset-inline-start:calc(100%-var(--icon-end)-var(--icon-circle))] [inset-inline-end:var(--icon-end)]",
          isReady && `transition-all ${transition} ${FILL_ACTIVE}`,
        )}
      />

      {/* Second copy of the label in the fill colours, revealed as the fill grows. */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 z-2 flex items-center text-(--btn-fill-text) [clip-path:inset(var(--circle-inset-y)_var(--clip-right)_var(--circle-inset-y)_var(--clip-left))]",
          sizing.label,
          isReady && `transition-all ${transition} ${LABEL_ACTIVE}`,
        )}
      >
        <span className="relative z-1 pb-px whitespace-nowrap">{btnText}</span>
      </div>

      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute end-(--icon-end) top-1/2 z-3 inline-flex h-(--icon-circle) w-(--icon-circle) shrink-0 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full bg-(--btn-fill-bg) text-(--btn-arrow) rtl:-scale-x-100",
          isReady && `transition-colors ${transition} ${CIRCLE_ACTIVE}`,
        )}
        style={{ WebkitMaskImage: "-webkit-radial-gradient(white, black)", maskImage: "radial-gradient(white, black)" }}
      >
        <ArrowRight
          className={cn(
            "absolute left-1/2 top-1/2 translate-x-[-170%] -translate-y-1/2 origin-center scale-0 text-current",
            sizing.arrow,
            isReady && `transition-transform ${transition} ${ARROW_IN_ACTIVE}`,
          )}
          strokeWidth={1.8}
        />
        <ArrowRight
          className={cn(
            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 origin-center text-current",
            sizing.arrow,
            isReady && `transition-transform ${transition} ${ARROW_OUT_ACTIVE}`,
          )}
          strokeWidth={1.8}
        />
      </span>
    </>
  );

  const shared = {
    // Screen readers: the label is drawn twice (one copy is aria-hidden); name the link once, explicitly.
    "aria-label": typeof btnText === "string" ? btnText : undefined,
    ...props,
    "data-pressed": isPressed ? "true" : "false",
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel,
    className: rootClassName,
    style: rootStyle,
  };

  return to !== undefined
    ? <Link to={to} {...shared}>{content}</Link>
    : <a href={href} {...shared}>{content}</a>;
}

export default ArrowFillButton;
