'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/trpc/react';

export function useGetCredits() {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const trpc = useTRPC();

  const { data: creditsData, isLoading: isLoadingCredits } = useQuery({
    ...trpc.credits.getAvailableCredits.queryOptions(),
    enabled: isAuthenticated,
  });

  return {
    credits: creditsData?.totalCredits,
    isLoadingCredits,
  };
}
