import React, { createContext, useContext } from 'react';

import type { AuthState } from '@/types/common';

type SyncStatus = 'idle' | 'syncing' | 'error' | 'disabled';

interface SyncContextValue {
  readonly status: SyncStatus;
  readonly lastSyncedAt: number | null;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function useSyncContext(): SyncContextValue {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within a SyncProvider');
  }
  return context;
}

interface SyncProviderProps {
  readonly authState: AuthState;
  readonly children: React.ReactNode;
}

/**
 * Placeholder provider for PowerSync integration.
 *
 * When the user is authenticated, this will initialize the PowerSync client
 * to enable bidirectional sync between the local SQLite database and
 * Supabase Postgres. For guest users, sync is disabled.
 */
export function SyncProvider({ authState, children }: SyncProviderProps): React.JSX.Element {
  // TODO: Initialize PowerSync when authState.status === 'authenticated'
  // - Create PowerSync database instance
  // - Connect to Supabase backend connector
  // - Start sync loop
  // - Expose sync status and controls

  const value: SyncContextValue = {
    status: authState.status === 'authenticated' ? 'idle' : 'disabled',
    lastSyncedAt: null,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}
