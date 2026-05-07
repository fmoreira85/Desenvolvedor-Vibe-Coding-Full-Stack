import type { SelectHTMLAttributes } from "react";

import { cn } from "../../utils/cn";

export const Select = ({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) => {
  return <select className={cn("field pr-10", className)} {...props} />;
};
