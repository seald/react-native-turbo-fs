#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import "../cpp/react-native-turbo-fs.h"

@interface TurboFsModule : NSObject <RCTBridgeModule>

@property (nonatomic, assign) BOOL setBridgeOnMainQueue;

@end
