import { Readable } from 'readable-stream';

/**
 * Converts a Web-API stream into Node stream.Readable class
 * Node stream readable: https://nodejs.org/api/stream.html#stream_readable_streams
 * Web API readable-stream: https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream
 * Node readable stream: https://nodejs.org/api/stream.html#stream_readable_streams
 */
export class ReadableWebToNodeStream extends Readable {

  public bytesRead = 0;
  public released = false;

  /**
   * Default web API stream reader
   * https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultReader
   */
  private reader: ReadableStreamDefaultReader<Uint8Array>;
  private pendingRead: Promise<{ done: boolean; value?: Uint8Array }> | undefined;

  /**
   *
   * @param stream ReadableStream: https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream
   */
  constructor(stream: ReadableStream | ReadableStream<Uint8Array>) {
    super();
    this.reader = stream.getReader();
  }

  /**
   * Implementation of readable._read(size).
   * When readable._read() is called, if data is available from the resource,
   * the implementation should begin pushing that data into the read queue
   * https://nodejs.org/api/stream.html#stream_readable_read_size_1
   */
  public async _read(): Promise<void> {
    // Should start pushing data into the queue
    // Read data from the underlying Web-API-readable-stream
    if (this.released) {
      this.push(null); // Signal EOF
      return;
    }
    this.pendingRead = this.reader.read();
    const data = await this.pendingRead;
    // clear the promise before pushing new data to the queue and allow sequential calls to _read()
    this.pendingRead = undefined;
    if (data.done || this.released) {
      this.push(null); // Signal EOF
    } else if (data.value) {
      this.bytesRead += data.value.length;
      this.push(data.value); // Push new data to the queue
    }
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
