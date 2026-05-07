import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "../../utils/cn";
export const Card = ({ className, children, ...props }) => {
    return (_jsx("div", { className: cn("panel-soft p-5", className), ...props, children: children }));
};
