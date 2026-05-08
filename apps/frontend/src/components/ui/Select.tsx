import type { SelectHTMLAttributes } from "react";

import { cn } from "../../utils/cn";

export const Select = ({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) => {
  return <select className={cn("field pr-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]", className)} {...props} />;
};
