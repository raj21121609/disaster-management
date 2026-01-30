import React, { forwardRef } from "react"
import { cn } from "../../lib/utils"

const Separator = forwardRef(
    ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
        <div
            ref={ref}
            role={decorative ? "none" : "separator"}
            aria-orientation={orientation}
            className={cn(
                "shrink-0 bg-slate-800",
                orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
                className
            )}
            {...props}
        />
    )
)
Separator.displayName = "Separator"

export { Separator }
export default Separator
