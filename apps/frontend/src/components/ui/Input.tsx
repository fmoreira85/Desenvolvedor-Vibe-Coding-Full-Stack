import type { InputHTMLAttributes } from "react";

import { cn } from "../../utils/cn";

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => {
  return <input className={cn("field", className)} {...props} />;
};
