"use client"

import * as React from "react"
import { HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { AlertType, ValidationAlert, getHighestPriorityAlert } from "@/lib/validation-types"
import { ValidationBadge, ValidationIcon } from "@/components/ui/validation-badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ValidatedFieldProps {
  label: string
  fieldName: string
  value: string | undefined
  onChange: (value: string) => void
  alerts?: ValidationAlert[]
  required?: boolean
  disabled?: boolean
  placeholder?: string
  helpText?: string
  className?: string
  inputClassName?: string
  type?: "text" | "url" | "email"
}

export function ValidatedField({
  label,
  fieldName,
  value,
  onChange,
  alerts = [],
  required = false,
  disabled = false,
  placeholder,
  helpText,
  className,
  inputClassName,
  type = "text"
}: ValidatedFieldProps) {
  const fieldAlerts = alerts.filter(a => a.fieldName === fieldName || a.path?.includes(fieldName))
  const highestAlert = getHighestPriorityAlert(fieldAlerts, fieldName)

  const borderClass = highestAlert
    ? highestAlert.type === AlertType.ERROR
      ? "border-red-500 focus-visible:ring-red-500"
      : highestAlert.type === AlertType.WARNING
        ? "border-amber-500 focus-visible:ring-amber-500"
        : "border-blue-500 focus-visible:ring-blue-500"
    : ""

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Label
            htmlFor={fieldName}
            className={cn(
              "text-sm font-medium",
              required && "after:content-['*'] after:ml-0.5 after:text-red-500"
            )}
          >
            {label}
          </Label>
          {helpText && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="text-sm">{helpText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {fieldAlerts.length > 0 && (
          <ValidationBadge alerts={fieldAlerts} size="sm" showCount />
        )}
      </div>
      <Input
        id={fieldName}
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(borderClass, inputClassName)}
      />
      {highestAlert && (
        <p className={cn(
          "text-xs",
          highestAlert.type === AlertType.ERROR && "text-red-600 dark:text-red-400",
          highestAlert.type === AlertType.WARNING && "text-amber-600 dark:text-amber-400",
          highestAlert.type === AlertType.INFO && "text-blue-600 dark:text-blue-400"
        )}>
          {highestAlert.description}
        </p>
      )}
    </div>
  )
}

// Wrapper for any field content with validation display
interface ValidatedFieldWrapperProps {
  label: string
  fieldName: string
  alerts?: ValidationAlert[]
  required?: boolean
  helpText?: string
  className?: string
  children: React.ReactNode
}

export function ValidatedFieldWrapper({
  label,
  fieldName,
  alerts = [],
  required = false,
  helpText,
  className,
  children
}: ValidatedFieldWrapperProps) {
  const fieldAlerts = alerts.filter(a => a.fieldName === fieldName || a.path?.includes(fieldName))
  const highestAlert = getHighestPriorityAlert(fieldAlerts, fieldName)

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Label
            className={cn(
              "text-sm font-medium",
              required && "after:content-['*'] after:ml-0.5 after:text-red-500"
            )}
          >
            {label}
          </Label>
          {helpText && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="text-sm">{helpText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {fieldAlerts.length > 0 && (
          <ValidationBadge alerts={fieldAlerts} size="sm" showCount />
        )}
      </div>
      {children}
      {highestAlert && (
        <p className={cn(
          "text-xs",
          highestAlert.type === AlertType.ERROR && "text-red-600 dark:text-red-400",
          highestAlert.type === AlertType.WARNING && "text-amber-600 dark:text-amber-400",
          highestAlert.type === AlertType.INFO && "text-blue-600 dark:text-blue-400"
        )}>
          {highestAlert.description}
        </p>
      )}
    </div>
  )
}

// Field help tooltip for complex fields
interface FieldHelpProps {
  title: string
  description: string
  example?: string
  specLink?: string
}

export function FieldHelp({ title, description, example, specLink }: FieldHelpProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-sm p-3">
          <div className="space-y-2">
            <p className="font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
            {example && (
              <div className="text-xs bg-muted p-2 rounded font-mono">
                Example: {example}
              </div>
            )}
            {specLink && (
              <a
                href={specLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline inline-flex items-center gap-1"
              >
                View AAS Spec
              </a>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Common field help definitions for AAS
export const AAS_FIELD_HELP = {
  idShort: {
    title: "idShort",
    description: "A short identifier that must start with a letter and contain only letters, numbers, underscores, and hyphens.",
    example: "DigitalNameplate",
  },
  id: {
    title: "Identifier",
    description: "A globally unique identifier, typically a URN or URL.",
    example: "urn:example:aas:1.0.0",
  },
  semanticId: {
    title: "Semantic ID",
    description: "Reference to a concept description, usually an IRDI or IRI from ECLASS or IEC CDD.",
    example: "0173-1#02-AAO677#002",
  },
  globalAssetId: {
    title: "Global Asset ID",
    description: "A globally unique identifier for the physical asset.",
    example: "urn:example:asset:12345",
  },
  valueType: {
    title: "Value Type",
    description: "The XSD data type of the property value.",
    example: "xs:string, xs:integer, xs:boolean",
  },
  cardinality: {
    title: "Cardinality",
    description: "Specifies how many instances of this element are allowed.",
    example: "One, ZeroToOne, ZeroToMany, OneToMany",
  },
} as const
