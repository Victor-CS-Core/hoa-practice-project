import {
  createContext,
  type HTMLAttributes,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";
import { cn } from "../../lib/cn";

type MenuCtx = {
  open: boolean;
  setOpen: (value: boolean) => void;
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
  const value = useMemo(() => ({ open, setOpen }), [open]);

  return (
    <DropdownContext.Provider value={value}>
      <div className="relative inline-block text-left">{children}</div>
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
  const { setOpen } = useDropdownContext();

  if (asChild) {
    return (
      <span role="button" tabIndex={0} onClick={() => setOpen(true)}>
        {children}
      </span>
    );
  }

  return (
    <button type="button" onClick={() => setOpen(true)}>
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  children,
  className,
  align,
}: {
  children: ReactNode;
  className?: string;
  align?: "start" | "end";
}) {
  const { open, setOpen } = useDropdownContext();
  if (!open) return null;

  return (
    <div
      className={cn(
        "absolute z-50 mt-2 min-w-44 rounded-md border border-stone-200 bg-white p-1 shadow-lg",
        align === "end" ? "right-0" : "left-0",
        className,
      )}
      onMouseLeave={() => setOpen(false)}
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
        "px-2 py-1.5 text-xs font-semibold text-stone-500",
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
  return <div className={cn("my-1 h-px bg-stone-200", className)} {...props} />;
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
        "flex w-full items-center rounded px-2 py-1.5 text-left text-sm text-stone-700 hover:bg-stone-100",
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
