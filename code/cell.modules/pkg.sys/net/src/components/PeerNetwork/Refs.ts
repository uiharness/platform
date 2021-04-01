import { PeerJS, t } from '../../common';

type ConnectionKind = t.PeerNetworkConnectRes['kind'];

export type SelfRef = {
  id: string;
  peer: PeerJS;
  createdAt: number;
  signal: t.PeerNetworkSignalEndpoint;
  connections: ConnectionRef[];
  media: { video?: MediaStream; screen?: MediaStream };
};

export type ConnectionRef = {
  kind: 'data' | 'media';
  id: t.PeerConnectionStatus['id'];
  conn: PeerJS.DataConnection | PeerJS.MediaConnection;
  media?: MediaStream;
};

/**
 * Memory references to network objects.
 */
export function MemoryRefs() {
  const self: { [id: string]: SelfRef } = {};
  const refs = {
    self,

    connection(self: SelfRef) {
      return {
        add(
          kind: ConnectionKind,
          conn: PeerJS.DataConnection | PeerJS.MediaConnection,
          media?: MediaStream,
        ) {
          const existing = self.connections.find((item) => item.conn === conn);
          if (existing) return existing;

          const local = self.peer.id;
          const remote = conn.peer;
          const ref: ConnectionRef = { kind, id: { local, remote }, conn, media };
          self.connections = [...self.connections, ref];
          return ref;
        },

        remove(conn: PeerJS.DataConnection | PeerJS.MediaConnection) {
          self.connections = self.connections.filter((item) => item.conn !== conn);
        },

        get(conn: t.PeerNetworkId | PeerJS.DataConnection | PeerJS.MediaConnection) {
          const remote = typeof conn === 'string' ? conn : conn.peer;
          const ref = self.connections.find((ref) => ref.id.remote === remote);
          if (!ref) {
            const err = `The connection reference '${remote}' for local network '${self.id}' has not been added`;
            throw new Error(err);
          }
          return ref;
        },
      };
    },

    dispose() {
      Object.keys(refs.self).forEach((key) => delete refs.self[key]);
    },
  };

  return refs;
}