import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "../../utils/cn";
export const Input = ({ className, ...props }) => {
    return _jsx("input", { className: cn("field", className), ...props });
};
