import { t } from '../../common';

export type EventStackEvent = { id: string; event: t.Event; count: number };

export type EventStackCardFactory = (args: EventStackCardFactoryArgs) => JSX.Element;
export type EventStackCardFactoryArgs = EventStackEvent & {
  width: number;
  isTopCard: boolean;
  showPayload?: boolean;
  toggleShowPayload?: () => void;
};

export type EventBusHistoryHook = (args: EventBusHistoryArgs) => EventBusHistory;
export type EventBusHistoryArgs = {
  bus: t.EventBus<any>;
  max?: number;
  reset$?: t.Observable<void>;
};
export type EventBusHistory = {
  total: number;
  events: EventStackEvent[];
};
