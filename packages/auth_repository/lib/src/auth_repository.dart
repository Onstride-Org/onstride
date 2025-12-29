// ignore_for_file: public_member_api_docs

import 'dart:async';

import 'package:authentication_client/authentication_client.dart';
import 'package:database_client/database_client.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:models/models.dart';

/// {@template auth_repository}
/// Repository which manages the user domain.
/// {@endtemplate}
class AuthRepository {
  /// {@macro auth_repository}
  AuthRepository({required AuthenticationClient authenticationClient})
    : _authenticationClient = authenticationClient,
      _secureStorage = const FlutterSecureStorage();

  final AuthenticationClient _authenticationClient;
  final FlutterSecureStorage _secureStorage;

  static const _usernameKey = 'auth_username';
  static const _passwordKey = 'auth_password';

  Future<void> saveCredentials({
    required String username,
    required String password,
  }) async {
    await _secureStorage.write(key: _usernameKey, value: username);
    await _secureStorage.write(key: _passwordKey, value: password);
  }

  Future<GlAuthCredentials?> readCredentials() async {
    final username = await _secureStorage.read(key: _usernameKey);
    final password = await _secureStorage.read(key: _passwordKey);

    if (username == null || password == null) return null;

    return GlAuthCredentials(email: username, password: password);
  }

  Future<void> clearCredentials() async {
    await _secureStorage.delete(key: _usernameKey);
    await _secureStorage.delete(key: _passwordKey);
  }

  /// Stream of [GLUser] which will emit the current user when
  /// the authentication state changes.
  ///
  /// Emits [GLUser.anonymous] if the user is not authenticated.
  Stream<GLUser?> get user {
    return _authenticationClient.user.map((event) => event.toDbUser.toUser());
  }

  /// Forces a refresh of the user by accessing the authentication
  /// client's user. This leads to fetching the most recent user from the
  /// API and emitting it onto the [user] stream.
  void refreshUser() {
    _authenticationClient.user;
  }

  /// Creates a new user with the provided [email] and [password].
  ///
  /// Throws a [SignUpFailure] if an exception occurs.
  Future<String?> signUp({
    required String email,
    required String password,
  }) async {
    try {
      return await _authenticationClient.signUp(
        email: email,
        password: password,
      );
    } on SignUpEmailInUseFailure catch (error, stackTrace) {
      throw SignUpEmailInUseFailure(error, stackTrace);
    } on SignUpInvalidEmailFailure catch (error, stackTrace) {
      throw SignUpInvalidEmailFailure(error, stackTrace);
    } on SignUpOperationNotAllowedFailure catch (error, stackTrace) {
      throw SignUpOperationNotAllowedFailure(error, stackTrace);
    } on SignUpWeakPasswordFailure catch (error, stackTrace) {
      throw SignUpWeakPasswordFailure(error, stackTrace);
    } on SignUpConnectionFailure catch (error, stackTrace) {
      throw SignUpConnectionFailure(error, stackTrace);
    } on SignUpFailure {
      rethrow;
    } catch (error, stackTrace) {
      throw SignUpFailure(error, stackTrace);
    }
  }

  /// Sends a password reset link to the provided [email].
  ///
  /// Throws a [ResetPasswordFailure] if an exception occurs.
  Future<void> sendPasswordResetEmail({required String email}) async {
    try {
      await _authenticationClient.sendPasswordResetEmail(email: email);
    } on ResetPasswordFailure {
      rethrow;
    } catch (error, stackTrace) {
      throw ResetPasswordFailure(error, stackTrace);
    }
  }

  /// Sends a verification email to the provided [email].
  ///
  /// Throws a [SendVerificationEmailFailure] if an exception occurs.
  Future<String?> sendVerificationEmail({required String email}) async {
    try {
      final code = await _authenticationClient.sendVerificationEmail(
        email: email,
      );
      return code;
    } on SendVerificationEmailFailure {
      rethrow;
    } catch (error, stackTrace) {
      throw SendVerificationEmailFailure(error, stackTrace);
    }
  }

  /// Verify [email] with provided [code].
  ///
  /// Throws a [SendVerificationEmailFailure] if an exception occurs.
  Future<void> sendEmailVerificationCode({
    required String email,
    required String code,
  }) async {
    try {
      await _authenticationClient.sendEmailVerificationCode(
        email: email,
        code: code,
      );
    } on SendVerificationEmailFailure {
      rethrow;
    } catch (error, stackTrace) {
      throw SendVerificationEmailFailure(error, stackTrace);
    }
  }

  /// Starts the Sign In with Apple Flow.
  ///
  /// Throws a [LogInWithAppleFailure] if an exception occurs.
  Future<void> logInWithApple() async {
    try {
      await _authenticationClient.logInWithApple();
    } on LogInWithAppleFailure {
      rethrow;
    } catch (error, stackTrace) {
      throw LogInWithAppleFailure(error, stackTrace);
    }
  }

  /// Starts the Sign In with Google Flow.
  ///
  /// Throws a [LogInWithGoogleCanceled] if the flow is canceled by the user.
  /// Throws a [LogInWithEmailAndPasswordFailure] if an exception occurs.
  Future<void> logInWithGoogle() async {
    try {
      await _authenticationClient.logInWithGoogle();
    } on LogInWithGoogleFailure {
      rethrow;
    } on LogInWithGoogleCanceled {
      rethrow;
    } catch (error, stackTrace) {
      throw LogInWithGoogleFailure(error, stackTrace);
    }
  }

  /// Signs in with the provided [email] and [password].
  ///
  /// Throws a [LogInWithEmailAndPasswordFailure] if an exception occurs.
  Future<void> logInWithEmailAndPassword({
    required String email,
    required String password,
  }) async {
    try {
      await _authenticationClient.logInWithEmailAndPassword(
        email: email,
        password: password,
      );
    } on LogInWithEmailAndPasswordIncorrectCredentialsFailure {
      rethrow;
    } on LogInWithEmailAndPasswordFailure {
      rethrow;
    } on LogInConnectionFailure {
      rethrow;
    } on AuthenticationException {
      rethrow;
    } catch (error, stackTrace) {
      throw LogInWithEmailAndPasswordFailure(error, stackTrace);
    }
  }

  /// Signs out the current user which will emit
  /// [GLUser.anonymous] from the [user] Stream.
  ///
  /// Throws a [LogOutFailure] if an exception occurs.
  Future<void> logOut() async {
    try {
      await _authenticationClient.logOut();
      // await _databaseClient.clear();
    } on LogOutFailure {
      rethrow;
    } catch (error, stackTrace) {
      throw LogOutFailure(error, stackTrace);
    }
  }

  ////
  Future<void> reAuthenticateForDeleteAccount({
    required String password,
  }) async {
    try {
      await _authenticationClient.reAuthenticateForDeleteAccount(
        password: password,
      );
    } on LogInWithEmailAndPasswordFailure {
      rethrow;
    } catch (error, stackTrace) {
      throw LogInWithEmailAndPasswordFailure(error, stackTrace);
    }
  }

  /// Initiates an account deletion process
  /// and signs out the current user
  ///
  /// Throws a [LogOutFailure] if an exception occurs.
  Future<void> deleteAccount({required String registrationMethod}) async {
    try {
      await _authenticationClient.deleteAccount(
        registrationMethod: registrationMethod,
      );
    } on DeleteAccountFailure {
      rethrow;
    } catch (error, stackTrace) {
      throw DeleteAccountFailure(error, stackTrace);
    }
  }

  Future<void> deleteUser() async {
    await _authenticationClient.deleteUser();
  }

  Future<AuthUser> createUserWithEmailAndPassword({
    required String email,
    required String password,
  }) async {
    try {
      return _authenticationClient.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );
    } on AuthenticationException catch (e, s) {
      rethrow;
    }
  }

  Future<void> updateUser({
    required String name,
    required String password,
  }) async {
    try {
      return _authenticationClient.updateUser(name: name, password: password);
    } on AuthenticationException catch (e, s) {
      rethrow;
    }
  }
}

extension on AuthUser {
  GLUserDb get toDbUser {
    final name = accountType?.name;
    return GLUserDb(
      id: id,
      accountType: name != null ? AccountTypeDbX.fromString(name) : null,
      registrationMethod: registrationMethod.toString(),
      email: email,
      name: name,
      emailVerified: emailVerified,
      avatarUrl: avatarUrl,
      finishedRegistration: finishedRegistration,
    );
  }
}

extension on GLUserDb {
  GLUser toUser() {
    final type = accountType?.name;
    return GLUser(
      id: id!,
      accountType: type != null ? AccountTypeX.fromString(type) : null,
      email: email,
      name: name,
      finishedRegistration: finishedRegistration,
      emailVerified: emailVerified,
      avatarUrl: avatarUrl,
    );
  }
}
