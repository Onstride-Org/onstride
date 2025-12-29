// core_providers.dart
import 'package:account_repository/account_repository.dart';
import 'package:app_config_repository/app_config_repository.dart';
import 'package:auth_repository/auth_repository.dart';
import 'package:barns_repository/barns_repository.dart';
import 'package:billing_repository/billing_repository.dart';
import 'package:data_provider_client/data_provider_client.dart';
import 'package:database_client/database_client.dart';
import 'package:firebase_authentication_client/firebase_authentication_client.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_data_provider_client/firebase_data_provider_client.dart';
import 'package:firebase_remote_config_client/firebase_remote_config_client.dart';
import 'package:firebase_storage_client/firebase_storage_client.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/config/flavor_config.dart';
import 'package:horse_repository/horse_repository.dart';
import 'package:invitations_repository/invitations_repository.dart';
import 'package:invoices_repository/invoices_repository.dart';
import 'package:lessons_repository/lessons_repository.dart';
import 'package:remote_config_client/remote_config_client.dart';
import 'package:ride_logs_repository/ride_logs_repository.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:tasks_repository/tasks_repository.dart';
import 'package:users_repository/users_repository.dart';

part 'repository_providers.g.dart';

@Riverpod(keepAlive: true)
FirebaseStorageClient storageClient(Ref ref) {
  return FirebaseStorageClient();
}

@Riverpod(keepAlive: true)
DatabaseClient databaseClient(Ref ref) {
  final db = DatabaseClient()..initialize();
  return db;
}

@Riverpod(keepAlive: true)
RemoteConfigClient remoteConfigClient(Ref ref) {
  final client = FirebaseRemoteConfigClient();
  return client;
}

@Riverpod(keepAlive: true)
DataProviderClient dataProviderClient(Ref ref) {
  final storage = ref.watch(storageClientProvider);
  return FirebaseDataProviderClient(
    accountsResource: FirebaseAccountsResource(storageClient: storage),
    tasksResource: FirebaseTasksResource(),
    horseResource: FirebaseHorseResource(),
    usersResource: FirebaseUsersResource(),
    barnsResource: FirebaseBarnsResource(),
    invoicesResource: FirebaseInvoicesResource(app: Firebase.app()),
    invitationsResource: FirebaseInvitationsResource(),
    rideLogsResource: FirebaseRideLogsResource(),
    lessonsResource: FirebaseLessonsResource(),
    billingResource: FirebaseBillingResource(),
  );
}

@Riverpod(keepAlive: true)
AccountRepository accountRepository(Ref ref) {
  final dpc = ref.watch(dataProviderClientProvider);
  return AccountRepository(dataProviderClient: dpc);
}

@Riverpod(keepAlive: true)
BarnsRepository barnsRepository(Ref ref) {
  final dpc = ref.watch(dataProviderClientProvider);
  return BarnsRepository(dataProviderClient: dpc);
}

@Riverpod(keepAlive: true)
TasksRepository tasksRepository(Ref ref) {
  final dpc = ref.watch(dataProviderClientProvider);
  return TasksRepository(dataProviderClient: dpc);
}

@Riverpod(keepAlive: true)
HorseRepository horseRepository(Ref ref) {
  final dpc = ref.watch(dataProviderClientProvider);
  return HorseRepository(dataProviderClient: dpc);
}

@Riverpod(keepAlive: true)
UsersRepository usersRepository(Ref ref) {
  final dpc = ref.watch(dataProviderClientProvider);
  return UsersRepository(dataProviderClient: dpc);
}

@Riverpod(keepAlive: true)
AppConfigRepository appConfigRepository(Ref ref) {
  final flavor = ref.watch(flavorConfigProvider);
  return AppConfigRepository(
    appEnvironment: flavor.appEnvironment,
    buildNumber: flavor.buildNumber ?? 0,
  );
}

@Riverpod(keepAlive: true)
AuthRepository authRepository(Ref ref) {
  final db = ref.watch(databaseClientProvider);
  return AuthRepository(
    authenticationClient: FirebaseAuthenticationClient(),
  );
}

@Riverpod(keepAlive: true)
InvoicesRepository invoicesRepository(Ref ref) => InvoicesRepository(
  dataProviderClient: ref.watch(dataProviderClientProvider),
);

@Riverpod(keepAlive: true)
InvitationsRepository invitationsRepository(Ref ref) => InvitationsRepository(
  dataProviderClient: ref.watch(dataProviderClientProvider),
);

@Riverpod(keepAlive: true)
RideLogsRepository rideLogsRepository(Ref ref) => RideLogsRepository(
  dataProviderClient: ref.watch(dataProviderClientProvider),
);

@Riverpod(keepAlive: true)
LessonsRepository lessonsRepository(Ref ref) => LessonsRepository(
  dataProviderClient: ref.watch(dataProviderClientProvider),
);

@Riverpod(keepAlive: true)
BillingRepository billingRepository(Ref ref) => BillingRepository(
  dataProviderClient: ref.watch(dataProviderClientProvider),
);
