import {
  createContext,
  type Dispatch,
  type HTMLAttributes,
  type ReactNode,
  type SetStateAction,
  useEffect,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "../../lib/cn";

type MenuCtx = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  rootRef: React.RefObject<HTMLDivElement | null>;
};

const DropdownContext = createContext<MenuCtx | null>(null);

function useDropdownContext() {
  const ctx = useContext(DropdownContext);
  if (!ctx) {
    throw new Error(
      "DropdownMenu components must be used inside DropdownMenu.",
    );
  }
  return ctx;
}

export function DropdownMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (!rootRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const value = useMemo(() => ({ open, setOpen, rootRef }), [open]);

  return (
    <DropdownContext.Provider value={value}>
      <div ref={rootRef} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger({
  children,
  asChild,
}: {
  children: ReactNode;
  asChild?: boolean;
}) {
  const { open, setOpen } = useDropdownContext();

  if (asChild) {
    return (
      <span
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen((prev) => !prev);
          }
        }}
      >
        {children}
      </span>
    );
  }

  return (
    <button
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={() => setOpen((prev) => !prev)}
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  children,
  className,
  align,
  side,
}: {
  children: ReactNode;
  className?: string;
  align?: "start" | "end";
  side?: "top" | "bottom" | "auto";
}) {
  const { open, rootRef } = useDropdownContext();
  const contentRef = useRef<HTMLDivElement>(null);
  const isAuto = side === "auto" || !side;
  const [autoSide, setAutoSide] = useState<"top" | "bottom">("bottom");

  useEffect(() => {
    if (!open || !isAuto) {
      return;
    }

    const getClippingAncestorRect = (element: HTMLElement): DOMRect | null => {
      let parent = element.parentElement;
      while (parent) {
        const styles = window.getComputedStyle(parent);
        const overflowY = styles.overflowY;
        const overflowX = styles.overflowX;
        const createsClipping = [overflowY, overflowX].some((value) =>
          ["auto", "scroll", "hidden", "clip"].includes(value),
        );

        if (createsClipping) {
          return parent.getBoundingClientRect();
        }

        parent = parent.parentElement;
      }

      return null;
    };

    const updatePosition = () => {
      const anchor = rootRef.current;
      const menu = contentRef.current;
      if (!anchor || !menu) return;

      const anchorRect = anchor.getBoundingClientRect();
      const clippingRect = getClippingAncestorRect(anchor);
      const boundaryTop = clippingRect ? Math.max(0, clippingRect.top) : 0;
      const boundaryBottom = clippingRect
        ? Math.min(window.innerHeight, clippingRect.bottom)
        : window.innerHeight;
      const menuHeight = menu.offsetHeight || 240;
      const spaceBelow = boundaryBottom - anchorRect.bottom;
      const spaceAbove = anchorRect.top - boundaryTop;
      const shouldOpenTop = spaceBelow < menuHeight && spaceAbove > spaceBelow;

      setAutoSide(shouldOpenTop ? "top" : "bottom");
    };

    const frame = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isAuto, open, rootRef]);

  const resolvedSide = isAuto ? autoSide : side === "top" ? "top" : "bottom";

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      className={cn(
        "absolute z-50 min-w-44 rounded-md border theme-border-surface theme-bg-surface p-1 theme-text-primary shadow-lg",
        resolvedSide === "top" ? "bottom-full mb-2" : "top-full mt-2",
        align === "end" ? "right-0" : "left-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuLabel({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-2 py-1.5 text-xs font-semibold theme-text-muted",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("my-1 h-px theme-bg-surface-border", className)}
      {...props}
    />
  );
}

export function DropdownMenuItem({
  className,
  onClick,
  ...props
}: HTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useDropdownContext();
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center rounded px-2 py-1.5 text-left text-sm theme-text-primary theme-hover-bg-surface-muted theme-focus-bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 theme-focus-ring-offset-surface",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        setOpen(false);
      }}
      {...props}
    />
  );
}
