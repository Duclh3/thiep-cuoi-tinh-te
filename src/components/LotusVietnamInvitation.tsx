import React from 'react';
import { VideoReplicaInvitation } from './VideoReplicaInvitation';

export default function LotusVietnamInvitation(props: Omit<React.ComponentProps<typeof VideoReplicaInvitation>, 'variant'>) {
  return <VideoReplicaInvitation {...props} variant="lotus" />;
}
