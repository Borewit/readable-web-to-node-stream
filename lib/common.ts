import type { Readable as UserLandReadable } from 'readable-stream';
import type { Readable as NodeReadable } from 'node:stream';

/**
 * Hybrid implementation for Node.js / Web for conversion of a Web-API stream into a Node.js stream.Readable class
 * Node stream readable: https://nodejs.org/api/stream.html#stream_readable_streams
 * Web API readable-stream: https://developer.mozilla.org/docs/Web/API/ReadableStream
 */
export class CommonReadableWebToNodeStream {

  public bytesRead = 0;
  public released = false;

  private pendingRead: Promise<void> | undefined;

  /**
   * Default web API stream reader
   * https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultReader
   */
  private reader: ReadableStreamDefaultReader<Uint8Array>;

  /**
   * @param stream ReadableStream: https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream
   */
  constructor(stream: ReadableStream | ReadableStream<Uint8Array>) {
    this.reader = stream.getReader();
  }

  /**
   * Implementation of readable._read(size).
   * When readable._read() is called, if data is available from the resource,
   * the implementation should begin pushing that data into the read queue
   * https://nodejs.org/api/stream.html#stream_readable_read_size_1
   */
  public read(nodeReadable: NodeReadable | UserLandReadable): void {
    // Should start pushing data into the queue
    // Read data from the underlying Web-API-readable-stream
    if (this.released) {
      nodeReadable.push(null); // Signal EOF
      return;
    }
    this.pendingRead = this.reader
      .read()
      .then((data) => {
        this.pendingRead = undefined;
        if (data.done || this.released) {
          nodeReadable.push(null); // Signal EOF
        } else {
          this.bytesRead += data.value.length;
          nodeReadable.push(data.value); // Push new data to the queue
        }
      })
      .catch((err) => {
        nodeReadable.destroy(err);
      });
  }

  /**
   * If there is no unresolved read call to Web-API Readable​Stream immediately returns;
   * otherwise will wait until the read is resolved.
   */
  public async waitForReadToComplete() {
    if (this.pendingRead) {
      await this.pendingRead;
    }
  }

  /**
   * Close wrapper
   */
  public async close(): Promise<void> {
    await this.syncAndRelease();
  }

  private async syncAndRelease() {
    this.released = true;
    await this.waitForReadToComplete();
    await this.reader.releaseLock();
  }
}
