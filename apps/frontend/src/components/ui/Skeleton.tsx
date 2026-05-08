import type { HTMLAttributes } from "react";

import { cn } from "../../utils/cn";

export const Skeleton = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("skeleton", className)} {...props} />
);
