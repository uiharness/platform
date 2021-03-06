import { debounceTime, filter } from 'rxjs/operators';
import { t, defaultValue, fs, log, time, util, watch } from '../common';
import { formatLength } from '../util';

const gray = log.info.gray;

type IHistoryItem = {
  index: number;
  createdAt: number;
  response: t.IFsRunSyncResponse;
  log?: string;
};

const EMPTY_SYNC_COUNT: t.IFsSyncCount = { total: 0, uploaded: 0, deleted: 0 };
const EMPTY_SYNC_RESPONSE: t.IFsRunSyncResponse = {
  ok: true,
  errors: [],
  count: EMPTY_SYNC_COUNT,
  bytes: -1,
  completed: true,
  results: { uploaded: [], deleted: [] },
};

const DIV = '-------------------------------------------------------';
const logDivider = (show?: boolean) => {
  if (show !== false) {
    log.info.gray(DIV);
  }
};

/**
 * Sarts a file-watcher on the directory.
 */
export async function watchDir(args: {
  config: t.IConfigFile;
  silent: boolean;
  sync: t.FsSyncRunCurry;
  debounce?: number;
  keyboard: t.ICmdKeyboard;
}) {
  const { config, silent, sync, keyboard } = args;
  const debounce = defaultValue(args.debounce, 1500);

  const pattern = `${config.dir}/**`;
  const paths = await fs.glob.find(pattern, {
    dot: false,
    includeDirs: false,
    ignore: ['**/node_modules/**'],
  });
  const initialCount = paths.length;

  const state = {
    renderCount: 0,
    isStarted: false,
    status: '',
    isSyncing() {
      return state.status?.includes('syncing');
    },
  };

  keyboard.keypress$.subscribe((e) => {
    if (e.key === 'l') {
      util.open(config).local();
    }
    if (e.key === 'r') {
      util.open(config).remote();
    }
    if (e.key === 's') {
      if (!state.isSyncing()) {
        syncPush();
      }
    }
    if (e.key === 'c') {
      util.openConfig();
    }
  });

  let history: IHistoryItem[] = [];
  let historyIndex = -1;
  const appendHistory = (response: t.IFsRunSyncResponse) => {
    const MAX = 10;
    if (history.length >= MAX) {
      history = history.slice(history.length - MAX);
    }
    const createdAt = time.now.timestamp;
    historyIndex++;
    history.push({ index: historyIndex, createdAt, response });
  };

  const dir$ = watch.start({ pattern }).events$.pipe(
    filter((e) => e.isFile),
    filter((e) => !e.name.startsWith('.')),
  );

  const render = (status?: string) => {
    if (!state.isStarted && state.renderCount > 0) {
      return;
    }

    state.status = status || '';
    log.clear();
    logHost({ status: state.status });
    log.info();
    logDivider();
    logHistory({ status });
    logDivider(history.length > 0);
    log.info();
    logCommands();
    log.info();
    state.renderCount++;
  };

  const logCommands = () => {
    const isSyncing = state.isSyncing();
    const color = (text: string, isActive = true) => {
      return isActive ? log.cyan(text) : log.gray(text);
    };

    gray(`Commands:`);
    gray(`• [${color('l')}] open local folder`);
    gray(`• [${color('r')}] open remote target in browser`);
    gray(`• [${color('s', !isSyncing)}] sync push to remote target`);
    gray(`• [${color('c')}] edit configuration`);
    gray(`• [${color('ctrl + c')}] exit`);
  };

  const logHost = (args: { status?: string } = {}) => {
    const status = args.status || '<watching>';
    const isSyncing = status?.includes('syncing');
    const uri = config.target.uri;

    const cellColor: util.log.Color = !state.isStarted ? 'gray' : isSyncing ? 'yellow' : 'blue';
    const cellTitle = util.log.cellKeyBg(uri.parts.key, isSyncing ? 'yellow' : 'blue');

    const dir = formatLength(config.dir, 40);
    const dirname = fs.basename(dir);
    const local = `${fs.dirname(dir)}/${isSyncing ? log.yellow(dirname) : dirname}/`;

    const table = log.table({ border: false });
    const add = (key: string, value = '') => {
      table.add([log.gray(key), '    ', log.gray(value)]);
    };

    const host = config.data.host.replace(/\/*$/, '');

    log.info(cellTitle);
    log.info();
    add('status:', status);
    add('local:', local);
    add('remote:');
    add('  host:', log.blue(host));
    add('  target:', util.log.cellUri(uri, cellColor));

    log.info(table.toString());
  };

  const logHistory = (args: { max?: number; status?: string } = {}) => {
    const { max = 5, status } = args;
    const isSyncing = status?.includes('syncing');
    const items = history.length < max ? history : history.slice(history.length - max);
    if (items.length > 0) {
      const table = log.table({ border: false });
      items.forEach((item, i) => {
        const isLast = i === items.length - 1;
        item.log = item.log || toHistoryItem({ item, isFirst: item.index === 0 });
        const createdAt = time.day(item.createdAt).format('hh:mm:ss');
        const number = item.index + 1;
        const ts = `${number} [${isLast && !isSyncing ? log.white(createdAt) : createdAt}]`;

        let line = item.log;
        if (!isLast) {
          const lines = line.split('\n');
          const suffix = log.gray(`...[${lines.length - 1}]`);
          line = `${lines[0]}`;
          line = lines.length < 2 ? line : `${line} ${suffix}`;
        }

        table.add([log.gray(ts), line]);
      });
      log.info(table.toString());
    }
  };

  dir$.subscribe(async (e) => {
    if (!silent) {
      render(state.isStarted ? log.yellow(`pending`) : `starting`);
    }
  });

  dir$.pipe(debounceTime(debounce)).subscribe(async (e) => {
    syncPush();
  });

  const syncPush = async () => {
    render(state.isStarted ? log.yellow(`syncing`) : `starting`);
    state.isStarted = true;

    const res = await sync({
      silent: true,
      onPayload: (payload) => {
        // Print the file upload size (KB) when it's been calculated.
        const bytes = payload.files
          .filter((payload) => payload.isChanged)
          .reduce((acc, payload) => (payload.localBytes > 0 ? acc + payload.localBytes : acc), 0);
        if (state.isStarted && bytes > 0) {
          const message = `${log.yellow('syncing')} (${fs.size.toString(bytes)})`;
          render(gray(message));
        }
      },
    });
    state.isStarted = true;

    const { errors } = res;

    appendHistory(res);

    if (!silent) {
      render();
      if (errors.length > 0) {
        const errs = errors.map((item) => item.error);
        log.info.yellow(`${log.yellow('•')} ${errs}`);
      }
    }
  };

  // Draw the initial log page if the folder is empty.
  // NB:
  //    If there are items in the folder, then the page will be drawn
  //    via the normal "change" handlers.
  if (initialCount === 0) {
    state.isStarted = true;
    appendHistory(EMPTY_SYNC_RESPONSE);
    render();
  }
}

/**
 * [Helpers]
 */

export function toHistoryItem(args: { item: IHistoryItem; isFirst: boolean }) {
  const { item, isFirst } = args;
  const { results, bytes } = item.response;
  const { uploaded, deleted } = item.response.count;

  let output = '';
  if (uploaded > 0) {
    output = `uploaded (${fs.size.toString(bytes)})`;
    if (results.uploaded.length === 1) {
      output = `${output}: ${results.uploaded[0]}`;
    } else {
      const lines = results.uploaded.map((item) => `  - ${item}`);
      output = `${output}:\n${lines.join('\n')}`;
    }
  }
  if (deleted > 0) {
    output = output ? `${output}\n` : output;
    output = `deleted`;
    if (results.deleted.length === 1) {
      output = `${output}: ${results.deleted[0]}`;
    } else {
      const lines = results.deleted.map((item) => `  - ${item}`);
      output = `${output}:\n${lines.join('\n')}`;
    }
  }
  output = output.trim();

  if (output) {
    let bullet = log.cyan;
    if (uploaded > 0 && deleted > 0) {
      bullet = log.yellow;
    }
    if (uploaded > 0 && deleted === 0) {
      bullet = log.green;
    }
    if (uploaded === 0 && deleted > 0) {
      bullet = log.red;
    }
    output = `${bullet('•')} ${output}`;
  }

  output = output ? output : isFirst ? '• started' : '• synced';
  return log.gray(output);
}
