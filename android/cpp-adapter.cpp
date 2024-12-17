#include <jni.h>
#include "react-native-turbo-fs.h"

using namespace facebook;

extern "C"
JNIEXPORT void JNICALL
Java_com_reactnativeturbofs_TurboFsModule_initialize(JNIEnv* env, jclass clazz, jlong jsiPtr) {
  installBase64(*reinterpret_cast<jsi::Runtime*>(jsiPtr));
}

extern "C"
JNIEXPORT void JNICALL
Java_com_reactnativeturbofs_TurboFsModule_destruct(JNIEnv* env, jclass clazz) {
  cleanupBase64();
}
