import {assert} from 'chai';
import {read, append} from '@seald-io/react-native-turbo-fs';
import {describe, it} from '../MochaRNAdapter';

function stringToArrayBuffer(str: string): ArrayBuffer {
  const buffer = new ArrayBuffer(str.length); // Create an ArrayBuffer with the same length as the string
  const uint8Array = new Uint8Array(buffer); // Create a typed array view of the buffer

  // Fill the typed array with the character codes of the string
  for (let i = 0; i < str.length; i++) {
    uint8Array[i] = str.charCodeAt(i);
  }

  return buffer;
}

const baseDir = '/data/user/0/com.turbofsexample/files';

const rand = Math.floor(Math.random() * 100000).toString();

describe('turbo-fs', () => {
  it('append', async () => {
    const buffer = stringToArrayBuffer('test-');
    append(`${baseDir}/test-file-${rand}`, buffer);

    const buffer2 = stringToArrayBuffer('data...');
    append(`${baseDir}/test-file-${rand}`, buffer2);
  });

  it('read', async () => {
    // basic read from 0 with given length
    const buffer = read(`${baseDir}/test-file-${rand}`, 4, 0);
    const decodedString = String.fromCharCode(...new Uint8Array(buffer)); // Convert bytes to a string
    assert.strictEqual(decodedString, 'test');

    // read with position
    const buffer2 = read(`${baseDir}/test-file-${rand}`, 4, 5);
    const decodedString2 = String.fromCharCode(...new Uint8Array(buffer2));
    assert.strictEqual(decodedString2, 'data');

    // read that reaches EOF
    const buffer3 = read(`${baseDir}/test-file-${rand}`, 100, 5);
    const decodedString3 = String.fromCharCode(...new Uint8Array(buffer3));
    assert.strictEqual(decodedString3, 'data...');

    // read just after the end
    const buffer4 = read(`${baseDir}/test-file-${rand}`, 100, 12);
    assert.strictEqual(buffer4.byteLength, 0);

    // read far after the end
    const buffer5 = read(`${baseDir}/test-file-${rand}`, 100, 100);
    assert.strictEqual(buffer5.byteLength, 0);
  });
});

describe('turbo-fs performance', () => {
  it('turbo-fs performance', async () => {
    const blockSize = 512 * 1024;
    const randValues = Array(blockSize)
      .fill(0)
      .map(() => Math.floor(Math.random() * 256));
    const buffer = new ArrayBuffer(randValues.length);
    const uint8Array = new Uint8Array(buffer);
    for (let i = 0; i < randValues.length; i++) {
      uint8Array[i] = randValues[i] as number;
    }

    // performance for append
    const fileSizeInMB = 100;
    const fileSize = fileSizeInMB * 1024 * 1024;
    const iterations = fileSize / randValues.length;
    console.log(
      `Generating ${fileSizeInMB}MB file in ${randValues.length} bytes blocks...`,
    );
    let t0 = Date.now();
    for (let i = 0; i < iterations; i++) {
      append(`${baseDir}/test-perf-${rand}`, buffer);
    }
    let duration = (Date.now() - t0) / 1000;
    console.log(`Generated ${fileSizeInMB}MB file in ${duration.toFixed(3)}s`);
    console.log(`Speed: ${(fileSizeInMB / duration).toFixed(2)}MB/s`);

    // performance for read
    let readBytes = 0;
    t0 = Date.now();
    while (true) {
      const buff = read(`${baseDir}/test-perf-${rand}`, blockSize, readBytes);
      if (buff.byteLength === 0) {
        break;
      }
      readBytes += buff.byteLength;
    }
    duration = (Date.now() - t0) / 1000;
    assert.strictEqual(readBytes, fileSize);
    console.log(`Read ${fileSizeInMB}MB file in ${duration.toFixed(3)}s`);
    console.log(`Speed: ${(fileSizeInMB / duration).toFixed(2)}MB/s`);
  });
});
