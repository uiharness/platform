import { IDbFactory } from '@platform/hyperdb/lib/types';
import { IDb, INetwork } from '../types';

export * from '../types';

/**
 * A factory cor creating DB/Network pairs.
 */
export type IDbRendererFactory = IDbFactory<IDbRenderer, INetworkRenderer>;

/**
 * [Db]
 * Extensions to the API for a DB when it is running in the `renderer` process.
 */
export type IDbRenderer<D extends {} = any> = IDb<D> & {};

/**
 * [Network]
 * Extensions to the API for a network-swarm when it is running in the `renderer` process.
 */
export type INetworkRenderer = INetwork & {};
