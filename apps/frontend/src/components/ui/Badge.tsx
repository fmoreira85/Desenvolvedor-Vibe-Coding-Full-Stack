import type { HTMLAttributes, PropsWithChildren } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../utils/cn";

const badgeStyles = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "bg-[var(--accent-soft)] text-primary",
        secondary: "bg-muted text-muted-foreground",
        outline: "border border-border bg-white text-muted-foreground",
        success: "bg-[var(--success-soft)] text-success",
        warning: "bg-[var(--warning-soft)] text-warning",
        danger: "bg-[var(--danger-soft)] text-danger"
      }
    },
    defaultVariants: {
      variant: "outline"
    }
  }
);

export const Badge = ({
  children,
  className,
  variant,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeStyles>>) => (
  <span
    className={cn(badgeStyles({ variant }), className)}
    {...props}
  >
    {children}
  </span>
);
