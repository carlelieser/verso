export class JournalNotFoundError extends Error {
  constructor(journalId: string, options?: { cause?: unknown }) {
    super(`Journal not found: ${journalId}`, options);
    this.name = 'JournalNotFoundError';
  }
}

export class EntryNotFoundError extends Error {
  constructor(entryId: string, options?: { cause?: unknown }) {
    super(`Entry not found: ${entryId}`, options);
    this.name = 'EntryNotFoundError';
  }
}

export class ExportError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'ExportError';
  }
}

export class TranscriptionError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'TranscriptionError';
  }
}

export class StorageFullError extends Error {
  constructor(options?: { cause?: unknown }) {
    super('Device storage is full. Please free up space to continue.', options);
    this.name = 'StorageFullError';
  }
}

export class AuthError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'AuthError';
  }
}
