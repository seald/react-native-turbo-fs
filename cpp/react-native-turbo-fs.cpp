#include "react-native-turbo-fs.h"
#include "base64.h"

#include <iostream>
#include <sstream>
#include <fstream>
#include <string>
#include <cstdint>

using namespace facebook;

// Returns false if the passed value is not a string or an ArrayBuffer.
bool valueToString(jsi::Runtime& runtime, const jsi::Value& value, std::string* str) {
  if (value.isString()) {
    *str = value.asString(runtime).utf8(runtime);
    return true;
  }

  if (value.isObject()) {
    auto obj = value.asObject(runtime);
    if (!obj.isArrayBuffer(runtime)) {
      return false;
    }
    auto buf = obj.getArrayBuffer(runtime);
    *str = std::string((char*)buf.data(runtime), buf.size(runtime));
    return true;
  }

  return false;
}

void installBase64(jsi::Runtime& jsiRuntime) {
  std::cout << "Initializing react-native-turbo-fs" << "\n";

  auto base64FromArrayBuffer = jsi::Function::createFromHostFunction(
      jsiRuntime,
      jsi::PropNameID::forAscii(jsiRuntime, "base64FromArrayBuffer"),
      1,  // string
      [](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, std::size_t count) -> jsi::Value {
        std::string str;
        if(!valueToString(runtime, arguments[0], &str)) {
          return jsi::Value(-1);
        }
        bool url = false;
        if (arguments[1].isBool()) {
          url = arguments[1].asBool();
        }
        try {
          std::string strBase64 = base64_encode(str, url);
          return jsi::Value(jsi::String::createFromUtf8(runtime, strBase64));
        } catch (const std::runtime_error& error) {
          throw jsi::JSError(runtime, error.what());
        } catch (...) {
          throw jsi::JSError(runtime, "unknown encoding error");
        }
      }
  );
  jsiRuntime.global().setProperty(jsiRuntime, "base64FromArrayBuffer", std::move(base64FromArrayBuffer));

  auto base64ToArrayBuffer = jsi::Function::createFromHostFunction(
      jsiRuntime,
      jsi::PropNameID::forAscii(jsiRuntime, "base64ToArrayBuffer"),
      1,  // string
      [](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, std::size_t count) -> jsi::Value {
        if (!arguments[0].isString()) {
          return jsi::Value(-1);
        }

        std::string strBase64 = arguments[0].getString(runtime).utf8(runtime);
        bool removeLinebreaks = false;
        if (arguments[1].isBool()) {
          removeLinebreaks = arguments[1].asBool();
        }
        try {
          std::string str = base64_decode(strBase64, removeLinebreaks);
          jsi::Function arrayBufferCtor = runtime.global().getPropertyAsFunction(runtime, "ArrayBuffer");
          jsi::Object o = arrayBufferCtor.callAsConstructor(runtime, (int)str.length()).getObject(runtime);
          jsi::ArrayBuffer buf = o.getArrayBuffer(runtime);
          memcpy(buf.data(runtime), str.c_str(), str.size());
          return o;
        } catch (const std::runtime_error& error) {
          throw jsi::JSError(runtime, error.what());
        } catch (...) {
          throw jsi::JSError(runtime, "unknown decoding error");
        }
      }
  );
  jsiRuntime.global().setProperty(jsiRuntime, "base64ToArrayBuffer", std::move(base64ToArrayBuffer));

  auto turboFsRead = jsi::Function::createFromHostFunction(
      jsiRuntime,
      jsi::PropNameID::forAscii(jsiRuntime, "turboFsRead"),
      3,  // filePath: string, size: number, position: number
      [](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, std::size_t count) -> jsi::Value {
        if (count != 3 || !arguments[0].isString() || !arguments[1].isNumber() || !arguments[2].isNumber()) {
          throw facebook::jsi::JSError(
            runtime,
            "turboFsRead expects exactly 3 arguments: filePath: string, size: number, position: number"
          );
        }
        std::string filePath = arguments[0].asString(runtime).utf8(runtime);
        int size = static_cast<int>(arguments[1].asNumber());
        uint64_t position = static_cast<uint64_t>(arguments[2].asNumber());

        try {
          jsi::Function arrayBufferCtor = runtime.global().getPropertyAsFunction(runtime, "ArrayBuffer");
          jsi::Object o = arrayBufferCtor.callAsConstructor(runtime, size).getObject(runtime);
          jsi::ArrayBuffer buf = o.getArrayBuffer(runtime);
          uint8_t* buffer = buf.data(runtime);

          std::ifstream file(filePath, std::ios::binary);

          if (!file) {
            int err = errno; // Global error code set by system calls
            throw std::ios_base::failure(
                "Failed to open the file: " + std::string(std::strerror(err))
            );
          }

          // Seek to the specified position
          file.seekg(position);

          if (!file) {
            int err = errno; // Global error code set by system calls
            throw std::ios_base::failure(
                "Failed to seek to the specified position: " + std::string(std::strerror(err))
            );
          }

          // Read the required number of bytes into the provided buffer
          file.read(reinterpret_cast<char*>(buffer), size);

          if (!file && !file.eof()) {  // Allow partial reads at EOF
            int err = errno; // Global error code set by system calls
            throw std::ios_base::failure(
                "Failed to read the specified length of data: " + std::string(std::strerror(err))
            );
          }

          std::size_t bytesRead = file.gcount();

          // Handle cases where fewer bytes are read due to EOF
          if (bytesRead < size) { // TODO: switch to Uint8Array to avoid this copy
            jsi::Object o2 = arrayBufferCtor.callAsConstructor(runtime, static_cast<int>(bytesRead)).getObject(runtime);
            jsi::ArrayBuffer buf2 = o2.getArrayBuffer(runtime);
            uint8_t* buffer2 = buf2.data(runtime);
            memcpy(buffer2, buffer, bytesRead);
            return o2;
          } else {
            return o;
          }
        } catch (const std::runtime_error& error) {
          throw jsi::JSError(runtime, error.what());
        } catch (...) {
          throw jsi::JSError(runtime, "unknown encoding error");
        }
      }
  );
  jsiRuntime.global().setProperty(jsiRuntime, "turboFsRead", std::move(turboFsRead));

  auto turboFsAppend = jsi::Function::createFromHostFunction(
      jsiRuntime,
      jsi::PropNameID::forAscii(jsiRuntime, "turboFsAppend"),
      2,  // filePath: string, data: ArrayBuffer
      [](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, std::size_t count) -> jsi::Value {
        if (count != 2 || !arguments[0].isString() || !arguments[1].isObject() || !arguments[1].asObject(runtime).isArrayBuffer(runtime)) {
          throw facebook::jsi::JSError(
            runtime,
            "turboFsAppend expects exactly 2 arguments: filePath: string, data: ArrayBuffer"
          );
        }
        std::string filePath = arguments[0].asString(runtime).utf8(runtime);
        jsi::ArrayBuffer data = arguments[1].asObject(runtime).getArrayBuffer(runtime);
        uint8_t* buffer = data.data(runtime);
        std::size_t size = data.size(runtime);

        try {
          // Open the file in binary mode with append flag
          std::ofstream file(filePath, std::ios::binary | std::ios::app);

          if (!file) {
            int err = errno; // Global error code set by system calls
            throw std::ios_base::failure(
                "Failed to open the file for appending: " + std::string(std::strerror(err))
            );
          }

          // Write the data to the file
          file.write(reinterpret_cast<char*>(buffer), size);

          if (!file) {
            int err = errno; // Global error code set by system calls
            throw std::ios_base::failure(
                "Failed to append data to the file: " + std::string(std::strerror(err))
            );
          }

          return jsi::Value(0);
        } catch (const std::runtime_error& error) {
          throw jsi::JSError(runtime, error.what());
        } catch (...) {
          throw jsi::JSError(runtime, "unknown decoding error");
        }
      }
  );
  jsiRuntime.global().setProperty(jsiRuntime, "turboFsAppend", std::move(turboFsAppend));
}

void cleanupBase64() {
}
