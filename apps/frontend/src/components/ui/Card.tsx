import type { HTMLAttributes, PropsWithChildren } from "react";

import { cn } from "../../utils/cn";

export const Card = ({
  className,
  children,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) => {
  return (
    <div className={cn("panel-soft p-5 sm:p-6", className)} {...props}>
      {children}
    </div>
  );
};
