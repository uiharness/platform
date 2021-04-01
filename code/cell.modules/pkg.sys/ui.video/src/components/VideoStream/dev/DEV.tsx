import React from 'react';
import { filter } from 'rxjs/operators';
import { DevActions, ObjectView } from 'sys.ui.dev';
import { css, color, CssValue, cuid, deleteUndefined, HttpClient, log, rx, t } from './common';
import { Waveform } from './DEV.waveform';

import {
  MediaStreamController,
  MediaStreamEvents,
  MediaStreamRecordController,
  useVideoStreamState,
  VideoStream,
  VideoStreamProps,
} from '..';

type Ctx = {
  ref: string;
  bus: t.EventBus<t.MediaEvent>;
  events: ReturnType<typeof MediaStreamEvents>;
  props: VideoStreamProps;
};

/**
 * Actions
 */
export const actions = DevActions<Ctx>()
  .namespace('ui.video/VideoStream')
  .context((prev) => {
    if (prev) return prev;

    const ref = cuid();
    const bus = rx.bus<t.MediaEvent>();
    const events = MediaStreamEvents({ bus });

    MediaStreamController({ bus });
    MediaStreamRecordController({ ref, bus });

    // bus.fire({ type: 'MediaStream/start:video', payload: { ref } });

    rx.payload<t.MediaStreamErrorEvent>(bus.event$, 'MediaStream/error')
      .pipe(filter((e) => e.ref === ref))
      .subscribe((e) => {
        log.info('MediaStream/error:', e);
      });

    return {
      ref,
      bus,
      events,
      props: { isMuted: true },
    };
  })

  .items((e) => {
    e.title('Get Started');

    e.hr(1, 0.1);

    e.button('fire: MediaStream/start:video', async (e) => {
      const ref = e.ctx.ref;
      await e.ctx.events.stop(ref).fire();
      e.ctx.bus.fire({ type: 'MediaStream/start:video', payload: { ref } });
    });

    e.button('fire: MediaStream/start:screen', async (e) => {
      const ref = e.ctx.ref;
      await e.ctx.events.stop(ref).fire();
      e.ctx.bus.fire({ type: 'MediaStream/start:screen', payload: { ref } });
    });

    e.button('fire: MediaStream/stop', (e) => {
      const ref = e.ctx.ref;
      e.ctx.bus.fire({ type: 'MediaStream/stop', payload: { ref } });
    });

    e.hr(1, 0.1);

    e.button('fire: MediaStream/status:req', async (e) => {
      const ref = e.ctx.ref;
      const data = deleteUndefined(await e.ctx.events.status(ref).get());
      e.button.description = <ObjectView name={'response: status'} data={data} fontSize={10} />;
    });

    e.button('fire: MediaStreams/status:req (all)', async (e) => {
      const data = deleteUndefined(await e.ctx.events.all.status().get());
      const name = 'response: status (all)';
      e.button.description = <ObjectView name={name} data={data} fontSize={10} expandLevel={3} />;
    });

    e.hr();
  })

  .items((e) => {
    e.title('Record');

    e.button('start', (e) => {
      const ref = e.ctx.ref;
      e.ctx.bus.fire({ type: 'MediaStream/record/start', payload: { ref } });
    });

    e.button('stop (and download)', (e) => {
      const ref = e.ctx.ref;
      e.ctx.bus.fire({
        type: 'MediaStream/record/stop',
        payload: { ref, download: { filename: 'test' } },
      });
    });

    e.button((config) =>
      config
        .label('stop (and save to cell.fs)')
        .description('target: `host/cell:<ns>:A1`')
        .pipe((e) => {
          return new Promise<void>((resolve, reject) => {
            const ref = e.ctx.ref;
            e.ctx.bus.fire({
              type: 'MediaStream/record/stop',
              payload: {
                ref,
                data: async (file) => {
                  // const host = 5000;
                  const host = 'https://os.ngrok.io';

                  const client = HttpClient.create(host);
                  const cell = client.cell('cell:ckm8fe8o0000d9reteimz8y7v:A1');
                  const filename = 'tmp/record.webm';
                  const data = await file.arrayBuffer();
                  const res = await cell.fs.upload({ filename, data });

                  console.log('HTTP Response', res);
                  console.log('OK', res.ok);
                  const url = cell.url.file.byName(filename).toString();
                  console.log('Saved to:', url);

                  const md = `recorded file [download](${url})`;
                  e.button.description = md;
                  resolve();
                },
              },
            });
          });
        }),
    );

    e.hr();
  })

  .subject((e) => {
    const { ref, bus } = e.ctx;
    const { width = 300 } = e.ctx.props;
    const styles = {
      streamRef: css({ fontSize: 9 }),
    };

    const elStreamRef = <div {...styles.streamRef}>stream-ref:{ref}</div>;

    e.settings({
      host: { background: -0.04 },
      layout: { cropmarks: -0.2 },
      actions: { width: 350 },
    });

    const borderRadius = 30;

    const Sample: React.FC = () => {
      const { stream } = useVideoStreamState({ ref, bus });
      const styles = {
        base: css({
          backgroundColor: color.format(-0.02),
          border: `solid 1px ${color.format(-0.03)}`,
          borderRadius,
        }),
      };
      return (
        <div {...styles.base}>
          <VideoStream {...e.ctx.props} stream={stream} borderRadius={borderRadius} />
        </div>
      );
    };

    e.render(<Sample />, { label: { topLeft: '<VideoStream>', bottomRight: elStreamRef } });

    e.render(<Waveform bus={bus} streamRef={ref} width={width} height={30} />, {
      width,
      background: 1,
      label: 'Audio Waveform',
    });
  });
export default actions;

/**
 * <VideoStream> recorder control.
 */
export type RecordControlsProps = { style?: CssValue };

export const RecordControls: React.FC<RecordControlsProps> = (props) => {
  const styles = { base: css({}) };
  return <div {...css(styles.base, props.style)}>RecordControls</div>;
};