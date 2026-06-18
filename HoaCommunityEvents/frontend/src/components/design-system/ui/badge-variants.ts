import { cva } from "class-variance-authority";

export const badgeVariants = cva("badge", {
  variants: {
    tone: {
      neutral: "badge-neutral",
      accent: "badge-accent",
      signal: "badge-signal",
      danger: "badge-danger",
      muted: "badge-muted",
      solid: "badge-solid",
    },
  },
  defaultVariants: {
    tone: "neutral",
  },
});
