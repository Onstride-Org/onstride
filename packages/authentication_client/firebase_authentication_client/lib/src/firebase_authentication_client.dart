import 'dart:developer';

import 'package:authentication_client/authentication_client.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;
import 'package:google_sign_in/google_sign_in.dart';
import 'package:rxdart/rxdart.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

/// Signature for [SignInWithApple.getAppleIDCredential].
typedef GetAppleCredentials =
    Future<AuthorizationCredentialAppleID> Function({
      required List<AppleIDAuthorizationScopes> scopes,
      WebAuthenticationOptions webAuthenticationOptions,
      String nonce,
      String state,
    });

/// {@template firebase_authentication_client}
/// A Firebase implementation of the [AuthenticationClient] interface.
/// {@endtemplate}
class FirebaseAuthenticationClient implements AuthenticationClient {
  /// {@macro firebase_authentication_client}
  FirebaseAuthenticationClient()
    : _firebaseAuth = firebase_auth.FirebaseAuth.instance,
      _googleSignIn = GoogleSignIn.standard(),
      _firestore = FirebaseFirestore.instance,
      _getAppleCredentials = SignInWithApple.getAppleIDCredential;

  final firebase_auth.FirebaseAuth _firebaseAuth;
  final GoogleSignIn _googleSignIn;
  final FirebaseFirestore _firestore;
  final GetAppleCredentials _getAppleCredentials;
  final BehaviorSubject<AuthUser> _userStream = BehaviorSubject<AuthUser>();

  /// Stream of [AuthUser] which will emit the current user when
  /// the authentication state changes.
  ///
  /// Emits [AuthUser.anonymous] if the user is not authenticated.
  @override
  Stream<AuthUser> get user {
    return _firebaseAuth.authStateChanges().map((firebaseUser) {
      return firebaseUser == null ? AuthUser.anonymous : firebaseUser.toUser();
    });
  }

  /// Creates a new user with the provided [email] and [password].
  ///
  /// Throws:
  /// - [SignUpEmailInUseFailure] when [email] is already in use.
  /// - [SignUpInvalidEmailFailure] when [email] is invalid.
  /// - [SignUpOperationNotAllowedFailure] when operation is not allowed.
  /// - [SignUpWeakPasswordFailure] when [password] is too weak.
  /// - [SignUpFailure] when unknown error occurs.
  @override
  Future<String?> signUp({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _firebaseAuth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );

      return response.user?.uid;
    } on firebase_auth.FirebaseAuthException catch (error, stackTrace) {
      switch (error.code) {
        case 'email-already-in-use':
          throw SignUpEmailInUseFailure(error, stackTrace);
        case 'invalid-email':
          throw SignUpInvalidEmailFailure(error, stackTrace);
        case 'operation-not-allowed':
          throw SignUpOperationNotAllowedFailure(error, stackTrace);
        case 'weak-password':
          throw SignUpWeakPasswordFailure(error, stackTrace);
        case 'network-request-failed':
          throw SignUpConnectionFailure(error, stackTrace);
        default:
          throw SignUpFailure(error, stackTrace);
      }
    } catch (error, stackTrace) {
      throw SignUpFailure(error, stackTrace);
    }
  }

  /// Sends a password reset link to the provided [email].
  ///
  /// Throws:
  /// - [ResetPasswordInvalidEmailFailure] when [email] is invalid.
  /// - [ResetPasswordUserNotFoundFailure] when user with [email] is not found.
  /// - [ResetPasswordFailure] when unknown error occurs.
  @override
  Future<void> sendPasswordResetEmail({required String email}) async {
    try {
      await _firebaseAuth.sendPasswordResetEmail(email: email);
    } on firebase_auth.FirebaseAuthException catch (error, stackTrace) {
      switch (error.code) {
        case 'invalid-email':
          throw ResetPasswordInvalidEmailFailure(error, stackTrace);
        case 'user-not-found':
          throw ResetPasswordUserNotFoundFailure(error, stackTrace);
        default:
          throw ResetPasswordFailure(error, stackTrace);
      }
    } catch (error, stackTrace) {
      throw ResetPasswordFailure(error, stackTrace);
    }
  }

  /// Sends a verification email to the provided [email].
  ///
  /// Throws:
  /// - [SendVerificationEmailInvalidEmailFailure] when [email] is invalid.
  /// - [SendVerificationEmailUserNotFoundFailure] when user with [email] is not
  /// found.
  /// - [SendVerificationEmailFailure] when unknown error occurs.
  @override
  Future<String?> sendVerificationEmail({required String email}) async {
    throw UnimplementedError();
  }

  /// Starts the Sign In with Apple Flow.
  ///
  /// Throws a [LogInWithAppleFailure] if an exception occurs.
  @override
  Future<void> logInWithApple() async {
    try {
      final appleIdCredential = await _getAppleCredentials(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
      );
      final oAuthProvider = firebase_auth.OAuthProvider('apple.com');
      final credential = oAuthProvider.credential(
        idToken: appleIdCredential.identityToken,
        accessToken: appleIdCredential.authorizationCode,
      );
      await _firebaseAuth.signInWithCredential(credential);
    } catch (error, stackTrace) {
      throw LogInWithAppleFailure(error, stackTrace);
    }
  }

  /// Starts the Sign In with Google Flow.
  ///
  /// Throws a [LogInWithGoogleCanceled] if the flow is canceled by the user.
  /// Throws a [LogInWithEmailAndPasswordFailure] if an exception occurs.
  @override
  Future<void> logInWithGoogle() async {
    try {
      final googleUser = await _googleSignIn.signIn();
      if (googleUser == null) {
        throw LogInWithGoogleCanceled(
          Exception('Sign in with Google canceled'),
          StackTrace.current,
        );
      }
      final googleAuth = await googleUser.authentication;
      final credential = firebase_auth.GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );
      await _firebaseAuth.signInWithCredential(credential);
    } on LogInWithGoogleCanceled {
      rethrow;
    } catch (error, stackTrace) {
      throw LogInWithGoogleFailure(error, stackTrace);
    }
  }

  /// Signs in with the provided [email] and [password].
  ///
  /// Throws a [LogInWithEmailAndPasswordFailure] if an exception occurs.
  @override
  Future<void> logInWithEmailAndPassword({
    required String email,
    required String password,
  }) async {
    try {
      await _firebaseAuth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
    } on firebase_auth.FirebaseAuthException catch (e, stackTrace) {
      if ('invalid-credential' == e.code) {
        try {
          final res = await _firestore.collection('users').doc(email).get();
          if (res.exists) {
            final data = res.data();
            if (data?['password'] == password) {
              throw UserNeedCompleteTheirAccountException(e, stackTrace, data!);
            }
          }
        } on FirebaseException catch (_, _) {
          throw AuthenticationException.fromFirebaseCode(e.code, e, stackTrace);
        }
      }
      throw AuthenticationException.fromFirebaseCode(e.code, e, stackTrace);
    }
  }

  /// Signs out the current user which will emit
  /// [AuthUser.anonymous] from the [user] Stream.
  ///
  /// Throws a [LogOutFailure] if an exception occurs.
  @override
  Future<void> logOut() async {
    try {
      await Future.wait([_firebaseAuth.signOut(), _googleSignIn.signOut()]);
      _userStream.add(AuthUser.anonymous);
    } catch (error, stackTrace) {
      throw LogOutFailure(error, stackTrace);
    }
  }

  @override
  Future<void> deleteAccount({required String registrationMethod}) async {
    try {
      final user = _firebaseAuth.currentUser;
      if (registrationMethod == 'google') {
        await _googleSignIn.signInSilently(reAuthenticate: true);
      }
      // _firebaseAuth
      if (user != null) {
        await user.delete();
      }
    } catch (error, stackTrace) {
      throw DeleteAccountFailure(error, stackTrace);
    }
  }

  @override
  Future<void> sendEmailVerificationCode({
    required String email,
    required String code,
  }) {
    throw UnimplementedError();
  }

  @override
  Future<void> reAuthenticateForDeleteAccount({
    required String password,
  }) async {
    try {
      final user = _firebaseAuth.currentUser;

      // Create credential for re-authentication
      final credential = firebase_auth.EmailAuthProvider.credential(
        email: user?.email ?? '',
        password: password,
      );

      await user?.reauthenticateWithCredential(credential);
    } catch (error, stackTrace) {
      throw LogInWithEmailAndPasswordFailure(error, stackTrace);
    }
  }

  @override
  Future<AuthUser> createUserWithEmailAndPassword({
    required String email,
    required String password,
  }) async {
    try {
      final credential = await _firebaseAuth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );
      final user = credential.user;
      if (user == null) {
        throw AuthUnknownException(
          null,
          StackTrace.empty,
          'Credential user is null${credential.additionalUserInfo}',
        );
      }

      return AuthUser(
        id: user.uid,
        email: email,
        registrationMethod: 'email',
        name: user.displayName,
        avatarUrl: user.photoURL,
        emailVerified: user.emailVerified,
      );
    } on firebase_auth.FirebaseAuthException catch (e, s) {
      throw AuthenticationException.fromFirebaseCode(e.code, e, s);
    }
  }

  @override
  Future<void> updateUser({
    required String name,
    required String password,
  }) async {
    try {
      await _firebaseAuth.currentUser?.updatePassword(password);
      await _firebaseAuth.currentUser?.updateDisplayName(name);
    } on firebase_auth.FirebaseAuthException catch (e, s) {
      log('Error', error: e, stackTrace: s);
      throw AuthenticationException.fromFirebaseCode(e.code, e, s);
    }
  }

  @override
  Future<void> deleteUser() async {
    try {
      await _firebaseAuth.currentUser?.delete();
    } on firebase_auth.FirebaseAuthException catch (e, s) {
      log('Error', error: e, stackTrace: s);
      throw AuthenticationException.fromFirebaseCode(e.code, e, s);
    }
  }

  // @override
  // Future<void> finishRegistration({
  //   required String email,
  //   required String firstName,
  //   required String lastName,
  // }) async {
  //   try {
  //     await _firebase.collection('users').doc(email).set({
  //       'first_name': firstName,
  //       'last_name': lastName,
  //       'email': email,
  //       'account_type': 'user',
  //     });
  //     await _fetchAndUpdateUser(email: email);
  //   } catch (err) {
  //     rethrow;
  //   }
  // }

  // @override
  // Future<void> updateUser({
  //   required AuthUser user,
  // }) async {
  //   try {
  //     // var avatarUrl = user.avatarUrl;
  //     // if (profilePicture != null) {
  //     //   avatarUrl = await saveProfilePicture(
  //     //       email: user.email!, picture: profilePicture);
  //     // }
  //     await _firebase.collection('users').doc(user.email).set({
  //       'first_name': user.firstName,
  //       'last_name': user.lastName,
  //       'email': user.email,
  //       'account_type': user.accountType.toValueString(),
  //       'avatar_url': user.avatarUrl,
  //     });
  //     await _fetchAndUpdateUser(email: user.email);
  //   } catch (err, stack) {
  //     throw UpdateUserFailure(err, stack);
  //   }
  // }

  ///Save the profile picture in given bucket and return the download url
  ///this could be done in another repository if its not done in firebase
  // Future<String> saveProfilePicture({
  //   required String email,
  //   required File picture,
  // }) async {
  //   try {
  //     final snapshot = await _firebaseStorage
  //         .ref()
  //         .child('images/users/$email')
  //         .putFile(picture);
  //     return await snapshot.ref.getDownloadURL();
  //   } on FirebaseException catch (err, stack) {
  //     throw UpdateUserFailure(err, stack);
  //   } catch (err, stack) {
  //     throw UpdateUserFailure(err, stack);
  //   }
  // }
}

extension on firebase_auth.User {
  AuthUser toUser() {
    return AuthUser(
      id: uid,
      email: email,
      name: displayName,
      avatarUrl: photoURL,
      accountType: AuthAccountType.owner,
    );
  }
}
