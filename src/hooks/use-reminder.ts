import { useCallback, useEffect, useMemo, useState } from 'react';

import { useDatabaseContext } from '@/providers/database-provider';
import { createReminderService } from '@/services/reminder-service';

const GUEST_USER_ID = 'guest';

interface UseReminderResult {
  readonly isEnabled: boolean;
  readonly hour: number;
  readonly minute: number;
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly setReminder: (params: { hour: number; minute: number }) => Promise<void>;
  readonly disable: () => Promise<void>;
  readonly refresh: () => Promise<void>;
}

export function useReminder(): UseReminderResult {
  const { db } = useDatabaseContext();
  const service = useMemo(() => createReminderService(db), [db]);

  const [isEnabled, setIsEnabled] = useState(false);
  const [hour, setHour] = useState(20);
  const [minute, setMinute] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      const config = await service.getConfig(GUEST_USER_ID);

      if (config) {
        setIsEnabled(config.isEnabled);
        setHour(config.hour);
        setMinute(config.minute);
      }

      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const setReminder = useCallback(
    async (params: { hour: number; minute: number }): Promise<void> => {
      try {
        const config = await service.setReminder(GUEST_USER_ID, params);
        setIsEnabled(config.isEnabled);
        setHour(config.hour);
        setMinute(config.minute);
        setError(null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    },
    [service],
  );

  const disable = useCallback(async (): Promise<void> => {
    try {
      await service.disable(GUEST_USER_ID);
      setIsEnabled(false);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }, [service]);

  return {
    isEnabled,
    hour,
    minute,
    isLoading,
    error,
    setReminder,
    disable,
    refresh: loadConfig,
  };
}
