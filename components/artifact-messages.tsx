import equal from 'fast-deep-equal';
import type { UIArtifact } from './artifact';
import { Messages, type MessagesProps } from './messages';
import { memo } from 'react';

export interface ArtifactMessagesProps extends MessagesProps {
  artifactStatus: UIArtifact['status'];
}

function PureArtifactMessages({
  artifactStatus,
  ...rest
}: ArtifactMessagesProps) {
  return <Messages {...rest} />;
}

function areEqual(
  prevProps: ArtifactMessagesProps,
  nextProps: ArtifactMessagesProps,
) {
  if (
    prevProps.artifactStatus === 'streaming' &&
    nextProps.artifactStatus === 'streaming'
  )
    return true;

  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.status && nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;
  if (prevProps.chatHelpers !== nextProps.chatHelpers) return false;

  return true;
}

export const ArtifactMessages = memo(PureArtifactMessages, areEqual);
