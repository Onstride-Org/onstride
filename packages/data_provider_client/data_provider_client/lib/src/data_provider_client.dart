// ignore_for_file: unused_field

import 'package:data_provider_client/data_provider_client.dart';

/// {@template data_provider_client}
/// {@endtemplate}
abstract class DataProviderClient {
  /// {@macro data_provider_client}
  DataProviderClient({
    required this.accountsResource,
    required this.horseResource,
    required this.tasksResource,
    required this.usersResource,
    required this.barnsResource,
    required this.invoicesResource,
    required this.invitationsResource,
    required this.rideLogsResource,
  });

  /// Resource exposing information about accounts.
  final AccountsResource accountsResource;

  /// Resource exposing information about horses.
  final HorseResource horseResource;

  /// Resource exposing information about accounts.
  final TasksResource tasksResource;

  /// Resource exposing information about users.
  final UsersResource usersResource;

  /// Resource exposing barns data.
  final BarnsResource barnsResource;

  /// Resource exposing invoices data.
  final InvoicesResource invoicesResource;

  /// Resource exposing invitation data.
  final InvitationsResource invitationsResource;

  /// Resource exposing ride logs data.
  final RideLogsResource rideLogsResource;

  // /// Resource exposing information about the user, allowing
  // /// to authenticate, and to list user's licenses
  // LoginResource get loginResource => LoginResource(_httpClient);

  // /// Resource exposing information about an academy.
  // AcademyResource get academyResource => AcademyResource(_httpClient);

  // /// Resource exposing information about an instructor.
  // InstructorResource get instructorResource =>
  // InstructorResource(_httpClient);

  // /// Resource exposing the endpoints starting with /session to handle
  // /// JWT token operations
  // SessionResource get sessionResource => SessionResource(_httpClient);

  // /// Resource exposing the endpoints responsible for video upload
  // LockerResource get lockerResource => LockerResource(_httpClient,
  // _fileSystem);

  /// Resource exposing information about accounts.

  // /// Resource exposing the endpoints responsible for training session
  // TrainingSessionResource get trainingSessionResource =>
  //     TrainingSessionResource(_httpClient);

  // /// Resource exposing the endpoints responsible
  // /// for fetching catalog videos
  // CatalogVideosResource get catalogVideosResource =>
  //     CatalogVideosResource(_httpClient);

  // /// Resource exposing the endpoints responsible
  // /// for fetching catalog videos
  // SeriesResource get seriesResource => SeriesResource(_httpClient);

  // /// Resource exposing the endpoints responsible
  // /// for fetching connection requests
  // ConnectionRequestResource get connectionRequestResource =>
  //     ConnectionRequestResource(_httpClient);

  // /// Resource responsible for downloading files
  // FileResource get fileResource => FileResource(_httpClient, _fileSystem);

  // /// Resource exposing endpoints responsible for payments
  // PaymentsResource get paymentsResource => PaymentsResource(_httpClient);
}
