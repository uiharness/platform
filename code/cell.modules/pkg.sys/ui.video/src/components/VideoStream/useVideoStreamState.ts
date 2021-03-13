import React, { useEffect, useRef, useState } from 'react';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { rx, t } from '../../common';

/**
 * Manages state from an event-but for the <VideoStream>.
 */
export function useVideoStreamState(args: { id: string; bus: t.EventBus<any> }) {
  const { id } = args;
  const bus = args.bus.type<t.MediaEvent>();
  const [stream, setStream] = useState<MediaStream | undefined>();

  useEffect(() => {
    const dispose$ = new Subject<void>();
    const $ = bus.event$.pipe(takeUntil(dispose$));

    rx.payload<t.MediaStreamStartedEvent>($, 'MediaStream/started')
      .pipe(filter((e) => e.ref === id))
      .subscribe((e) => setStream(e.stream));

    rx.payload<t.MediaStreamStopEvent>($, 'MediaStream/stop')
      .pipe(filter((e) => e.ref === id))
      .subscribe((e) => setStream(undefined));

    return () => dispose$.next();
  }, [bus, id]);

  return { stream };
}
