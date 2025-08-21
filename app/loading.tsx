import { WithSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <WithSkeleton isLoading={true} className="w-full h-full">
      <div className="flex h-dvh w-full" />
    </WithSkeleton>
  );
}
