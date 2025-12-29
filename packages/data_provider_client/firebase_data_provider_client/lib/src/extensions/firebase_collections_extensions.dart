import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_data_provider_client/src/util/util.dart';

extension GLCollections on FirebaseFirestore {
  /// ------------------------------------------------------------
  /// Collection: users
  /// - GET: allowed if authenticated OR if docId == email (fallback).
  /// - LIST: only if authenticated.
  /// - WRITE (create/update/delete): any authenticated user (broad access).
  /// ------------------------------------------------------------
  CollectionReference<Json> get users => collection('users');

  /// ------------------------------------------------------------
  /// Collection: barns
  /// - Read: only if authenticated.
  /// - Create: only if account_type == 'owner'.
  /// - Update: if user has 'horseManagement' OR 'barnManagement'
  ///           OR account_type == 'owner'.
  /// - Delete: denied by default.
  /// ------------------------------------------------------------
  CollectionReference<Json> get barns => collection('barns');

  /// ------------------------------------------------------------
  /// Collection: invitations
  /// - Read: open.
  /// - Create/Delete: if signed in AND (owner OR has 'userMangement').
  /// - Update: if signed in AND (owner OR has 'userMangement').
  /// ------------------------------------------------------------
  CollectionReference<Json> get invitations => collection('invitations');

  /// ------------------------------------------------------------
  /// Collection: horses
  /// - Read: only if authenticated.
  /// - Create/Delete: if signed in AND (owner OR has 'horsesMangement').
  /// - Update: if signed in AND (owner OR has 'barnMangement' OR 'horsesMangement').
  /// ------------------------------------------------------------
  CollectionReference<Json> get horses => collection('horses');

  /// ------------------------------------------------------------
  /// Collection: tasks
  /// - Read/Create/Update/Delete: only if authenticated.
  /// ------------------------------------------------------------
  CollectionReference<Json> get tasks => collection('tasks');

  /// ------------------------------------------------------------
  /// Collection: app_data
  /// - Read: only if authenticated.
  /// - Write (create/update/delete): only if account_type == 'admin'.
  /// ------------------------------------------------------------
  CollectionReference<Json> get appData => collection('app_data');

  /// ------------------------------------------------------------
  /// Subcollection: app_data/horses_breed
  /// - Same as app_data: Read if signed in, write if admin.
  /// ------------------------------------------------------------
  CollectionReference<Json> get horsesBreed =>
      collection('app_data/horses/horses_breed');

  /// ------------------------------------------------------------
  /// Subcollection: app_data/horses_colors
  /// - Same as app_data: Read if signed in, write if admin.
  /// ------------------------------------------------------------
  CollectionReference<Json> get horsesColors =>
      collection('app_data/horses/horses_colors');

  /// ------------------------------------------------------------
  /// Subcollection: app_data/horses_sex_status
  /// - Same as app_data: Read if signed in, write if admin.
  /// ------------------------------------------------------------
  CollectionReference<Json> get horsesSexStatus =>
      collection('app_data/horses/horses_sex_status');

  /// ------------------------------------------------------------
  /// Subcollection: barns/{barnId}/logs
  /// - Create/Update: allowed if owner OR has 'barnManagement'.
  /// - Read/Delete: denied.
  /// ------------------------------------------------------------
  CollectionReference<Json> barnLogs(String barnId) =>
      collection('barns/$barnId/logs');

  /// ------------------------------------------------------------
  /// Subcollection: barns/{barnId}/delete_user_logs
  /// - Create/Update: allowed if owner OR has 'userManagement'.
  /// - Read/Delete: denied.
  /// ------------------------------------------------------------
  CollectionReference<Json> barnDeleteUserLogs(String barnId) =>
      collection('barns/$barnId/delete_user_logs');

  /// ------------------------------------------------------------
  /// Subcollection: barns/{barnId}/delete_horses_logs
  /// - Create/Update: allowed if owner OR has 'horsesManagement'.
  /// - Read/Delete: denied.
  /// ------------------------------------------------------------
  CollectionReference<Json> barnDeleteHorsesLogs(String barnId) =>
      collection('barns/$barnId/delete_horses_logs');

  /// ------------------------------------------------------------
  /// Subcollection: barns/{barnId}/invoices
  /// - Read: owner, permission 'generateInvoices', or boarder.
  /// - Create: owner or permission 'generateInvoices'.
  /// - Update: owner, 'generateInvoices', or boarder AND status == 'pending'.
  /// - Delete: owner or 'generateInvoices' AND status == 'pending'.
  /// ------------------------------------------------------------
  CollectionReference<Json> barnInvoices(String barnId) =>
      collection('barns/$barnId/invoices');
}
