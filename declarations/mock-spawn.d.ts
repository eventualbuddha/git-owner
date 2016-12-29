declare module 'mock-spawn' {
  import { ChildProcess, SpawnOptions } from 'child_process';
  import { EventEmitter } from 'events';
  import WritableStream = NodeJS.WritableStream;
  import ReadableStream = NodeJS.ReadableStream;

  type Signals = { [name: string]: boolean };

  class MockProcess extends EventEmitter {
    stdin: WritableStream;
    stdout: ReadableStream;
    stderr: ReadableStream;
    command: string;
    args: Array<string>;
    opts?: SpawnOptions;
    pid: number;
    ended: boolean;
    exitCode?: number;

    constructor(runner: Runner, signals?: Signals);
    kill(signal?: string);
  }

  class ProcessList {
    verbose: boolean;
    defaultFn: Runner;
    strategy: Strategy | null;
    calls: Array<MockProcess>;
    sequence: SequenceStrategy;

    setStrategy(strategy: Strategy);
    setSignals(signals: Signals);
    next(command: string, args: Array<string>, opts?: SpawnOptions): MockProcess;
  }

  interface Runner {
    (this: MockProcess, callback: (exitCode: number, signal?: string) => void): void;
    throws?: Error;
  }

  interface Strategy {
    (command: string, args?: Array<string>, options?: SpawnOptions): Runner;
  }

  interface SequenceStrategy extends Strategy {
    (command: string, args?: Array<string>, options?: SpawnOptions): Runner;
    add(runner: Runner);
  }

  interface Instance {
    (command: string, args?: Array<string>, options?: SpawnOptions): ChildProcess;
    sequence: SequenceStrategy;
    calls: Array<MockProcess>;
    setDefault(fn: Runner);
    setStrategy(strategy: Strategy);
    simple(exitCode: number, stdout?: string, stderr?: string): Runner;
    setSignals(signals: Signals);
  }

  function mockSpawn(verbose?: boolean): Instance;

  export = mockSpawn;
}
