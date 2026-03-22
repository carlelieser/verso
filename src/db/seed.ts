import { eq } from 'drizzle-orm';

import { GUEST_USER_ID } from '@/constants/user';
import type { Db } from '@/db/client';
import { users } from '@/db/schema';

/**
 * Ensures the guest user row exists in the database.
 *
 * The journal and entry tables have FK constraints that reference
 * users.id, so a guest user row must be present before any data
 * can be inserted for unauthenticated users.
 */
export async function ensureGuestUser(db: Db): Promise<void> {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, GUEST_USER_ID))
    .limit(1);

  if (existing.length > 0) {
    return;
  }

  const now = new Date();

  await db.insert(users).values({
    id: GUEST_USER_ID,
    isGuest: true,
    createdAt: now,
    updatedAt: now,
  });
}
