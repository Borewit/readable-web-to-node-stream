import type {Readable} from 'node:stream';

export class MockedReadableStream {
  public pullRequest = false;
  public cancelled = false;
  public controller?: ReadableStreamDefaultController<Uint8Array>;
  public stream: ReadableStream<Uint8Array>;

  constructor() {
    this.stream = new ReadableStream<Uint8Array>({
      start: (controller) => {
        this.controller = controller;
      },
      pull: (controller) => {
        this.controller = controller;
        this.pullRequest = true;
      },
      cancel: (reason: any) => {
        this.cancelled = true;
      },
    });
  }
}

export class Deferred<T> {
  public promise: Promise<T>;
  public resolve!: (value: T | PromiseLike<T>) => void;
  public reject!: (reason?: any) => void;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

export class NodeReadableListener {

  public chunks: Uint8Array[] = [];
  public errors: Error[] = [];
  public ended = 0;
  public closed = 0;

  private waitUntilClosedDeferred = new Deferred<void>();

  public constructor(nodeReadable: Readable) {
    nodeReadable.on('data', chunk => {
      this.chunks.push(chunk);
    });
    nodeReadable.on('error', error => {
      this.errors.push(error);
      this.waitUntilClosedDeferred.reject(error);
    });
    nodeReadable.on('end', () => {
      ++this.ended;
    });
    nodeReadable.on('close', () => {
      ++this.closed;
      this.waitUntilClosedDeferred.resolve();
    });
  }

  public waitUntilClosed(): Promise<void> {
    return this.waitUntilClosedDeferred.promise;
  }

}
