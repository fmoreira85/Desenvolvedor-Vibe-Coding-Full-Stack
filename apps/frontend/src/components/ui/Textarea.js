import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "../../utils/cn";
export const Textarea = ({ className, ...props }) => {
    return _jsx("textarea", { className: cn("field-area", className), ...props });
};
