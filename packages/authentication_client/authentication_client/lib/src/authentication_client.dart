import 'dart:async';

import 'package:authentication_client/authentication_client.dart';

/// A generic Authentication Client Interface.
abstract class AuthenticationClient {
  /// Stream of [AuthUser] which will emit the current user when
  /// the authentication state changes.
  ///
  /// Emits [AuthUser.anonymous] if the user is not authenticated.
  Stream<AuthUser> get user;

  /// Creates a new user with the provided [email], [password].
  ///
  /// Throws a [SignUpFailure] if an exception occurs.
  Future<String?> signUp({required String email, required String password});

  /// Sends a password reset link to the provided email
  ///
  /// Throws a [ResetPasswordFailure] if an exception occurs.
  Future<void> sendPasswordResetEmail({required String email});

  /// Sends a verification email to the provided email
  ///
  /// Throws a [SendVerificationEmailFailure] if an exception occurs.
  Future<String?> sendVerificationEmail({required String email});

  /// Throws a [SendVerificationEmailFailure] if an exception occurs.
  Future<void> sendEmailVerificationCode({
    required String email,
    required String code,
  });

  /// Starts the Sign In with Apple Flow.
  ///
  /// Throws a [LogInWithAppleFailure] if an exception occurs.
  Future<void> logInWithApple();

  /// Starts the Sign In with Google Flow.
  ///
  /// Throws a [LogInWithGoogleFailure] if an exception occurs.
  Future<void> logInWithGoogle();

  /// Signs in with the provided [email] and [password].
  ///
  /// Throws a [LogInWithEmailAndPasswordFailure] if an exception occurs.
  Future<void> logInWithEmailAndPassword({
    required String email,
    required String password,
    // required bool asCoach,
  });

  /// Signs out the current user which will emit
  /// [AuthUser.anonymous] from the [user] Stream.
  ///
  /// Throws a [LogOutFailure] if an exception occurs.
  Future<void> logOut();

  /// Re-authenticates the current user with the provided [password].
  ///
  /// Throws a [LogInWithEmailAndPasswordFailure] if an exception occurs.
  Future<void> reAuthenticateForDeleteAccount({required String password});

  /// Initiates an account deletion process
  /// and signs out the current user
  ///
  /// Throws a [LogOutFailure] if an exception occurs.
  Future<void> deleteAccount({required String registrationMethod});

  Future<AuthUser> createUserWithEmailAndPassword({
    required String email,
    required String password,
  });

  Future<void> updateUser({required String name, required String password});

  Future<void> deleteUser();
}
