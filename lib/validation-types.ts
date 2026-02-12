// Validation types with severity levels (inspired by UI_IoT_Catalogue patterns)

export enum AlertType {
  ERROR = "error",
  WARNING = "warning",
  INFO = "info"
}

export interface ValidationAlert {
  fieldName: string;
  path?: string;
  description: string;
  type: AlertType;
  hint?: string;
  line?: number;
  fixable?: boolean;
  code?: string;
}

export interface FieldValidation {
  fieldName: string;
  schema: any; // Zod schema
  alertType: AlertType;
}

export interface ValidationState {
  alerts: ValidationAlert[];
  isValidating: boolean;
  hasValidated: boolean;
  canGenerate: boolean;
  lastValidatedAt?: Date;
}

export interface ValidationCounts {
  errors: number;
  warnings: number;
  info: number;
  total: number;
}

// Color constants for consistent UI
export const ALERT_COLORS = {
  [AlertType.ERROR]: {
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-300 dark:border-red-700",
    text: "text-red-800 dark:text-red-200",
    icon: "#DC4C64",
    badge: "bg-red-500"
  },
  [AlertType.WARNING]: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-300 dark:border-amber-700",
    text: "text-amber-800 dark:text-amber-200",
    icon: "#E4A11B",
    badge: "bg-amber-500"
  },
  [AlertType.INFO]: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-300 dark:border-blue-700",
    text: "text-blue-800 dark:text-blue-200",
    icon: "#54B4D3",
    badge: "bg-blue-500"
  }
} as const;

// Get the highest priority alert for a field (ERROR > WARNING > INFO)
export function getHighestPriorityAlert(alerts: ValidationAlert[], fieldName: string): ValidationAlert | undefined {
  const fieldAlerts = alerts.filter(a => a.fieldName === fieldName);

  // Return first error if any
  const error = fieldAlerts.find(a => a.type === AlertType.ERROR);
  if (error) return error;

  // Then warning
  const warning = fieldAlerts.find(a => a.type === AlertType.WARNING);
  if (warning) return warning;

  // Then info
  return fieldAlerts.find(a => a.type === AlertType.INFO);
}

// Get all alerts for a field path (supports nested paths like "Submodel > Element")
export function getAlertsForPath(alerts: ValidationAlert[], path: string): ValidationAlert[] {
  return alerts.filter(a => a.path === path || a.fieldName === path);
}

// Count alerts by type
export function countAlertsByType(alerts: ValidationAlert[]): ValidationCounts {
  const errors = alerts.filter(a => a.type === AlertType.ERROR).length;
  const warnings = alerts.filter(a => a.type === AlertType.WARNING).length;
  const info = alerts.filter(a => a.type === AlertType.INFO).length;

  return {
    errors,
    warnings,
    info,
    total: errors + warnings + info
  };
}

// Check if all alerts are fixable
export function hasOnlyFixableAlerts(alerts: ValidationAlert[]): boolean {
  return alerts.every(a => a.fixable !== false);
}

// Get fixable alerts count
export function countFixableAlerts(alerts: ValidationAlert[]): number {
  return alerts.filter(a => a.fixable === true).length;
}

// Group alerts by path for display
export function groupAlertsByPath(alerts: ValidationAlert[]): Map<string, ValidationAlert[]> {
  const grouped = new Map<string, ValidationAlert[]>();

  alerts.forEach(alert => {
    const key = alert.path || alert.fieldName;
    const existing = grouped.get(key) || [];
    existing.push(alert);
    grouped.set(key, existing);
  });

  return grouped;
}

// Deduplicate similar alerts
export function deduplicateAlerts(alerts: ValidationAlert[]): ValidationAlert[] {
  const seen = new Set<string>();
  return alerts.filter(alert => {
    const key = `${alert.fieldName}:${alert.description}:${alert.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
