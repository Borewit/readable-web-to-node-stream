import {assert} from 'chai';
import {ReadableWebToNodeStream as NodeReadableWebToNodeStream, type ReadableWebToNodeStreamOptions} from '../lib/node.js';
import {ReadableWebToNodeStream as DefaultReadableWebToNodeStream} from '../lib/default.js';
import {fileTypeFromStream} from 'file-type';
import {parseStream} from 'music-metadata';
import {MockedReadableStream, NodeReadableListener} from "./util.js";
import type {Readable} from "node:stream";

const jpegDataBase64 = '/9j/4AAQSkZJRgABAQEAAAAAAAD/2wCEAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE';

async function httpGetByUrl(url: string): Promise<Response> {
  const response = await fetch(url);
  const headers = [];
  response.headers.forEach(header => {
    headers.push(header);
  });
  assert.isTrue(response.ok, `HTTP error status=${response.status}: ${response.statusText}`);
  assert.isDefined(response.body, 'HTTP-stream');
  return response;
}

type makeReadableWebToNodeStream = (stream: ReadableStream | ReadableStream<Uint8Array>, options?: ReadableWebToNodeStreamOptions) => Readable;

const entryPoints: { label: string, makeNodeStream: makeReadableWebToNodeStream } [] = [{
  label: 'Node.js',
  makeNodeStream: (stream, options) => new NodeReadableWebToNodeStream(stream, options)
}, {
  label: 'default (userland Readable)',
  makeNodeStream: (stream, options) => new DefaultReadableWebToNodeStream(stream, options)
}
];

entryPoints.forEach(entryPoint => {
  describe(`ReadableWebToNodeStream ${entryPoint.label}`, () => {

    it('Detect file-type via conversion', async () => {
      const jpegBlob = new Blob([Buffer.from(jpegDataBase64, 'base64')], {type: 'image/jpeg'});
      const webReadableStream = jpegBlob.stream();
      try {
        const nodeReadable = entryPoint.makeNodeStream(webReadableStream);
        try {
          const fileType = await fileTypeFromStream(nodeReadable);
          assert.isDefined(fileType, 'Detected file-type');
          assert.strictEqual(fileType.mime, 'image/jpeg', 'fileType.mime');
        } finally {
          nodeReadable.destroy()
        }
      } finally {
        await webReadableStream.cancel();
      }
    });

    it('Parse fetched audio track via conversion', async function () {

      const trackPath = '/Various%20Artists%20-%202009%20-%20netBloc%20Vol%2024_%20tiuqottigeloot%20%5BMP3-V2%5D/01%20-%20Diablo%20Swing%20Orchestra%20-%20Heroines.mp3';

      this.timeout(20000);

      const url = `https://raw.githubusercontent.com/Borewit/test-audio/958e057${trackPath}`;
      const response = await httpGetByUrl(url);
      const contentLength = response.headers.get('Content-Length');
      const webStream = response.body;
      if (!webStream) {
        assert.fail('response.body (Web API ReadableStream) not defined')
      }
      try {
        const nodeReadable = entryPoint.makeNodeStream(webStream);
        try {
          const metadata = await parseStream(nodeReadable, {
            size: contentLength ? Number.parseInt(contentLength, 10) : undefined,
            mimeType: response.headers.get('Content-Type') ?? undefined
          });
          assert.isDefined(metadata, 'metadata');
          assert.strictEqual(metadata.common.artist, 'Diablo Swing Orchestra', 'metadata.common.artist');
          assert.strictEqual(metadata.common.title, 'Heroines', 'metadata.common.title');
        } finally {
          nodeReadable.destroy();
        }
      } finally {
        await webStream.cancel();
      }
    });

    describe('destroying Node.js stream.Readable', () => {

      async function destroyReadable(propagateDestroy: boolean): Promise<void> {
        const mockedWebReadableStream = new MockedReadableStream();

        const nodeReadable = entryPoint.makeNodeStream(mockedWebReadableStream.stream, {propagateDestroy});
        const nodeReadableListener = new NodeReadableListener(nodeReadable);

        assert.isFalse(mockedWebReadableStream.cancelled, 'Web API ReadableStream is not cancelled');
        assert.strictEqual(nodeReadableListener.closed, 0, 'Node ReadableStream is not ended');
        assert.strictEqual(nodeReadableListener.errors.length, 0, 'Node ReadableStream did not receive any error');
        assert.isFalse(mockedWebReadableStream.cancelled, 'Web API ReadableStream is not cancelled yet');
        nodeReadable.destroy();
        await nodeReadableListener.waitUntilClosed();
        assert.strictEqual(nodeReadableListener.errors.length, 0, 'Node ReadableStream did not receive any error');
        assert.strictEqual(nodeReadableListener.closed, 1, 'Node ReadableStream ended, once');

        assert.strictEqual(mockedWebReadableStream.cancelled, propagateDestroy, 'Web API ReadableStream is cancelled');
        if (!propagateDestroy) {
          await mockedWebReadableStream.stream.cancel();
          assert.isTrue(mockedWebReadableStream.cancelled, 'Web API ReadableStream is cancelled');
        }

      }

      it('should be able to abort a pending read', async () => {
        await destroyReadable(false);
      });

      it('should be able to abort a pending read with cancellation propagation', async () => {
        await destroyReadable(true);
      });
    });
  });
});

