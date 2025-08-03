import type { ArtifactKind } from '@/components/artifact';

export interface ArtifactToolResult {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
}
