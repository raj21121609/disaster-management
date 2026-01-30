import React, { forwardRef } from "react"
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react"
import { cn } from "../../lib/utils"

const alertVariants = {
    default: "bg-background text-foreground border-border",
    destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
    // Command Center Variants
    critical: "border-red-900 bg-red-900/10 text-red-500 [&>svg]:text-red-500",
    warning: "border-amber-900 bg-amber-900/10 text-amber-500 [&>svg]:text-amber-500",
    success: "border-emerald-900 bg-emerald-900/10 text-emerald-500 [&>svg]:text-emerald-500",
    info: "border-blue-900 bg-blue-900/10 text-blue-500 [&>svg]:text-blue-500",
}

const icons = {
    default: Info,
    destructive: XCircle,
    critical: AlertCircle,
    warning: AlertCircle,
    success: CheckCircle,
    info: Info,
}

const Alert = forwardRef(({ className, variant = "default", title, children, icon: IconOverride, ...props }, ref) => {
    const Icon = IconOverride || icons[variant] || Info

    return (
        <div
            ref={ref}
            role="alert"
            className={cn(
                "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
                alertVariants[variant],
                className
            )}
            {...props}
        >
            <Icon className="h-4 w-4" />
            {title && <h5 className="mb-1 font-medium leading-none tracking-tight">{title}</h5>}
            <div className="text-sm [&_p]:leading-relaxed">{children}</div>
        </div>
    )
})
Alert.displayName = "Alert"

export { Alert }
export default Alert
