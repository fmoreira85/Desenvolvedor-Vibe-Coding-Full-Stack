import type { TextareaHTMLAttributes } from "react";

import { cn } from "../../utils/cn";

export const Textarea = ({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) => {
  return <textarea className={cn("field-area", className)} {...props} />;
};
