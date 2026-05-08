import type { InputHTMLAttributes } from "react";

import { cn } from "../../utils/cn";

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => {
  return <input className={cn("field shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]", className)} {...props} />;
};
