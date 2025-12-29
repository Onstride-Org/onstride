import 'package:gl_horses/core/config/flavor_config.dart';
import 'package:gl_horses/core/firebase/firebase_options_dev.dart';
import 'package:gl_horses/main.dart';
import 'package:models/models.dart';

Future<void> main() async {
  return mainCommon(
    config: FlavorConfig(
      name: 'OnStride Dev',
      stripePublishableKey:
          'pk_test_51RsuqzJ37suYX7oJBMpHQJ7QkcNvvQmxx30VzVRuXw2SYfj3cedGEQywRY8peKPcDY2EQRpqyP8UbTFbcjLBAjAA00cldlxavb',
      appEnvironment: AppEnvironment.dev,
    ),
    options: DefaultFirebaseOptions.currentPlatform,
  );
}
