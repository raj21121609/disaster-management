import React from "react"
import { cn } from "../../lib/utils"

const Badge = ({ className, variant = "default", ...props }) => {
    const variants = {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Command Center Statuses
        critical: "border-transparent bg-emergency-critical text-white shadow-sm shadow-red-900/50 animate-pulse-weak",
        high: "border-transparent bg-emergency-high text-white shadow-sm",
        medium: "border-transparent bg-emergency-medium text-black shadow-sm",
        low: "border-transparent bg-emergency-low text-white shadow-sm",
    }

    return (
        <div
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                variants[variant],
                className
            )}
            {...props}
        />
    )
}

export { Badge }
export default Badge
