import {assert} from 'chai';
import {read, append} from 'react-native-quick-base64';
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

const baseDir = '/data/user/0/com.quickbase64example/files';

describe('turbo-fs', () => {
  it('append', async () => {
    const buffer = stringToArrayBuffer('test-');
    append(baseDir + '/test-file', buffer);

    const buffer2 = stringToArrayBuffer('data...');
    append(baseDir + '/test-file', buffer2);
  });

  it('read', async () => {
    // basic read from 0 with given length
    const buffer = read(baseDir + '/test-file', 4, 0);
    const decodedString = String.fromCharCode(...new Uint8Array(buffer)); // Convert bytes to a string
    assert.strictEqual(decodedString, 'test');

    // read with position
    const buffer2 = read(baseDir + '/test-file', 4, 5);
    const decodedString2 = String.fromCharCode(...new Uint8Array(buffer2));
    assert.strictEqual(decodedString2, 'data');

    // read that reaches EOF
    const buffer3 = read(baseDir + '/test-file', 100, 5);
    const decodedString3 = String.fromCharCode(...new Uint8Array(buffer3));
    assert.strictEqual(decodedString3, 'data...');
  });
});
