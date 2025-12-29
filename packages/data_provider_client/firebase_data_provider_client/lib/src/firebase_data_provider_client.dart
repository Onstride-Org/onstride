// ignore_for_file: unused_field

import 'package:data_provider_client/data_provider_client.dart';
import 'package:firebase_data_provider_client/src/resource/resource.dart';

/// {@template firebase_data_provider_client}
/// {@endtemplate}
class FirebaseDataProviderClient implements DataProviderClient {
  /// {@macro firebase_data_provider_client}
  FirebaseDataProviderClient({
    required this.accountsResource,
    required this.horseResource,
    required this.tasksResource,
    required this.usersResource,
    required this.barnsResource,
    required this.invoicesResource,
    required this.invitationsResource,
    required this.rideLogsResource,
    required this.lessonsResource,
    required this.billingResource,
    required this.multiBarnResource,
    required this.vendorsResource,
    required this.brandingResource,
  });

  /// Resource exposing information about accounts.
  @override
  final FirebaseAccountsResource accountsResource;

  @override
  // Resource exposing tasks data.
  final FirebaseTasksResource tasksResource;

  @override
  // Resource exposing users data.
  final FirebaseUsersResource usersResource;

  // Resource exposing horses data.
  @override
  final FirebaseHorseResource horseResource;

  @override
  final BarnsResource barnsResource;

  @override
  final InvoicesResource invoicesResource;

  @override
  final InvitationsResource invitationsResource;

  @override
  final RideLogsResource rideLogsResource;

  @override
  final LessonsResource lessonsResource;

  @override
  final BillingResource billingResource;

  @override
  final MultiBarnResource multiBarnResource;

  @override
  final VendorsResource vendorsResource;

  @override
  final BrandingResource brandingResource;
}
