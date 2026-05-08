import type { TextareaHTMLAttributes } from "react";

import { cn } from "../../utils/cn";

export const Textarea = ({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) => {
  return (
    <textarea
      className={cn("field-area shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]", className)}
      {...props}
    />
  );
};
