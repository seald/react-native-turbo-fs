import {assert} from 'chai';
import * as TurboFs from '@seald-io/react-native-turbo-fs';
import {describe, it} from '../MochaRNAdapter';
import RNFS from 'react-native-fs';

function stringToArrayBuffer(str: string): ArrayBuffer {
  const buffer = new ArrayBuffer(str.length); // Create an ArrayBuffer with the same length as the string
  const uint8Array = new Uint8Array(buffer); // Create a typed array view of the buffer

  // Fill the typed array with the character codes of the string
  for (let i = 0; i < str.length; i++) {
    uint8Array[i] = str.charCodeAt(i);
  }

  return buffer;
}

describe('turbo-fs', () => {
  const baseDir = `${RNFS.TemporaryDirectoryPath}/react-native-turbo-fs-tests`;

  it('cleanup before', async () => {
    await RNFS.unlink(baseDir).catch(() => {});
    await RNFS.mkdir(baseDir);
  });

  it('append', async () => {
    const buffer = stringToArrayBuffer('test-');
    TurboFs.append(`${baseDir}/test-file`, buffer);

    const buffer2 = stringToArrayBuffer('data...');
    TurboFs.append(`${baseDir}/test-file`, buffer2);
  });

  it('read', async () => {
    // basic read from 0 with given length
    const buffer = TurboFs.read(`${baseDir}/test-file`, 4, 0);
    const decodedString = String.fromCharCode(...new Uint8Array(buffer)); // Convert bytes to a string
    assert.strictEqual(decodedString, 'test');

    // read with position
    const buffer2 = TurboFs.read(`${baseDir}/test-file`, 4, 5);
    const decodedString2 = String.fromCharCode(...new Uint8Array(buffer2));
    assert.strictEqual(decodedString2, 'data');

    // read that reaches EOF
    const buffer3 = TurboFs.read(`${baseDir}/test-file`, 100, 5);
    const decodedString3 = String.fromCharCode(...new Uint8Array(buffer3));
    assert.strictEqual(decodedString3, 'data...');

    // read just after the end
    const buffer4 = TurboFs.read(`${baseDir}/test-file`, 100, 12);
    assert.strictEqual(buffer4.byteLength, 0);

    // read far after the end
    const buffer5 = TurboFs.read(`${baseDir}/test-file`, 100, 100);
    assert.strictEqual(buffer5.byteLength, 0);
  });

  it('cleanup after', async () => {
    await RNFS.unlink(baseDir).catch(() => {});
  });
});
