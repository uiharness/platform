/**
 * [Client]
 * An abstract representation of the configuration store
 * that works on either the [main] or [renderer] processes.
 */
export type IStoreClient<T extends StoreJson = {}> = {
  // events$: Observable<StoreEvents>;

  read: (...keys: Array<keyof T>) => Promise<Partial<T>>;
  write: (
    ...values: Array<IStoreKeyValue<T>>
  ) => Promise<IStoreSetValuesResponse>;

  get: <V extends StoreValue>(key: keyof T, defaultValue?: V) => Promise<V>;
  set: <K extends keyof T>(key: K, value: T[K]) => Promise<T[K]>;
  delete: <K extends keyof T>(...keys: K[]) => Promise<{}>;
};

export type IStoreKeyValue<T extends StoreJson = any> = {
  key: keyof T;
  value: T[keyof T] | undefined;
};

export type StoreValue = boolean | number | string | object | StoreJson;
export type StoreJson = {
  [key: string]: StoreValue | StoreValue[] | undefined;
};

export type IStoreFile = {
  version: number;
  body: StoreJson;
};

/**
 * The store client with extended [main] properties.
 */
export type IMainStoreClient<T extends StoreJson = {}> = IStoreClient<T> & {
  path: string;
};

/**
 * [Deletages]
 */
export type GetStoreValues<T extends StoreJson> = (
  keys: Array<keyof T>,
) => Promise<StoreJson>;

export type StoreSetAction = 'UPDATE' | 'DELETE';
export type SetStoreValues<T extends StoreJson> = (
  keys: Array<IStoreKeyValue<T>>,
  action: StoreSetAction,
) => Promise<IStoreSetValuesResponse>;

/**
 * [Events].
 */
export type StoreEvents =
  | IStoreChangeEvent
  | IStoreGetValuesEvent
  | IStoreSetValuesEvent;

export type IStoreChangeEvent = {
  type: '@platform/STORE/change';
  payload: {};
};

export type IStoreGetValuesEvent = {
  type: '@platform/STORE/get';
  payload: { keys: string[] };
};
export type IStoreGetValuesResponse = {
  ok: boolean;
  exists: boolean;
  version: number;
  body: StoreJson;
  error?: string;
};

export type IStoreSetValuesEvent = {
  type: '@platform/STORE/set';
  payload: {
    values: IStoreKeyValue[];
    action: StoreSetAction;
  };
};
export type IStoreSetValuesResponse<T extends StoreJson = {}> = {
  ok: boolean;
  error?: string;
};
