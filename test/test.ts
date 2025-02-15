import {assert} from 'chai';
import {ReadableWebToNodeStream as NodeReadableWebToNodeStream} from '../lib/node.js';
import {ReadableWebToNodeStream as DefaultReadableWebToNodeStream} from '../lib/default.js';
import {fileTypeFromStream} from 'file-type';
import {parseStream} from 'music-metadata';

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

type makeReadableWebToNodeStream = (stream: ReadableStream | ReadableStream<Uint8Array>) => NodeReadableWebToNodeStream | DefaultReadableWebToNodeStream;

const entryPoints: { label: string, makeNodeStream: makeReadableWebToNodeStream } [] = [{
  label: 'Node.js',
  makeNodeStream: stream => new NodeReadableWebToNodeStream(stream)
}, {
  label: 'default (userland Readable)',
  makeNodeStream: stream => new DefaultReadableWebToNodeStream(stream),
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
          await nodeReadable.close();
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
      if (!response.body) {
        assert.fail('response.body (Web API ReadableStream) not defined')
      }
      const nodeReadable = entryPoint.makeNodeStream(response.body);
      try {
        const metadata = await parseStream(nodeReadable, {
          size: contentLength ? Number.parseInt(contentLength, 10) : undefined,
          mimeType: response.headers.get('Content-Type') ?? undefined
        });
        assert.isDefined(metadata, 'metadata');
        assert.strictEqual(metadata.common.artist, 'Diablo Swing Orchestra', 'metadata.common.artist');
        assert.strictEqual(metadata.common.title, 'Heroines', 'metadata.common.title');
      } finally {
        await nodeReadable.close();
      }
    });
  });
});

