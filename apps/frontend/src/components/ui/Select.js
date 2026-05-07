import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "../../utils/cn";
export const Select = ({ className, ...props }) => {
    return _jsx("select", { className: cn("field pr-10", className), ...props });
};
