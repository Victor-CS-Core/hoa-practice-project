import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";

interface BackNavigationButtonProps {
  to: string;
  label: string;
  preferHistory?: boolean;
}

export function BackNavigationButton({
  to,
  label,
  preferHistory = true,
}: BackNavigationButtonProps) {
  const navigate = useNavigate();
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [isFloating, setIsFloating] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return false;
    }
    return window.matchMedia("(min-width: 640px)").matches;
  });
  const historyIndex = window.history.state?.idx;
  const canGoBack = typeof historyIndex === "number" && historyIndex > 0;
  const willUseHistory = preferHistory && canGoBack;

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia("(min-width: 640px)");
    const onChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches);
    };

    mediaQuery.addEventListener("change", onChange);

    return () => {
      mediaQuery.removeEventListener("change", onChange);
    };
  }, []);

  useEffect(() => {
    if (!isDesktop) return;

    const anchor = anchorRef.current;
    if (!anchor) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFloating(!entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: "-72px 0px 0px 0px",
      },
    );

    observer.observe(anchor);

    return () => {
      observer.disconnect();
    };
  }, [isDesktop]);

  const handleClick = () => {
    if (willUseHistory) {
      navigate(-1);
      return;
    }

    navigate(to);
  };

  const buttonContent = (
    <>
      <ArrowLeft className="h-5 w-5 sm:h-4 sm:w-4" />
      <span className="hidden sm:inline">
        {willUseHistory ? "Back" : label}
      </span>
    </>
  );

  const showFloating = !isDesktop || isFloating;

  const floatingButton = (
    <div className="fixed bottom-4 right-4 z-60 sm:bottom-auto sm:right-auto sm:left-3 sm:top-24 lg:top-26">
      <div className="inline-flex rounded-full border border-stone-300/45 bg-stone-100/55 p-1 shadow-sm backdrop-blur-md supports-backdrop-filter:bg-stone-100/45 sm:rounded-xl dark:border-stone-600/45 dark:bg-stone-800/50 dark:supports-backdrop-filter:bg-stone-800/40">
        <Button
          variant="outline"
          onClick={handleClick}
          aria-label={willUseHistory ? "Back" : label}
          tabIndex={showFloating ? 0 : -1}
          className="h-12 w-12 rounded-full! border-transparent bg-stone-200/65 p-0 text-stone-900 shadow-none backdrop-blur-sm supports-backdrop-filter:bg-stone-200/55 hover:bg-stone-200/80 sm:h-auto sm:w-auto sm:rounded-md sm:px-3 sm:py-2 dark:bg-stone-700/55 dark:text-stone-100 dark:supports-backdrop-filter:bg-stone-700/45 dark:hover:bg-stone-700/70"
        >
          {buttonContent}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {isDesktop && (
        <div ref={anchorRef} className="relative z-30">
          <div className="inline-flex rounded-xl border border-stone-300/45 bg-stone-100/55 p-1 shadow-sm backdrop-blur-md supports-backdrop-filter:bg-stone-100/45 dark:border-stone-600/45 dark:bg-stone-800/50 dark:supports-backdrop-filter:bg-stone-800/40">
            <Button
              variant="outline"
              onClick={handleClick}
              aria-label={willUseHistory ? "Back" : label}
              tabIndex={showFloating ? -1 : 0}
              className="h-auto w-auto rounded-md border-transparent bg-stone-200/65 px-3 py-2 text-stone-900 shadow-none backdrop-blur-sm supports-backdrop-filter:bg-stone-200/55 hover:bg-stone-200/80 dark:bg-stone-700/55 dark:text-stone-100 dark:supports-backdrop-filter:bg-stone-700/45 dark:hover:bg-stone-700/70"
            >
              {buttonContent}
            </Button>
          </div>
        </div>
      )}

      {showFloating && typeof document !== "undefined"
        ? createPortal(floatingButton, document.body)
        : null}
    </>
  );
}
