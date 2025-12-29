import 'package:gl_horses/core/config/flavor_config.dart';
import 'package:gl_horses/core/firebase/firebase_options_prod.dart';
import 'package:gl_horses/main.dart';
import 'package:models/models.dart';

Future<void> main() async {
  return mainCommon(
    config: FlavorConfig(
      appEnvironment: AppEnvironment.prod,
      name: 'OnStride',
      stripePublishableKey:
          'pk_live_51RsuqpJN4vOcqMtV51xTy8mJC2AVVpDLGs11f2WVVs3tbTf7NcbThm1VB9baUsZlEoDYy70lb4k0KF60JDZPOOph001HflF2dn',
    ),
    options: DefaultFirebaseOptions.currentPlatform,
  );
}
