import {assert} from 'chai';
import * as TurboFs from '@seald-io/react-native-turbo-fs';
import RNFS from 'react-native-fs';
import * as QuickB64 from 'react-native-quick-base64';

export const benchmarkTurboFs = async (
  blockSize: number,
  fileSizeInMB: number,
) => {
  const baseDir = `${RNFS.TemporaryDirectoryPath}/react-native-turbo-fs-perf-turbofs`;

  await RNFS.unlink(baseDir).catch(() => {});
  await RNFS.mkdir(baseDir);

  const randValues = Array(blockSize)
    .fill(0)
    .map(() => Math.floor(Math.random() * 256));
  const buffer = new ArrayBuffer(randValues.length);
  const uint8Array = new Uint8Array(buffer);
  for (let i = 0; i < randValues.length; i++) {
    uint8Array[i] = randValues[i] as number;
  }

  // performance for append
  const fileSize = fileSizeInMB * 1024 * 1024;
  const iterations = fileSize / randValues.length;
  console.log(
    `Generating ${fileSizeInMB}MB file in ${randValues.length} bytes blocks...`,
  );
  const startAppend = performance.now();
  for (let i = 0; i < iterations; i++) {
    TurboFs.append(`${baseDir}/test-perf`, buffer);
  }
  const endAppend = performance.now();
  const durationAppend = (endAppend - startAppend) / 1000;
  console.log(
    `Generated ${fileSizeInMB}MB file in ${durationAppend.toFixed(3)}s`,
  );
  const speedAppend = fileSizeInMB / durationAppend;
  console.log(`Speed: ${speedAppend.toFixed(2)}MB/s`);

  // performance for read
  let readBytes = 0;
  const startRead = performance.now();
  while (true) {
    const buff = TurboFs.read(`${baseDir}/test-perf`, blockSize, readBytes);
    if (buff.byteLength === 0) {
      break;
    }
    readBytes += buff.byteLength;
  }
  const endRead = performance.now();
  const durationRead = (endRead - startRead) / 1000;
  assert.strictEqual(readBytes, fileSize);
  console.log(`Read ${fileSizeInMB}MB file in ${durationRead.toFixed(3)}s`);
  const speedRead = fileSizeInMB / durationRead;
  console.log(`Speed: ${speedRead.toFixed(2)}MB/s`);

  await RNFS.unlink(baseDir).catch(() => {});

  return {
    durationAppend,
    speedAppend,
    durationRead,
    speedRead,
  };
};

export const benchmarkRnfs = async (
  blockSize: number,
  fileSizeInMB: number,
) => {
  const baseDir = `${RNFS.TemporaryDirectoryPath}/react-native-turbo-fs-perf-rnfs`;

  await RNFS.unlink(baseDir).catch(() => {});
  await RNFS.mkdir(baseDir);

  const randValues = Array(blockSize)
    .fill(0)
    .map(() => Math.floor(Math.random() * 256));
  const buffer = new ArrayBuffer(randValues.length);
  const uint8Array = new Uint8Array(buffer);
  for (let i = 0; i < randValues.length; i++) {
    uint8Array[i] = randValues[i] as number;
  }

  // performance for append
  const fileSize = fileSizeInMB * 1024 * 1024;
  const iterations = fileSize / randValues.length;
  console.log(
    `Generating ${fileSizeInMB}MB file in ${randValues.length} bytes blocks...`,
  );
  const startAppend = performance.now();
  for (let i = 0; i < iterations; i++) {
    const b64 = QuickB64.fromByteArray(uint8Array);
    await RNFS.appendFile(`${baseDir}/test-perf`, b64, 'base64');
  }
  const endAppend = performance.now();
  const durationAppend = (endAppend - startAppend) / 1000;
  console.log(
    `Generated ${fileSizeInMB}MB file in ${durationAppend.toFixed(3)}s`,
  );
  const speedAppend = fileSizeInMB / durationAppend;
  console.log(`Speed: ${speedAppend.toFixed(2)}MB/s`);

  // performance for read
  let readBytes = 0;
  const startRead = performance.now();
  while (true) {
    const b64 = await RNFS.read(
      `${baseDir}/test-perf`,
      blockSize,
      readBytes,
      'base64',
    );
    if (b64.length === 0) {
      break;
    }
    const buff = QuickB64.toByteArray(b64);
    readBytes += buff.length;
  }
  const endRead = performance.now();
  const durationRead = (endRead - startRead) / 1000;
  assert.strictEqual(readBytes, fileSize);
  console.log(`Read ${fileSizeInMB}MB file in ${durationRead.toFixed(3)}s`);
  const speedRead = fileSizeInMB / durationRead;
  console.log(`Speed: ${speedRead.toFixed(2)}MB/s`);

  await RNFS.unlink(baseDir).catch(() => {});

  return {
    durationAppend,
    speedAppend,
    durationRead,
    speedRead,
  };
};
