import type { LucideIcon } from "lucide-react";

import { Button } from "./Button";
import { cn } from "../../utils/cn";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className
}: EmptyStateProps) => (
  <div className={cn("flex flex-col items-center justify-center py-14 text-center", className)}>
    <div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground">
      <Icon className="h-8 w-8" />
    </div>
    <h3 className="text-lg font-semibold text-foreground">{title}</h3>
    <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
    {actionLabel && onAction ? (
      <Button className="mt-5" onClick={onAction}>
        {actionLabel}
      </Button>
    ) : null}
  </div>
);
