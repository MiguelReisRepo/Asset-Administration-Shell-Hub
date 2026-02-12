"use client"

import * as React from "react"
import { AlertCircle, AlertTriangle, Info, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { AlertType, ValidationAlert, ALERT_COLORS, getHighestPriorityAlert } from "@/lib/validation-types"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ValidationBadgeProps {
  alerts: ValidationAlert[]
  fieldName?: string
  showCount?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6"
}

const countSizeClasses = {
  sm: "text-[10px] min-w-[14px] h-[14px]",
  md: "text-xs min-w-[18px] h-[18px]",
  lg: "text-sm min-w-[22px] h-[22px]"
}

export function ValidationBadge({
  alerts,
  fieldName,
  showCount = false,
  size = "md",
  className
}: ValidationBadgeProps) {
  const relevantAlerts = fieldName
    ? alerts.filter(a => a.fieldName === fieldName || a.path?.includes(fieldName))
    : alerts

  if (relevantAlerts.length === 0) {
    return null
  }

  const highestPriority = fieldName
    ? getHighestPriorityAlert(relevantAlerts, fieldName)
    : relevantAlerts[0]

  if (!highestPriority) return null

  const colors = ALERT_COLORS[highestPriority.type]
  const Icon = getIcon(highestPriority.type)
  const errorCount = relevantAlerts.filter(a => a.type === AlertType.ERROR).length
  const warningCount = relevantAlerts.filter(a => a.type === AlertType.WARNING).length
  const displayCount = errorCount || warningCount || relevantAlerts.length

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("relative inline-flex items-center cursor-help", className)}>
            <Icon
              className={cn(sizeClasses[size], "shrink-0")}
              style={{ color: colors.icon }}
            />
            {showCount && displayCount > 1 && (
              <span
                className={cn(
                  "absolute -top-1 -right-1 rounded-full flex items-center justify-center font-medium text-white",
                  countSizeClasses[size],
                  colors.badge
                )}
              >
                {displayCount}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          className={cn("max-w-xs p-3", colors.bg, colors.border, "border")}
        >
          <div className="space-y-2">
            {relevantAlerts.slice(0, 5).map((alert, idx) => (
              <div key={idx} className={cn("text-sm", colors.text)}>
                <div className="flex items-start gap-2">
                  {React.createElement(getIcon(alert.type), {
                    className: "w-4 h-4 shrink-0 mt-0.5",
                    style: { color: ALERT_COLORS[alert.type].icon }
                  })}
                  <div>
                    <p className="font-medium">{alert.description}</p>
                    {alert.hint && (
                      <p className="text-xs opacity-80 mt-1">{alert.hint}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {relevantAlerts.length > 5 && (
              <p className={cn("text-xs opacity-70", colors.text)}>
                +{relevantAlerts.length - 5} more issues
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function getIcon(type: AlertType) {
  switch (type) {
    case AlertType.ERROR:
      return AlertCircle
    case AlertType.WARNING:
      return AlertTriangle
    case AlertType.INFO:
      return Info
    default:
      return AlertCircle
  }
}

// Standalone validation icon without tooltip (for inline use)
interface ValidationIconProps {
  type: AlertType
  size?: "sm" | "md" | "lg"
  className?: string
}

export function ValidationIcon({ type, size = "md", className }: ValidationIconProps) {
  const colors = ALERT_COLORS[type]
  const Icon = getIcon(type)

  return (
    <Icon
      className={cn(sizeClasses[size], "shrink-0", className)}
      style={{ color: colors.icon }}
    />
  )
}

// Valid state indicator
interface ValidIndicatorProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function ValidIndicator({ size = "md", className }: ValidIndicatorProps) {
  return (
    <CheckCircle
      className={cn(sizeClasses[size], "shrink-0 text-green-500", className)}
    />
  )
}

// Compound status badge showing errors/warnings/valid
interface ValidationStatusProps {
  alerts: ValidationAlert[]
  size?: "sm" | "md" | "lg"
  className?: string
}

export function ValidationStatus({ alerts, size = "md", className }: ValidationStatusProps) {
  const errors = alerts.filter(a => a.type === AlertType.ERROR).length
  const warnings = alerts.filter(a => a.type === AlertType.WARNING).length

  if (errors > 0) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <ValidationIcon type={AlertType.ERROR} size={size} />
        <span className="text-red-600 dark:text-red-400 text-sm font-medium">
          {errors} error{errors !== 1 ? 's' : ''}
        </span>
      </div>
    )
  }

  if (warnings > 0) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <ValidationIcon type={AlertType.WARNING} size={size} />
        <span className="text-amber-600 dark:text-amber-400 text-sm font-medium">
          {warnings} warning{warnings !== 1 ? 's' : ''}
        </span>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <ValidIndicator size={size} />
      <span className="text-green-600 dark:text-green-400 text-sm font-medium">
        Valid
      </span>
    </div>
  )
}
