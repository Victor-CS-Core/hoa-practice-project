import { ArrowLeft } from "lucide-react";
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

  const handleClick = () => {
    const historyIndex = window.history.state?.idx;
    const canGoBack = typeof historyIndex === "number" && historyIndex > 0;

    if (preferHistory && canGoBack) {
      navigate(-1);
      return;
    }

    navigate(to);
  };

  return (
    <Button variant="outline" className="gap-2" onClick={handleClick}>
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}
