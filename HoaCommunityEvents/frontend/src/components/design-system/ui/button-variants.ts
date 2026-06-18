import { cva } from "class-variance-authority";

export const buttonVariants = cva("btn", {
  variants: {
    variant: {
      primary: "btn-primary",
      secondary: "btn-secondary",
      ghost: "btn-ghost",
      soft: "btn-soft",
      danger: "btn-danger",
      link: "btn-link",
    },
    size: {
      sm: "btn-small",
      md: "",
      lg: "btn-large",
      icon: "btn-icon",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});
