import { useState, useEffect, useCallback, useRef } from 'react';

interface UseUnsavedChangesOptions {
  onSave?: () => void | Promise<void>;
  initialData?: any;
  warningMessage?: string;
}

interface UseUnsavedChangesReturn {
  hasUnsavedChanges: boolean;
  markAsChanged: () => void;
  markAsSaved: () => void;
  confirmNavigation: (callback: () => void) => void;
  setInitialData: (data: any) => void;
}

export function useUnsavedChanges(
  currentData: any,
  options: UseUnsavedChangesOptions = {}
): UseUnsavedChangesReturn {
  const {
    warningMessage = "You have unsaved changes. Are you sure you want to leave?"
  } = options;

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const initialDataRef = useRef<any>(options.initialData);
  const isNavigatingRef = useRef(false);

  // Compare current data with initial data
  useEffect(() => {
    if (initialDataRef.current === undefined) {
      initialDataRef.current = currentData;
      return;
    }

    const isDifferent = JSON.stringify(currentData) !== JSON.stringify(initialDataRef.current);
    setHasUnsavedChanges(isDifferent);
  }, [currentData]);

  // Browser beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !isNavigatingRef.current) {
        e.preventDefault();
        e.returnValue = warningMessage;
        return warningMessage;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, warningMessage]);

  const markAsChanged = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  const markAsSaved = useCallback(() => {
    initialDataRef.current = currentData;
    setHasUnsavedChanges(false);
  }, [currentData]);

  const setInitialData = useCallback((data: any) => {
    initialDataRef.current = data;
    setHasUnsavedChanges(false);
  }, []);

  const confirmNavigation = useCallback((callback: () => void) => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(warningMessage);
      if (confirmed) {
        isNavigatingRef.current = true;
        callback();
        isNavigatingRef.current = false;
      }
    } else {
      callback();
    }
  }, [hasUnsavedChanges, warningMessage]);

  return {
    hasUnsavedChanges,
    markAsChanged,
    markAsSaved,
    confirmNavigation,
    setInitialData,
  };
}

// Auto-save hook
interface UseAutoSaveOptions {
  interval?: number; // in milliseconds
  onSave: (data: any) => void | Promise<void>;
  enabled?: boolean;
}

export function useAutoSave(
  data: any,
  options: UseAutoSaveOptions
): { lastSaved: Date | null; isSaving: boolean } {
  const { interval = 30000, onSave, enabled = true } = options;
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const dataRef = useRef(data);
  const lastSavedDataRef = useRef<string>("");

  dataRef.current = data;

  useEffect(() => {
    if (!enabled) return;

    const saveData = async () => {
      const currentDataStr = JSON.stringify(dataRef.current);

      // Only save if data has changed
      if (currentDataStr === lastSavedDataRef.current) return;

      setIsSaving(true);
      try {
        await onSave(dataRef.current);
        lastSavedDataRef.current = currentDataStr;
        setLastSaved(new Date());
      } catch (error) {
        console.error("Auto-save failed:", error);
      } finally {
        setIsSaving(false);
      }
    };

    const intervalId = setInterval(saveData, interval);
    return () => clearInterval(intervalId);
  }, [interval, onSave, enabled]);

  return { lastSaved, isSaving };
}

// Local storage persistence hook
interface UseLocalStoragePersistenceOptions {
  key: string;
  enabled?: boolean;
}

export function useLocalStoragePersistence<T>(
  data: T,
  options: UseLocalStoragePersistenceOptions
): {
  restore: () => T | null;
  clear: () => void;
  hasStoredData: boolean;
} {
  const { key, enabled = true } = options;
  const [hasStoredData, setHasStoredData] = useState(false);

  // Save to localStorage when data changes
  useEffect(() => {
    if (!enabled) return;

    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
    }
  }, [data, key, enabled]);

  // Check if there's stored data on mount
  useEffect(() => {
    if (!enabled) return;

    try {
      const stored = localStorage.getItem(key);
      setHasStoredData(stored !== null);
    } catch {
      setHasStoredData(false);
    }
  }, [key, enabled]);

  const restore = useCallback((): T | null => {
    if (!enabled) return null;

    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to restore from localStorage:", error);
    }
    return null;
  }, [key, enabled]);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setHasStoredData(false);
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
    }
  }, [key]);

  return { restore, clear, hasStoredData };
}
