import { Readable } from 'readable-stream'; // Userland Readable
import { CommonReadableWebToNodeStream } from './common.js';

/**
 * Converts a Web-API stream into Node stream.Readable class
 * Node stream readable: https://nodejs.org/api/stream.html#stream_readable_streams
 * Web API readable-stream: https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream
 * Node readable stream: https://nodejs.org/api/stream.html#stream_readable_streams
 */
export class ReadableWebToNodeStream extends Readable {

  private converter: CommonReadableWebToNodeStream;

  /**
   *
   * @param stream ReadableStream: https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream
   */
  constructor(stream: ReadableStream | ReadableStream<Uint8Array>) {
    super();
    this.converter = new CommonReadableWebToNodeStream(stream);
  }

  /**
   * Implementation of readable._read(size).
   * When readable._read() is called, if data is available from the resource,
   * the implementation should begin pushing that data into the read queue
   * https://nodejs.org/api/stream.html#stream_readable_read_size_1
   */
  public _read(): void {
    this.converter.read(this);
  }

  /**
   * Close wrapper
   */
  public async close(): Promise<void> {
    await this.converter.close();
  }
}
