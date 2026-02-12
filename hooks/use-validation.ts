import { useState, useEffect, useRef, useCallback } from 'react';
import { ValidationAlert, AlertType, ValidationState, countAlertsByType, deduplicateAlerts } from '@/lib/validation-types';

const VALIDATION_DEBOUNCE_MS = 250;

interface UseValidationOptions {
  onValidationComplete?: (alerts: ValidationAlert[]) => void;
  autoValidate?: boolean;
}

interface UseValidationReturn extends ValidationState {
  validate: () => Promise<ValidationAlert[]>;
  clearAlerts: () => void;
  addAlert: (alert: ValidationAlert) => void;
  removeAlert: (fieldName: string) => void;
  getFieldAlerts: (fieldName: string) => ValidationAlert[];
  getPathAlerts: (path: string) => ValidationAlert[];
  counts: ReturnType<typeof countAlertsByType>;
  hasErrors: boolean;
  hasWarnings: boolean;
  setAlerts: (alerts: ValidationAlert[]) => void;
}

export function useValidation(
  data: any,
  validationFn: (data: any) => Promise<ValidationAlert[]> | ValidationAlert[],
  options: UseValidationOptions = {}
): UseValidationReturn {
  const { onValidationComplete, autoValidate = true } = options;

  const [alerts, setAlerts] = useState<ValidationAlert[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [hasValidated, setHasValidated] = useState(false);
  const [canGenerate, setCanGenerate] = useState(false);
  const [lastValidatedAt, setLastValidatedAt] = useState<Date | undefined>();

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const validationRunningRef = useRef(false);
  const dataRef = useRef(data);
  dataRef.current = data;

  const validate = useCallback(async (): Promise<ValidationAlert[]> => {
    if (validationRunningRef.current) {
      return alerts;
    }

    validationRunningRef.current = true;
    setIsValidating(true);

    try {
      const result = await validationFn(dataRef.current);
      const dedupedAlerts = deduplicateAlerts(result);

      setAlerts(dedupedAlerts);
      setHasValidated(true);
      setLastValidatedAt(new Date());

      // Can generate if no errors (warnings are okay)
      const hasErrors = dedupedAlerts.some(a => a.type === AlertType.ERROR);
      setCanGenerate(!hasErrors);

      onValidationComplete?.(dedupedAlerts);

      return dedupedAlerts;
    } finally {
      validationRunningRef.current = false;
      setIsValidating(false);
    }
  }, [validationFn, onValidationComplete, alerts]);

  // Debounced auto-validation when data changes
  useEffect(() => {
    if (!autoValidate) return;

    // Clear any pending validation
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Mark as not validated when data changes
    setCanGenerate(false);
    setHasValidated(false);

    // Schedule debounced validation
    debounceRef.current = setTimeout(() => {
      validate();
    }, VALIDATION_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [data, autoValidate, validate]);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
    setHasValidated(false);
    setCanGenerate(false);
  }, []);

  const addAlert = useCallback((alert: ValidationAlert) => {
    setAlerts(prev => deduplicateAlerts([...prev, alert]));
  }, []);

  const removeAlert = useCallback((fieldName: string) => {
    setAlerts(prev => prev.filter(a => a.fieldName !== fieldName));
  }, []);

  const getFieldAlerts = useCallback((fieldName: string): ValidationAlert[] => {
    return alerts.filter(a => a.fieldName === fieldName);
  }, [alerts]);

  const getPathAlerts = useCallback((path: string): ValidationAlert[] => {
    return alerts.filter(a => a.path === path || a.fieldName === path);
  }, [alerts]);

  const counts = countAlertsByType(alerts);
  const hasErrors = counts.errors > 0;
  const hasWarnings = counts.warnings > 0;

  return {
    alerts,
    isValidating,
    hasValidated,
    canGenerate,
    lastValidatedAt,
    validate,
    clearAlerts,
    addAlert,
    removeAlert,
    getFieldAlerts,
    getPathAlerts,
    counts,
    hasErrors,
    hasWarnings,
    setAlerts,
  };
}

// Simpler hook for field-level validation (no debounce, synchronous)
export function useFieldValidation(
  value: any,
  validations: Array<{ check: (v: any) => boolean; message: string; type: AlertType }>
): ValidationAlert[] {
  const [alerts, setAlerts] = useState<ValidationAlert[]>([]);

  useEffect(() => {
    const newAlerts: ValidationAlert[] = [];

    for (const validation of validations) {
      if (!validation.check(value)) {
        newAlerts.push({
          fieldName: '',
          description: validation.message,
          type: validation.type,
        });
      }
    }

    setAlerts(newAlerts);
  }, [value, validations]);

  return alerts;
}
