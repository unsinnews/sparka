import 'server-only';
import { and, eq, gte, sql } from 'drizzle-orm';

import { user } from '../db/schema';
import { db } from '../db/client';

export async function getUserCreditsInfo({ userId }: { userId: string }) {
  const users = await db
    .select({
      credits: user.credits,
      reservedCredits: user.reservedCredits,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  const userInfo = users[0];
  if (!userInfo) return null;

  return {
    totalCredits: userInfo.credits,
    availableCredits: userInfo.credits - userInfo.reservedCredits,
    reservedCredits: userInfo.reservedCredits,
  };
}

export async function reserveAvailableCredits({
  userId,
  maxAmount,
}: {
  userId: string;
  maxAmount: number;
}): Promise<{
  success: boolean;
  reservedAmount: number;
  availableCredits?: number;
}> {
  try {
    const userInfo = await getUserCreditsInfo({ userId });
    if (!userInfo) {
      return { success: false, reservedAmount: 0 };
    }

    const availableCredits = userInfo.availableCredits;
    const amountToReserve = Math.min(maxAmount, availableCredits);

    if (amountToReserve <= 0) {
      return { success: false, reservedAmount: 0 };
    }

    const result = await db
      .update(user)
      .set({
        reservedCredits: sql`${user.reservedCredits} + ${amountToReserve}`,
      })
      .where(
        and(
          eq(user.id, userId),
          gte(sql`${user.credits} - ${user.reservedCredits}`, amountToReserve),
        ),
      )
      .returning({
        credits: user.credits,
        reservedCredits: user.reservedCredits,
      });

    if (result.length === 0) {
      return { success: false, reservedAmount: 0 };
    }

    return {
      success: true,
      reservedAmount: amountToReserve,
      availableCredits: result[0].credits - result[0].reservedCredits,
    };
  } catch (error) {
    console.error('Failed to reserve available credits:', error);
    return { success: false, reservedAmount: 0 };
  }
}

export async function finalizeCreditsUsage({
  userId,
  reservedAmount,
  actualAmount,
}: {
  userId: string;
  reservedAmount: number;
  actualAmount: number;
}): Promise<void> {
  await db
    .update(user)
    .set({
      credits: sql`${user.credits} - ${actualAmount}`,
      reservedCredits: sql`${user.reservedCredits} - ${reservedAmount}`,
    })
    .where(eq(user.id, userId));
}

export async function releaseReservedCredits({
  userId,
  amount,
}: {
  userId: string;
  amount: number;
}): Promise<void> {
  await db
    .update(user)
    .set({
      reservedCredits: sql`${user.reservedCredits} - ${amount}`,
    })
    .where(eq(user.id, userId));
}
