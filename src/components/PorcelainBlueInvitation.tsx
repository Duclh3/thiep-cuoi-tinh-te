import React from 'react';
import { VideoReplicaInvitation } from './VideoReplicaInvitation';

export default function PorcelainBlueInvitation(props: Omit<React.ComponentProps<typeof VideoReplicaInvitation>, 'variant'>) {
  return <VideoReplicaInvitation {...props} variant="porcelain" />;
}
