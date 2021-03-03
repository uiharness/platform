import { PeerJS } from '../../common/libs';
import { IStateObjectWritable } from '@platform/state.types';

export * from '../../common/types';

export type ConversationState = {
  imageDir?: string | string[];
  selected?: string;
  zoom?: number;
  offset?: { x: number; y: number };
  videoZoom?: number;
  peers: ConversationStatePeers;
};

export type ConversationStatePeers = { [id: string]: ConversationStatePeer };
export type ConversationStatePeer = {
  id: string;
  userAgent: string;
  isSelf?: boolean;
  resolution: {
    body?: { width: number; height: number };
  };
};

export type ConversationModel = IStateObjectWritable<ConversationState>;

/**
 * Events
 */
export type ConversationEvent =
  | ConversationCreatedEvent
  | ConversationConnectEvent
  | ConversationPublishEvent
  | ConversationModelChangeEvent;

/**
 * Peer created.
 */
export type ConversationCreatedEvent = {
  type: 'Conversation/created';
  payload: ConversationCreated;
};
export type ConversationCreated = { peer: PeerJS };

/**
 * Connect to a peer.
 */
export type ConversationConnectEvent = {
  type: 'Conversation/connect';
  payload: ConversationConnect;
};
export type ConversationConnect = { id: string };

/**
 * Send data to all peers.
 */
export type ConversationModelChangeEvent = {
  type: 'Conversation/model/change';
  payload: ConversationModelChange;
};
export type ConversationModelChange = { data: Partial<ConversationState> };

/**
 * Broaqdcast data to all peers.
 */
export type ConversationPublishEvent = {
  type: 'Conversation/publish';
  payload: ConversationPublish;
};
export type ConversationPublish = ConversationPublishModel;

export type ConversationPublishModel = { kind: 'model'; data: Partial<ConversationState> };
