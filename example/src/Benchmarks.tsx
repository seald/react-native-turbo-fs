import React from 'react';
import {useState} from 'react';
import {StyleSheet, View, Text, Pressable, Platform} from 'react-native';
import {benchmarkRnfs, benchmarkTurboFs} from './tests/benchmarks';

const sleep = (t: number) => new Promise(resolve => setTimeout(resolve, t));

const Benchmarks = () => {
  const [processingTurboFs, setProcessingTurboFs] = useState<boolean>(false);
  const [turboFsResultAppend, setTurboFsResultAppend] = useState<number>(0);
  const [turboFsResultRead, setTurboFsResultRead] = useState<number>(0);
  const [processingRnfs, setProcessingRnfs] = useState<boolean>(false);
  const [rnfsResultAppend, setRnfsResultAppend] = useState<number>(0);
  const [rnfsResultRead, setRnfsResultRead] = useState<number>(0);

  const handleTurboFs = async () => {
    setProcessingTurboFs(true);
    await sleep(1);
    const res = await benchmarkTurboFs(512 * 1024, 100);
    setTurboFsResultAppend(res.speedAppend);
    setTurboFsResultRead(res.speedRead);
    setProcessingTurboFs(false);
  };

  const handleRnfs = async () => {
    setProcessingRnfs(true);
    await sleep(1);
    const res = await benchmarkRnfs(512 * 1024, 100);
    setRnfsResultAppend(res.speedAppend);
    setRnfsResultRead(res.speedRead);
    setProcessingRnfs(false);
  };

  const speedupAppend =
    turboFsResultAppend && rnfsResultAppend
      ? `${(turboFsResultAppend / rnfsResultAppend).toFixed(1)}x faster Append`
      : ' ';
  const speedupRead =
    turboFsResultRead && rnfsResultRead
      ? `${(turboFsResultRead / rnfsResultRead).toFixed(1)}x faster Read`
      : ' ';

  const onPress = async () => {
    await handleTurboFs();
    await handleRnfs();
  };

  return (
    <View>
      <View style={styles.lib}>
        <Text style={styles.heading}>TurboFs Append</Text>
        <Text style={styles.result}>
          {turboFsResultAppend && turboFsResultAppend > 0
            ? `${turboFsResultAppend.toFixed(2)} MB/s`
            : ''}
        </Text>
      </View>
      <View style={styles.lib}>
        <Text style={styles.heading}>TurboFs Read</Text>
        <Text style={styles.result}>
          {turboFsResultRead && turboFsResultRead > 0
            ? `${turboFsResultRead.toFixed(2)} MB/s`
            : ''}
        </Text>
      </View>

      <View style={styles.lib}>
        <Text style={styles.heading}>RNFS Append</Text>
        <Text style={styles.result}>
          {rnfsResultAppend && rnfsResultAppend > 0
            ? `${rnfsResultAppend.toFixed(2)} MB/s`
            : ''}
        </Text>
      </View>
      <View style={styles.lib}>
        <Text style={styles.heading}>RNFS Read</Text>
        <Text style={styles.result}>
          {rnfsResultRead && rnfsResultRead > 0
            ? `${rnfsResultRead.toFixed(2)} MB/s`
            : ''}
        </Text>
      </View>

      <Text style={styles.speedup}>{speedupAppend}</Text>
      <Text style={styles.speedup}>{speedupRead}</Text>

      <Pressable
        onPress={() => {
          onPress();
        }}
        style={styles.button}>
        <Text style={styles.pressable}>
          {processingTurboFs || processingRnfs
            ? 'Processing...'
            : 'Run Benchmarks'}
        </Text>
      </Pressable>
    </View>
  );
};

export default Benchmarks;

const styles = StyleSheet.create({
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
  lib: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heading: {
    fontSize: 14,
    marginVertical: 5,
  },
  pressable: {
    textAlign: 'center',
  },
  result: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginVertical: 5,
  },
  button: {backgroundColor: 'skyblue', padding: 12},
  speedup: {
    marginVertical: 5,
    fontSize: 18,
    textAlign: 'center',
  },
});
