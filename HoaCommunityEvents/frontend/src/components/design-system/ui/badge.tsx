// bm-design-system: badge primitive
import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { badgeVariants } from "@/components/design-system/ui/badge-variants";
import { cn } from "@/lib/utils";

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, tone, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ tone, className }))}
        {...props}
      />
    );
  },
);
Badge.displayName = "Badge";

export { Badge };
