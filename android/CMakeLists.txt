project(TurboFs)
cmake_minimum_required(VERSION 3.9.0)

set (PACKAGE_NAME "turbofs")
set (BUILD_DIR ${CMAKE_SOURCE_DIR}/build)
set (CMAKE_VERBOSE_MAKEFILE ON)
set (CMAKE_CXX_STANDARD 17)

include_directories(
  ../cpp
  "${NODE_MODULES_DIR}/react-native/React"
  "${NODE_MODULES_DIR}/react-native/React/Base"
  "${NODE_MODULES_DIR}/react-native/ReactCommon/jsi"
)

add_library(
  ${PACKAGE_NAME}
  SHARED
  ../cpp/react-native-turbo-fs.cpp
  ../cpp/react-native-turbo-fs.h
  cpp-adapter.cpp
)

# Configure C++ 17
set_target_properties(
        ${PACKAGE_NAME} PROPERTIES
        CXX_STANDARD 17
        CXX_EXTENSIONS OFF
        POSITION_INDEPENDENT_CODE ON
)

find_package(ReactAndroid REQUIRED CONFIG)
find_library(log-lib log)

target_link_libraries(
  ${PACKAGE_NAME}
  ${log-lib}          # <-- Logcat logger
  ReactAndroid::jsi   # <-- JSI
  android             # <-- Android JNI core
)
