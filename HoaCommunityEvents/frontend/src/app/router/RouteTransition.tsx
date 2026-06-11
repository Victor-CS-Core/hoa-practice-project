import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";

interface RouteTransitionProps {
  children: ReactNode;
}

export function RouteTransition({ children }: RouteTransitionProps) {
  const location = useLocation();

  return (
    <div key={location.pathname} className="animate-fade-up">
      {children}
    </div>
  );
}
