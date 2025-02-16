import type {Readable as UserLandReadable} from 'readable-stream';
import type {Readable as NodeReadable} from 'node:stream';

export interface ReadableWebToNodeStreamOptions {
  propagateDestroy: boolean;
}

/**
 * A hybrid implementation that converts a Web-API ReadableStream
 * into a Node.js Readable stream.
 *
 * Node.js Readable docs: https://nodejs.org/api/stream.html#stream_readable_streams
 * Web API ReadableStream docs: https://developer.mozilla.org/docs/Web/API/ReadableStream
 */
export class CommonReadableWebToNodeStream {
  /** Total bytes pushed to the Node.js stream. */
  public bytesRead = 0;

  /** Flag indicating that the stream has been released/closed. */
  public released = false;

  /** Holds the currently pending read, if any. */
  private pendingRead: Promise<void> | null = null;

  /** The underlying Web-API stream reader. */
  private reader: ReadableStreamDefaultReader<Uint8Array>;

  /**
   * @param stream The Web-API ReadableStream to be wrapped.
   * @param options Options: `{propagateDestroy: boolean}`
   */
  constructor(stream: ReadableStream<Uint8Array> | ReadableStream, private options: ReadableWebToNodeStreamOptions = {propagateDestroy: false}) {
    this.reader = stream.getReader();
  }

  /**
   * Should be bound to the Node.js Readable._read() method.
   * This method pushes data into the Node stream's internal queue.
   *
   * @param nodeReadable The Node.js stream instance.
   */
  public read(nodeReadable: NodeReadable | UserLandReadable): void {
    if (this.released) {
      nodeReadable.push(null); // Signal EOF
      return;
    }

    // Use an async IIFE to handle asynchronous reading.
    this.pendingRead = (async () => {
      try {
        const result = await this.reader.read();
        this.pendingRead = null;

        if (result.done || this.released) {
          nodeReadable.push(null); // Signal EOF
        } else {
          this.bytesRead += result.value.length;
          nodeReadable.push(result.value); // Push the chunk into the Node.js stream
        }
      } catch (error) {
        nodeReadable.destroy(error as Error);
      }
    })();
  }

  /**
   * Closes the stream and releasing the underlying stream lock.
   * Implementation is Readable._destroy()
   */
  public destroy(error: Error | null, callback: (error?: Error | null) => void) {
    if (this.options.propagateDestroy ?? false) {
      // Propagate cancelling stream to Web API Stream
      this.reader.cancel().then(() => {
        this.release();
        callback();
      }, error => callback(error));
    } else {
      this.release();
      callback(error);
    }
  }

  /**
   * Marks the stream as released, waits for pending operations,
   * and releases the underlying reader lock.
   */
  private release() {
    this.released = true;
    this.reader.releaseLock();
  }
}
