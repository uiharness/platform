import { expect } from 'chai';

import { CommandState } from '.';
import { Command } from '../Command';
import { time } from '../common';
import * as t from '../types';

const copy = Command.create('copy').add('fast').add('slow');

const db = Command.create('db').add('ls').add('status').add(copy);

const root = Command.create('root').add('ls').add('mkdir').add(db);

let beforeInvokeList: t.ICommandStateProps[] = [];
const beforeInvoke: t.BeforeInvokeCommand = async (e) => {
  beforeInvokeList = [...beforeInvokeList, e.state];
  return { props: { foo: 123, ...e.props } };
};

describe('CommandState', () => {
  beforeEach(() => (beforeInvokeList = []));

  it('creates with default values', () => {
    const state = CommandState.create({ root, beforeInvoke });
    expect(state.isDisposed).to.eql(false);
    expect(state.text).to.eql('');
    expect(state.namespace.name).to.eql('root');
    expect(state.namespace.isRoot).to.eql(true);
    expect(state.autoCompleted).to.eql(undefined);
  });

  it('creates with initial text', () => {
    const text = 'db copy fast';
    const state = CommandState.create({ root, text, beforeInvoke });

    expect(state.text).to.eql('fast');
    expect(state.namespace.name).to.eql('copy');
    expect(state.namespace.isRoot).to.eql(false);
  });

  it('disposes', () => {
    let count = 0;
    const state = CommandState.create({ root, beforeInvoke });
    state.dispose$.subscribe(() => count++);

    expect(state.isDisposed).to.eql(false);
    state.dispose();
    expect(state.isDisposed).to.eql(true);
    expect(count).to.eql(1);
  });

  it('toObject', () => {
    const state = CommandState.create({ root, beforeInvoke });
    const obj = state.toObject();
    expect(obj.text).to.eql('');
    expect(obj.command).to.eql(undefined);
    expect(obj.namespace.name).to.eql('root');
    expect(obj.autoCompleted).to.eql(undefined);
  });

  describe('change (events)', () => {
    it('fires [change$] event (observable)', () => {
      const events: t.CommandStateEvent[] = [];
      const changingEvents: t.ICommandStateChanging[] = [];
      const changedEvents: t.ICommandStateChanged[] = [];
      const state = CommandState.create({ root, beforeInvoke });

      state.events$.subscribe((e) => events.push(e));
      state.changing$.subscribe((e) => changingEvents.push(e));
      state.changed$.subscribe((e) => changedEvents.push(e));

      const next = { text: 'foo' };
      state.change(next);

      expect(events.length).to.eql(2);
      expect(changedEvents.length).to.eql(1);

      expect(events[0].type).to.eql('COMMAND_STATE/changing');
      expect(events[1].type).to.eql('COMMAND_STATE/changed');

      const changing = changingEvents[0] as t.ICommandStateChanging;
      expect(changing.isCancelled).to.eql(false);
      expect(changing.args.prev).to.eql(undefined);
      expect(changing.args.next).to.eql(next);

      const changed = changedEvents[0] as t.ICommandStateChanged;
      expect(changed.invoke).to.eql(false);
      expect(changed.isNamespaceChanged).to.eql(false);
      expect(changed.next.text).to.eql('foo');
      expect(changed.next.command).to.eql(undefined);
      expect(changed.next.namespace.name).to.eql('root');
    });

    it('cancels change', () => {
      const events: t.CommandStateEvent[] = [];
      const state = CommandState.create({ root, beforeInvoke });

      state.events$.subscribe((e) => events.push(e));
      state.changing$.subscribe((e) => e.cancel());

      state.change({ text: 'foo' });

      expect(events.length).to.eql(1);
      expect(events[0].type).to.eql('COMMAND_STATE/changing');
    });

    it('autoCompletes', () => {
      const events: t.CommandStateEvent[] = [];
      const changes: t.ICommandStateChangedEvent['payload'][] = [];
      const state = CommandState.create({ root, beforeInvoke });

      state.events$.subscribe((e) => events.push(e));
      state.changed$.subscribe((e) => changes.push(e));

      const autoCompleted: t.ICommandAutoCompleted = {
        index: 0,
        text: { from: 'l', to: 'list' },
        matches: [Command.create('list')],
      };

      state.change({ text: 'foo', autoCompleted });

      expect(state.autoCompleted).to.eql(autoCompleted);
      expect(state.toObject().autoCompleted).to.eql(autoCompleted);

      expect(events.length).to.eql(3);
      expect(changes.length).to.eql(1);

      expect(events[1].type).to.eql('COMMAND_STATE/autoCompleted');
      expect(events[1].payload).to.eql(autoCompleted);
      expect(events[2].type).to.equal('COMMAND_STATE/changed');
      expect(changes[0].next.autoCompleted).to.eql(autoCompleted);

      // Reset auto-complete.
      state.change({ text: 'foobar' });
      expect(state.autoCompleted).to.eql(undefined);
      expect(state.toObject().autoCompleted).to.eql(undefined);
    });

    it('updates current text on change event', () => {
      const state = CommandState.create({ root, beforeInvoke });
      expect(state.text).to.eql('');
      state.change({ text: 'hello' });
      expect(state.text).to.eql('hello');
    });

    it('fires [invoke$] event (observable)', () => {
      const events: t.CommandStateEvent[] = [];
      const invokes: t.ICommandStateChangedEvent['payload'][] = [];
      const state = CommandState.create({ root, beforeInvoke });

      state.events$.subscribe((e) => events.push(e));
      state.invoke$.subscribe((e) => invokes.push(e));

      state.change({ text: 'foo' }); // NB: invoked [false].
      expect(events.length).to.eql(2);
      expect(invokes.length).to.eql(0);

      state.change({ text: 'bar' }); // NB: invoked: true, but no matching command.
      expect(events.length).to.eql(4);
      expect(invokes.length).to.eql(0);

      state.change({ text: 'ls', invoke: true });
      expect(events.length).to.eql(6);
      expect(invokes.length).to.eql(1);
      expect(invokes[0].next.text).to.eql('ls');
      expect(invokes[0].invoke).to.eql(true);

      state.change({ text: 'ls', invoke: true }); // NB: Invoke again.
      expect(events.length).to.eql(8);
      expect(invokes.length).to.eql(2);
    });
  });

  describe('change: namespace', () => {
    it('does not change to namespace if [namespace] flag not set', () => {
      const state = CommandState.create({ root, beforeInvoke });
      const test = (text: string) => {
        state.change({ text });
        expect(state.namespace.name).to.eql('root');
      };
      test('');
      test('db.copy');
      test('db.copy.fast');
      test('db copy');
      test('db copy fast');
    });

    it('cannot change to a namsespace if no command matches', () => {
      const state = CommandState.create({ root, beforeInvoke });
      state.change({ text: 'NO_EXIST', namespace: true });
      expect(state.namespace.name).to.eql('root');
    });

    it('changes to root leaf node', () => {
      const state = CommandState.create({ root, beforeInvoke });
      state.change({ text: 'ls', namespace: true });
      expect(state.namespace.name).to.eql('root');
    });

    it('changes to child namespace ("db")', () => {
      const state = CommandState.create({ root, beforeInvoke });
      expect(state.namespace.name).to.eql('root');
      expect(state.namespace.isRoot).to.eql(true);

      state.change({ text: 'db' });
      expect(state.text).to.eql('db');
      expect(state.namespace.name).to.eql('root');

      state.change({ text: 'db', namespace: true });

      const ns = state.namespace;
      expect(ns.name).to.eql('db');
      expect(ns.command.name).to.eql('db');
      expect(ns.isRoot).to.eql(false);

      const path = ns.path.map((m) => m.name) || [];
      expect(path.join('.')).to.eql('db');
      expect(state.text).to.eql(''); // NB: Text is reset when changing to namespace.
    });

    it('changes to deep namespace ("db copy")', () => {
      const state = CommandState.create({ root, beforeInvoke });

      state.change({ text: 'db copy', namespace: true });
      const ns = state.namespace;

      expect(state.command && state.command.name).to.eql(undefined);
      expect(ns.name).to.eql('copy');
      expect(ns.command.name).to.eql('copy');

      const path = ns.path.map((m) => m.name) || [];
      expect(path).to.eql(['db', 'copy']);
      expect(state.text).to.eql(''); // NB: Text is reset when changing to namespace.
    });

    it('changes to deep namespace - parent of leaf ("db copy fast")', () => {
      const state = CommandState.create({ root, beforeInvoke });

      state.change({ text: 'db copy fast', namespace: true });
      const ns = state.namespace;

      expect(state.command && state.command.name).to.eql('fast');
      expect(ns.command.name).to.eql('copy');

      const path = ns.path.map((m) => m.name) || [];
      expect(path).to.eql(['db', 'copy']); // Lowest level namespace.
      expect(state.text).to.eql('fast'); // NB: Text is reset when changing to namespace.
    });

    it('changes from one namespace to a deeper namespace', () => {
      const state = CommandState.create({ root, beforeInvoke });

      state.change({ text: 'db', namespace: true });
      expect(state.namespace.name).to.eql('db');
      expect(state.text).to.eql(''); // NB: Text is reset when changing to namespace.

      state.change({ text: 'copy', namespace: true });
      expect(state.namespace.name).to.eql('copy');
      expect(state.text).to.eql(''); // NB: Text is reset when changing to namespace.
    });

    it('changes to deep namespace and retains args', () => {
      const state = CommandState.create({ root, beforeInvoke });

      state.change({ text: 'db copy fast foo --force', namespace: true });
      const ns = state.namespace;

      expect(state.command && state.command.name).to.eql('fast');
      expect(ns.command.name).to.eql('copy');

      const path = ns.path.map((m) => m.name) || [];
      expect(path).to.eql(['db', 'copy']); // Lowest level namespace.
      expect(state.text).to.eql('fast foo --force');
      expect(state.args).to.eql({ params: ['foo'], options: { force: true } });
    });

    it('removes namespace', () => {
      const state = CommandState.create({ root, beforeInvoke }).change({
        text: 'db',
        namespace: true,
      });
      expect(state.namespace.name).to.eql('db');

      state.change({ text: 'db', namespace: false });
      expect(state.namespace.name).to.eql('root');
    });

    it('clears namespace/command', () => {
      const state = CommandState.create({ root, beforeInvoke });

      state.change({ text: 'db copy fast', namespace: true });
      expect(state.text).to.eql('fast');
      expect(state.namespace.name).to.eql('copy');
      expect(state.command && state.command.name).to.eql('fast');

      state.clear();

      expect(state.namespace.name).to.eql('root');
      expect(state.command).to.eql(undefined);
    });

    it('steps up to parent namespace', () => {
      const changed: t.ICommandStateChanged[] = [];
      const state = CommandState.create({ root, beforeInvoke });
      state.changed$.subscribe((e) => changed.push(e));

      state.change({ text: 'db copy fast', namespace: true });
      expect(state.namespace.name).to.eql('copy');

      state.change({ namespace: 'PARENT' });

      expect(state.namespace.name).to.eql('db');
      expect(state.command).to.eql(undefined);
      expect(state.text).to.eql('');

      expect(changed[0].isNamespaceChanged).to.eql(true);
      expect(changed[0].next.namespace.name).to.eql('copy');

      expect(changed[1].isNamespaceChanged).to.eql(true);
      expect(changed[1].next.namespace.name).to.eql('db');
    });

    it('namespace.toString()', () => {
      const state = CommandState.create({ root, beforeInvoke });
      state.change({ text: 'db copy fast', namespace: true });
      const ns = state.namespace;
      expect(ns.toString()).to.eql('db.copy');
      expect(ns.toString({ delimiter: '/' })).to.eql('db/copy');
    });
  });

  describe('toString', () => {
    it('no namespace', () => {
      const state = CommandState.create({ root, beforeInvoke });
      expect(state.text).to.eql('');
      expect(state.toString()).to.eql('');

      state.change({ text: 'foo' });
      expect(state.toString()).to.eql('foo');

      state.change({ text: 'foo bar' });
      expect(state.toString()).to.eql('foo bar');
    });

    it('namespace', () => {
      const state = CommandState.create({ root, beforeInvoke });
      expect(state.toString()).to.eql('');

      state.change({ text: 'db copy fast', namespace: true });
      expect(state.toString()).to.eql('db copy fast');
    });
  });

  describe('current [command] property', () => {
    it('match', () => {
      const state = CommandState.create({ root, beforeInvoke });
      expect(state.command).to.eql(undefined);

      state.change({ text: 'ls' });
      const cmd = state.command;
      expect(cmd && cmd.name).to.eql('ls');
      expect(state.args.params).to.eql([]);
    });

    it('match: removes command value from arg params', () => {
      const root = Command.create('root').add('create');
      const state = CommandState.create({ root, beforeInvoke });
      state.change({ text: 'create foo bar' });
      expect(state.command && state.command.name).to.eql('create');
      expect(state.args.params).to.eql(['foo', 'bar']); // NB: `create` excluded.
    });

    it('no match', () => {
      const state = CommandState.create({ root, beforeInvoke });
      expect(state.command).to.eql(undefined);
      state.change({ text: 'YO_MAMA' });
      expect(state.command).to.eql(undefined);
    });

    it('no match (no commands)', () => {
      const root = Command.create('empty');
      const state = CommandState.create({ root, beforeInvoke });
      expect(state.command).to.eql(undefined);
      state.change({ text: 'ls' });
      expect(state.command).to.eql(undefined);
    });

    it('match from path ("db copy fast")', () => {
      const test = (text: string, expectName: string) => {
        const state = CommandState.create({ root, beforeInvoke });
        expect(state.command).to.eql(undefined);
        state.change({ text });
        expect(state.text).to.eql(text);
        expect(state.command && state.command.name).to.eql(expectName);
      };
      test('db copy fast', 'fast');
      test('db copy fast foo', 'fast');
      test('db copy fast foo bar baz', 'fast');
    });
  });

  describe('invoke', () => {
    it('does not invoke when no command', async () => {
      const root = Command.create('root').add('run');
      const state = CommandState.create({ root, beforeInvoke });
      state.change({ text: 'NO_EXIST' });
      const res = await state.invoke();
      expect(res.isInvoked).to.eql(false);
      expect(res.state.command).to.eql(undefined);
      expect(res.props).to.eql({});
    });

    it('invokes the current command (with props from factory)', async () => {
      const list: t.ICommandHandlerArgs[] = [];
      const root = Command.create('root').add('run', async (args) => {
        await time.wait(10);
        list.push(args);
        return 1234;
      });
      const state = CommandState.create({ root, beforeInvoke });
      state.change({ text: 'run foo --force' });

      const res = await state.invoke();

      expect(res.isInvoked).to.eql(true);
      expect(res.state.command && res.state.command.name).to.eql('run');

      expect(list.length).to.eql(1);
      expect(list[0].args).to.eql({ params: ['foo'], options: { force: true } });

      const response = res.response;
      expect(response && response.result).to.eql(1234); // Returned from the handler.
      expect(res.props.foo).to.eql(123); // From the `beforeInvoke` property generator.
    });

    it('invokes the root namespace handler', async () => {
      const count = { root: 0, run: 0 };
      const root = Command.create('root', () => count.root++).add('run', () => count.run++);
      const state = CommandState.create({ root, beforeInvoke });

      state.change({ text: 'FOO' });
      expect(state.text).to.eql('FOO');
      expect(state.command).to.eql(undefined);
      await state.invoke();
      expect(count.root).to.eql(0); // No matching command, but text content prevents NS from being invoked.

      state.change({ text: '' });
      expect(state.text).to.eql('');
      expect(state.command).to.eql(undefined);
      await state.invoke();

      expect(count.root).to.eql(1);

      state.change({ text: '   ' }); // Empty text trimmed - and therefore NS handler invoked.
      await state.invoke();
      expect(count.root).to.eql(2);
    });

    it('invokes the root namespace handler', async () => {
      const count = { root: 0, ns: 0, run: 0 };
      const ns = Command.create('ns', () => count.ns++).add('run', () => count.run++);
      const root = Command.create('root', () => count.root++).add(ns);
      const state = CommandState.create({ root, beforeInvoke });

      await state.invoke();
      expect(count.root).to.eql(1);

      state.change({ text: 'ns', namespace: true });
      await state.invoke();
      expect(count.root).to.eql(1);
      expect(count.ns).to.eql(1);

      state.change({ text: 'run' });
      await state.invoke();
      expect(count.root).to.eql(1);
      expect(count.ns).to.eql(1);
      expect(count.run).to.eql(1);
    });

    it('passes command/namespace to invoke args', async () => {
      const result = {
        ns: undefined as t.ICommandHandlerArgs | undefined,
        run: undefined as t.ICommandHandlerArgs | undefined,
      };

      const ns = Command.create('ns', (e) => (result.ns = e)).add('run', (e) => (result.run = e));
      const root = Command.create('root').add(ns);
      const state = CommandState.create({ root, beforeInvoke });

      state.change({ text: 'ns' });
      await state.invoke();

      expect(result.ns && result.ns.command.name).to.eql('ns');
      expect(result.ns && result.ns.namespace && result.ns.namespace.name).to.eql('ns');

      state.change({ text: 'ns', namespace: true }).change({ text: 'run' });
      await state.invoke();

      expect(result.run && result.run.command.name).to.eql('run');
      expect(result.run && result.run.namespace && result.run.namespace.name).to.eql('ns');
    });

    it('[e.param] method', async () => {
      const events: t.ICommandHandlerArgs[] = [];
      const ns = Command.create('ns').add('run', (e) => events.push(e));
      const root = Command.create('root').add(ns);
      const state = CommandState.create({ root, beforeInvoke });

      state.change({ text: 'ns', namespace: true });
      state.change({ text: 'run' });
      await state.invoke();

      // No value.
      const p1 = events[0].param(0);
      expect(p1).to.eql(undefined);

      // Default value.
      const p2 = events[0].param<string>(0, 'hello');
      expect(p2).to.eql('hello');

      // Parameter value.
      state.change({ text: 'run fast' });
      await state.invoke();
      const p3 = events[1].param<string>(0, 'hello');
      expect(p3).to.eql('fast');

      const p4 = events[1].param<boolean>(1, true);
      expect(p4).to.eql(true);

      const p5 = events[1].param<boolean>(2);
      expect(p5).to.eql(undefined);
    });

    it('[e.option] method', async () => {
      const events: t.ICommandHandlerArgs[] = [];
      const ns = Command.create('ns').add('run', (e) => events.push(e));
      const root = Command.create('root').add(ns);
      const state = CommandState.create({ root, beforeInvoke });

      state.change({ text: 'ns', namespace: true });
      state.change({ text: 'run' });
      await state.invoke();

      // No value.
      const option1 = events[0].option('force');
      expect(option1).to.eql(undefined);

      // Default value.
      const option2 = events[0].option<string>('force', 'hello');
      expect(option2).to.eql('hello');

      // Option (true).
      state.change({ text: 'run --force' });
      await state.invoke();
      const option3a = events[1].option<boolean>('force', false);
      const option3b = events[1].option<number>('port', 1234);
      expect(option3a).to.eql(true);
      expect(option3b).to.eql(1234);

      // Option (string/boolean).
      state.change({ text: 'run --force=false --label harry -p 8080' });
      await state.invoke();
      const option4a = events[2].option<boolean>('force', true);
      const option4b = events[2].option<boolean>('label');
      const option4c = events[2].option<number>('p');
      expect(option4a).to.eql(false);
      expect(option4b).to.eql('harry');
      expect(option4c).to.eql(8080);

      // Option (full and abbreviated key).
      state.change({ text: 'run -p 8080' });
      await state.invoke();
      const option5 = events[3].option<number>(['port', 'p'], 1234);
      expect(option5).to.eql(8080);

      state.change({ text: 'run --port 8080' });
      await state.invoke();
      const option6 = events[4].option<number>(['p', 'port'], 1234);
      expect(option6).to.eql(8080);

      // Option: negative number.
      state.change({ text: 'run --color=-1.23' });
      await state.invoke();
      const option7 = events[5].option<number>('color');
      expect(option7).to.eql(-1.23);

      // Option: trims "-" prefix.
      state.change({ text: 'run --color=red -f' });
      await state.invoke();
      const option8a = events[6].option<number>('--color');
      const option8b = events[6].option<number>(['--force', '-f']);
      expect(option8a).to.eql('red');
      expect(option8b).to.eql(true);
    });

    it('invokes with props/args from parameter', async () => {
      const list: t.ICommandHandlerArgs[] = [];
      const root = Command.create('root').add('run', (e) => list.push(e));
      const state = CommandState.create({ root, beforeInvoke }).change({ text: 'run' });

      await state.invoke({ props: { msg: 'hello' }, timeout: 1234, args: '--force' });

      expect(list.length).to.eql(1);
      const item = list[0];
      expect(item.args).to.eql({ params: [], options: { force: true } });
      expect(item.props).to.eql({ msg: 'hello', foo: 123 }); // NB: The {foo:123} injected from the `beforeInvoke` handler.
    });

    it('overwrites [beforeInvoke] props with passed parameter props', async () => {
      const list: t.ICommandHandlerArgs[] = [];
      const root = Command.create('root').add('run', (e) => list.push(e));
      const state = CommandState.create({ root, beforeInvoke }).change({ text: 'run' });

      const res1 = await state.invoke();
      expect(res1.props).to.eql({ foo: 123 });

      const res2 = await state.invoke({ props: { foo: 'hello' } });
      expect(res2.props).to.eql({ foo: 'hello' });
    });

    it('fires `invoking` | `invoked` events', async () => {
      const events: t.CommandStateEvent[] = [];
      const root = Command.create('root').add('run');
      const state = CommandState.create({ root, beforeInvoke });
      state.change({ text: 'run' });

      state.events$.subscribe((e) => events.push(e));
      const res = await state.invoke({ stepIntoNamespace: false });

      expect(events.length).to.eql(2);
      expect(res.isCancelled).to.eql(false);

      expect(events[0].type).to.eql('COMMAND_STATE/invoking');
      expect(events[1].type).to.eql('COMMAND_STATE/invoked');
      expect(events[1].payload).to.eql(res);
    });

    it('cancels invoke operation from BEFORE event', async () => {
      const events: t.CommandStateEvent[] = [];
      let count = 0;
      const root = Command.create('root').add('run', (e) => count++);
      const state = CommandState.create({ root, beforeInvoke });
      state.change({ text: 'run' });

      state.events$.subscribe((e) => events.push(e));
      state.invoking$.subscribe((e) => e.cancel());
      const res = await state.invoke();

      expect(count).to.eql(0);
      expect(res.isCancelled).to.eql(true);
      expect(events.length).to.eql(1);
      expect(events[0].type).to.eql('COMMAND_STATE/invoking');

      const e = events[0].payload as t.ICommandStateInvokingEvent['payload'];
      expect(e.isCancelled).to.eql(true);
    });

    it('does not step into namespace', async () => {
      const root = Command.create('root').add('run');
      const state = CommandState.create({ root, beforeInvoke });

      state.change({ text: 'run' });
      expect(state.namespace.name).to.eql('root');

      const res = await state.invoke({ stepIntoNamespace: true }); // NB: default:true
      expect(state.namespace.name).to.eql('root');
      expect(res.isNamespaceChanged).to.eql(false);
    });

    it('steps into a namespace upon invoking (directly)', async () => {
      const ns = Command.create('ns').add('list').add('run');
      const root = Command.create('root').add(ns);
      const state = CommandState.create({ root, beforeInvoke });
      expect(state.namespace.name).to.eql('root');

      state.change({ text: 'ns' });
      expect(state.namespace.name).to.eql('root');

      const res = await state.invoke({ stepIntoNamespace: true }); // NB: default:true

      expect(res.isNamespaceChanged).to.eql(true);
      expect(res.state.namespace.name).to.eql('ns');
      expect(state.namespace.command.name).to.eql('ns');
    });

    it('steps into a namespace upon invoking (indirectly)', async () => {
      const ns = Command.create('ns').add('list').add('run');
      const root = Command.create('root').add(ns);
      const state = CommandState.create({ root, beforeInvoke });
      expect(state.namespace.name).to.eql('root');

      state.change({ text: 'ns run foo --force' });
      expect(state.namespace.name).to.eql('root');

      const res = await state.invoke();

      expect(res.isNamespaceChanged).to.eql(true);
      expect(state.namespace.command.name).to.eql('ns');

      const args = { params: ['foo'], options: { force: true } };
      expect(res.args).to.eql(args);
      expect(state.args).to.eql(args);
      expect(state.text).to.eql('run foo --force');
    });

    it('invokes command on the namespace that was stepped into', async () => {
      let count = 0;
      const ns = Command.create('ns', () => count++)
        .add('list')
        .add('run');

      const root = Command.create('root').add(ns);
      const state = CommandState.create({ root, beforeInvoke });

      state.change({ text: 'ns' });
      expect(state.namespace.name).to.eql('root');

      expect(state.command && state.command.name).to.eql('ns');
      const res = await state.invoke();

      expect(res.isNamespaceChanged).to.eql(true);
      expect(state.namespace.name).to.eql('ns');
      expect(count).to.eql(1);
    });

    it('invokes command on the namespace that was stepped into AND the target command', async () => {
      const count = { ns: 0, run: 0 };
      const ns = Command.create('ns', () => count.ns++)
        .add('list')
        .add('run', () => count.run++);

      const root = Command.create('root').add(ns);
      const state = CommandState.create({ root, beforeInvoke });

      state.change({ text: 'ns run' });
      expect(state.namespace.name).to.eql('root');
      expect(state.command && state.command.name).to.eql('run');

      const res = await state.invoke();

      expect(res.isNamespaceChanged).to.eql(true);
      expect(state.namespace.name).to.eql('ns');
      expect(count.ns).to.eql(1);
      expect(count.run).to.eql(1);
    });

    it('invokes command directly within namespace', async () => {
      const count = { ns: 0, run: 0 };
      const ns = Command.create('ns', (e) => count.ns++).add('run', () => count.run++);
      const root = Command.create('root').add(ns);
      const state = CommandState.create({ root, beforeInvoke });
      expect(state.namespace.name).to.eql('root');

      state.change({ text: 'ns', namespace: true });
      expect(state.namespace.name).to.eql('ns');

      const args = { params: ['foo'], options: { force: true } };
      state.change({ text: 'run foo --force' });
      expect(state.text).to.eql('run foo --force');
      expect(state.args).to.eql(args);

      const res = await state.invoke();
      expect(count.ns).to.eql(0);
      expect(count.run).to.eql(1);

      expect(res.isNamespaceChanged).to.eql(false);
      expect(state.namespace.command.name).to.eql('ns');

      expect(res.args).to.eql(args);
      expect(state.args).to.eql(args);
      expect(state.text).to.eql('run foo --force');
    });

    it('stores command changes from the [set] method of the [invoke] args on the namespace', async () => {
      const root = Command.create('root').add('one', (e) => {
        e.set('foo', 'hello');
        e.set('bar', 456);
      });
      const state = CommandState.create({ root, beforeInvoke });

      state.change({ text: 'root', namespace: true }).change({ text: 'one' });
      const res = await state.invoke();

      // Changed props on response object.
      expect(res.props.foo).to.eql('hello');
      expect(res.props.bar).to.eql(456);
    });

    it('passes prior updated prop state to the [invoke] args', async () => {
      const root = Command.create('root')
        .add('increment', (e) => {
          const count = e.get('count', 0);
          e.set('count', count + 1);
        })
        .add('decrement', (e) => {
          const count = e.get('count', 0);
          e.set('count', count - 1);
        });
      const state = CommandState.create({ root, beforeInvoke }).change({ text: 'increment' });

      // Initial `count` value incremented on the command's property state.
      const res1 = await state.invoke();
      expect(res1.props.count).to.eql(1);

      // Second call to an invoke increments from the prior stored state.
      const res2 = await state.invoke();
      expect(res2.props.count).to.eql(2);
      expect(res1.props).to.not.equal(res2.props); // Not the same instance.

      // Third call to a different child command (props shared within namespace).
      state.change({ text: 'decrement' });
      const res3 = await state.invoke();
      expect(res3.props.count).to.eql(1);
    });

    it('resets mutated prop state', async () => {
      const ns = Command.create('ns', (e) => {
        e.set('foo', 999);
      });
      ns.add('run', (e) => {
        e.set('foo', e.get('foo', 0) + 1);
      });
      const root = Command.create('root').add(ns);
      const state = CommandState.create({ root, beforeInvoke });

      state.change({ text: 'ns' });
      const res1 = await state.invoke();
      expect(res1.props).to.eql({ foo: 999 });
      expect(state.namespace.name).to.eql('ns');

      state.change({ text: 'run' });
      const res2 = await state.invoke();
      expect(res2.props).to.eql({ foo: 1000 });
      expect(state.namespace.name).to.eql('ns');

      state.reset();

      const res3 = await state.invoke();
      expect(res3.props).to.eql({ foo: 124 }); // NB: Incremented from default value.
    });
  });

  describe('fuzzyMatches', () => {
    it('matches on current text', () => {
      const ns = Command.create('ns').add('list').add('run').add('play');
      const root = Command.create('root').add(ns);
      const state = CommandState.create({ root, beforeInvoke });

      expect(state.fuzzy.matches.length).to.eql(1);
      expect(state.fuzzy.matches[0].command.name).to.eql('ns');
      expect(state.fuzzy.matches[0].isMatch).to.eql(true); // No text === match

      state.change({ text: 's' }); // matches on "s" - "n[s]"

      expect(state.fuzzy.matches.length).to.eql(1);
      expect(state.fuzzy.matches[0].command.name).to.eql('ns');
      expect(state.fuzzy.matches[0].isMatch).to.eql(true);

      state.change({ text: 'z' }); // no match
      expect(state.fuzzy.matches.length).to.eql(1);
      expect(state.fuzzy.matches[0].command.name).to.eql('ns');
      expect(state.fuzzy.matches[0].isMatch).to.eql(false);
    });

    it('matches within namespace', () => {
      const ns = Command.create('ns').add('list').add('run').add('play');
      const root = Command.create('root').add(ns);
      const state = CommandState.create({ root, beforeInvoke });

      state.change({ text: 'ns', namespace: true });
      expect(state.namespace.name).to.eql('ns');

      const test = (index: number, name: string, isMatch: boolean) => {
        const matches = state.fuzzy.matches;
        expect(matches[index].command.name).to.eql(name);
        expect(matches[index].isMatch).to.eql(isMatch);
      };

      // Matches everything when no text.
      test(0, 'list', true);
      test(1, 'run', true);
      test(2, 'play', true);

      // Still no text (trimmed).
      state.change({ text: '  ' });
      test(0, 'list', true);
      test(1, 'run', true);
      test(2, 'play', true);

      // Partial matches.
      state.change({ text: 'l' });
      test(0, 'list', true); // "[l]ist"
      test(1, 'run', false);
      test(2, 'play', true); // "p[l]ay"

      // No matches.
      state.change({ text: 'foo' });
      test(0, 'list', false);
      test(1, 'run', false);
      test(2, 'play', false);
    });
  });
});
