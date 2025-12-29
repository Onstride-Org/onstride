void main() {}
// // ignore_for_file: prefer_const_constructors

// import 'package:authentication_client/authentication_client.dart';
// import 'package:database_client/database_client.dart';
// import 'package:mocktail/mocktail.dart';
// import 'package:models/models.dart';
// import 'package:test/test.dart';
// import 'package:user_repository/user_repository.dart';

// class MockAuthenticationClient extends Mock implements 
//AuthenticationClient {}

// class FakeSignUpFailure extends Fake implements SignUpFailure {}

// class FakeSignUpEmailInUseFailure extends Fake
//     implements SignUpEmailInUseFailure {}

// class FakeResetPasswordFailure extends Fake implements
// ResetPasswordFailure {}

// class FakeLogInWithAppleFailure extends Fake implements 
//LogInWithAppleFailure {}

// class FakeLogInWithGoogleFailure extends Fake
//     implements LogInWithGoogleFailure {}

// class FakeLogInWithGoogleCanceled extends Fake
//     implements LogInWithGoogleCanceled {}

// class FakeLogInWithEmailAndPasswordFailure extends Fake
//     implements LogInWithEmailAndPasswordFailure {}

// class FakeLogInWithEmailAndPasswordIncorrectCredentialsFailure extends Fake
//     implements LogInWithEmailAndPasswordIncorrectCredentialsFailure {}

// class FakeLogOutFailure extends Fake implements LogOutFailure {}

// class MockDatabaseClient extends Mock implements DatabaseClient {}

// class MockUserResource extends Mock implements UserResource {}

// void main() {
//   group('UserRepository', () {
//     late AuthenticationClient authenticationClient;
//     late UserRepository userRepository;
//     late DatabaseClient databaseClient;
//     late UserResource userResource;
//     final user = User(
//       id: 'id',
//       type: AccountType.instructor,
//       email: 'email',
//       firstName: 'firstName',
//       lastName: 'lastName',
//       photo: 'http://image.com/image.jpg',
//     );
//     final authUser = AuthUser(
//       id: 'id',
//       type: UserType.coach,
//       email: 'email',
//       firstName: 'firstName',
//       lastName: 'lastName',
//       photo: 'http://image.com/image.jpg',
//     );
//     final userDb = UserDbModel(
//       id: 'id',
//       type: 0,
//       email: 'email',
//       firstName: 'firstName',
//       lastName: 'lastName',
//       photo: 'http://image.com/image.jpg',
//     );

//     setUpAll(() {
//       registerFallbackValue(User.anonymous);
//       registerFallbackValue(userDb);
//     });

//     setUp(() {
//       authenticationClient = MockAuthenticationClient();
//       databaseClient = MockDatabaseClient();
//       userResource = MockUserResource();
//       when(() => databaseClient.userResource).thenReturn(userResource);
//       when(() => userResource.saveUser(any())).thenAnswer((_) async {});
//       when(() => userResource.deleteUser()).thenAnswer((_) async {});

//       userRepository = UserRepository(
//         databaseClient: databaseClient,
//         authenticationClient: authenticationClient,
//       );
//     });

//     group('user', () {
//       test('calls user on AuthenticationClient and UserResource', () {
//         when(() => authenticationClient.user).thenAnswer(
//           (_) => const Stream.empty(),
//         );
//         when(() => userResource.currentUser()).thenAnswer(
//           (_) => Stream.value(null),
//         );
//         expect(
//           userRepository.user,
//           emits(User.anonymous),
//         );
//         verify(() => authenticationClient.user).called(1);
//         verify(() => userResource.currentUser()).called(1);
//       });

//       test('emits User when database stores an existing user', () {
//         when(() => authenticationClient.user).thenAnswer(
//           (_) => const Stream.empty(),
//         );
//         when(() => userResource.currentUser()).thenAnswer(
//           (_) => Stream.value(userDb),
//         );
//         expect(
//           userRepository.user,
//           emits(user),
//         );
//       });

//       test('emits distinct Users from database', () {
//         when(() => authenticationClient.user).thenAnswer(
//           (_) => const Stream.empty(),
//         );
//         when(() => userResource.currentUser()).thenAnswer(
//           (_) => Stream.fromIterable([userDb, userDb]),
//         );
//         expect(
//           userRepository.user,
//           emits(user),
//         );
//       });

//       test('calls userResource.saveUser when api returns the user', 
//() async {
//         when(() => authenticationClient.user).thenAnswer(
//           (_) => Stream.value(authUser),
//         );
//         when(() => userResource.currentUser()).thenAnswer(
//           (_) => Stream.value(null),
//         );
//         userRepository.user;
//         await Future<void>.delayed(Duration.zero);
//         verify(() => userResource.saveUser(any()));
//       });

//       test(
//           'calls userResource.deleteUser and _databaseClient.clear() '
//           'when api returns the User.anonymous', () async {
//         when(() => authenticationClient.user).thenAnswer(
//           (_) => Stream.value(AuthUser.anonymous),
//         );
//         when(() => userResource.currentUser()).thenAnswer(
//           (_) => Stream.value(null),
//         );
//         userRepository.user;
//         await Future<void>.delayed(Duration.zero);
//         verify(() => userResource.deleteUser()).called(1);
//       });

//       test('calls userResource.switchCurrentAcademy', () {
//         when(() => authenticationClient
//.switchCoachAcademy(academyId: 'FORE'))
//             .thenAnswer(
//           (_) => Future.value(),
//         );
//         userRepository.switchCurrentAcademy(academyId: 'FORE');
//         verify(() => authenticationClient
//.switchCoachAcademy(academyId: 'FORE'))
//             .called(1);
//       });

//       test('calls userResource.switchCurrentAcademy', () async {
//         when(() => authenticationClient
//.switchCoachAcademy(academyId: 'FORE'))
//             .thenThrow(
//           (_) => SwitchAcademyFailure('ERROR', StackTrace.fromString('')),
//         );

//         try {
//           await userRepository.switchCurrentAcademy(academyId: 'FORE');
//         } catch (e) {
//           expect(e, isA<SwitchAcademyFailure>());
//         }
//       });
//     });

//     group('refreshUser', () {
//       test('accesses the first user of the authenticationClient.user', () {
//         when(() => authenticationClient.user).thenAnswer(
//           (_) => Stream.value(authUser),
//         );
//         userRepository.refreshUser();

//         verify(() => authenticationClient.user).called(1);
//       });
//     });

//     group('signUp', () {
//       test(
//           'calls AuthenticationClient signUp '
//           'with email and password', () async {
//         when(
//           () => authenticationClient.signUp(
//             email: any(named: 'email'),
//             password: any(named: 'password'),
//             name: any(named: 'name'),
//           ),
//         ).thenAnswer((_) async {});
//         await userRepository.signUp(
//           email: 'ben_franklin@upenn.edu',
//           password: 'BenFranklin123',
//           name: 'name',
//         );
//         verify(
//           () => authenticationClient.signUp(
//             email: any(named: 'email'),
//             password: any(named: 'password'),
//             name: any(named: 'name'),
//           ),
//         ).called(1);
//       });

//       test('rethrows SignUpFailure', () async {
//         final exception = FakeSignUpFailure();
//         when(
//           () => authenticationClient.signUp(
//             email: any(named: 'email'),
//             password: any(named: 'password'),
//             name: any(named: 'name'),
//           ),
//         ).thenThrow(exception);
//         expect(
//           () => userRepository.signUp(
//             email: 'ben_franklin@upenn.edu',
//             password: 'BenFranklin123',
//             name: 'name',
//           ),
//           throwsA(exception),
//         );
//       });

//       test('throws SignUpFailure on generic exception', () async {
//         when(
//           () => authenticationClient.signUp(
//             email: any(named: 'email'),
//             password: any(named: 'password'),
//             name: any(named: 'name'),
//           ),
//         ).thenThrow(Exception());
//         expect(
//           () => userRepository.signUp(
//             email: 'ben_franklin@upenn.edu',
//             password: 'BenFranklin123',
//             name: 'name',
//           ),
//           throwsA(isA<SignUpFailure>()),
//         );
//       });

//       test(
//         'throws SignUpEmailInUseFailure on SignUpEmailInUseFailure',
//         () async {
//           when(
//             () => authenticationClient.signUp(
//               email: any(named: 'email'),
//               password: any(named: 'password'),
//               name: any(named: 'name'),
//             ),
//           ).thenThrow(FakeSignUpEmailInUseFailure());
//           expect(
//             () => userRepository.signUp(
//               email: 'ben_franklin@upenn.edu',
//               password: 'BenFranklin123',
//               name: 'name',
//             ),
//             throwsA(isA<SignUpEmailInUseFailure>()),
//           );
//         },
//       );
//     });

//     group('sendPasswordResetEmail', () {
//       test('calls sendPasswordResetEmail with email on AuthenticationClient',
//           () async {
//         when(
//           () => authenticationClient.sendPasswordResetEmail(
//             email: any(named: 'email'),
//           ),
//         ).thenAnswer((_) async {});
//         await userRepository.sendPasswordResetEmail(
//           email: 'ben_franklin@upenn.edu',
//         );
//         verify(
//           () => authenticationClient.sendPasswordResetEmail(
//             email: any(named: 'email'),
//           ),
//         ).called(1);
//       });

//       test('rethrows ResetPasswordFailure', () async {
//         final exception = FakeResetPasswordFailure();
//         when(
//           () => authenticationClient.sendPasswordResetEmail(
//             email: any(named: 'email'),
//           ),
//         ).thenThrow(exception);
//         expect(
//           () => userRepository.sendPasswordResetEmail(
//             email: 'ben_franklin@upenn.edu',
//           ),
//           throwsA(exception),
//         );
//       });

//       test('throws ResetPasswordFailure on generic exception', () async {
//         when(
//           () => authenticationClient.sendPasswordResetEmail(
//             email: any(named: 'email'),
//           ),
//         ).thenThrow(Exception());
//         expect(
//           () => userRepository.sendPasswordResetEmail(
//             email: 'ben_franklin@upenn.edu',
//           ),
//           throwsA(isA<ResetPasswordFailure>()),
//         );
//       });
//     });

//     group('logInWithApple', () {
//       test('calls logInWithApple on AuthenticationClient', () async {
//         when(
//           () => authenticationClient.logInWithApple(),
//         ).thenAnswer((_) async {});
//         await userRepository.logInWithApple();
//         verify(() => authenticationClient.logInWithApple()).called(1);
//       });

//       test('rethrows LogInWithAppleFailure', () async {
//         final exception = FakeLogInWithAppleFailure();
//         when(
//           () => authenticationClient.logInWithApple(),
//         ).thenThrow(exception);
//         expect(
//           () => userRepository.logInWithApple(),
//           throwsA(exception),
//         );
//       });

//       test('throws LogInWithAppleFailure on generic exception', () async {
//         when(
//           () => authenticationClient.logInWithApple(),
//         ).thenThrow(Exception());
//         expect(
//           () => userRepository.logInWithApple(),
//           throwsA(isA<LogInWithAppleFailure>()),
//         );
//       });
//     });

//     group('logInWithGoogle', () {
//       test('calls logInWithGoogle on AuthenticationClient', () async {
//         when(
//           () => authenticationClient.logInWithGoogle(),
//         ).thenAnswer((_) async {});
//         await userRepository.logInWithGoogle();
//         verify(() => authenticationClient.logInWithGoogle()).called(1);
//       });

//       test('rethrows LogInWithGoogleFailure', () async {
//         final exception = FakeLogInWithGoogleFailure();
//         when(() => authenticationClient.logInWithGoogle())
// .thenThrow(exception);
//         expect(() => userRepository.logInWithGoogle(), throwsA(exception));
//       });

//       test('rethrows LogInWithGoogleCanceled', () async {
//         final exception = FakeLogInWithGoogleCanceled();
//         when(() => authenticationClient.logInWithGoogle())
// .thenThrow(exception);
//         expect(() => userRepository.logInWithGoogle(), throwsA(exception));
//       });

//       test('throws LogInWithGoogleFailure on generic exception', () async {
//         when(
//           () => authenticationClient.logInWithGoogle(),
//         ).thenThrow(Exception());
//         expect(
//           () => userRepository.logInWithGoogle(),
//           throwsA(isA<LogInWithGoogleFailure>()),
//         );
//       });
//     });

//     group('logInWithEmailAndPassWord', () {
//       test(
//           'calls logInWithEmailAndPassWord '
//           'with email and password on AuthenticationClient', () async {
//         when(
//           () => authenticationClient.logInWithEmailAndPassword(
//             email: any(named: 'email'),
//             password: any(named: 'password'),
//           ),
//         ).thenAnswer((_) async {});
//         await userRepository.logInWithEmailAndPassword(
//           email: 'ben_franklin@upenn.edu',
//           password: 'BenFranklin123',
//         );
//         verify(
//           () => authenticationClient.logInWithEmailAndPassword(
//             email: any(named: 'email'),
//             password: any(named: 'password'),
//           ),
//         ).called(1);
//       });

//       test('rethrows LogInWithEmailAndPasswordFailure', () async {
//         final exception = FakeLogInWithEmailAndPasswordFailure();
//         when(
//           () => authenticationClient.logInWithEmailAndPassword(
//             email: any(named: 'email'),
//             password: any(named: 'password'),
//           ),
//         ).thenThrow(exception);
//         expect(
//           () => userRepository.logInWithEmailAndPassword(
//             email: 'ben_franklin@upenn.edu',
//             password: 'BenFranklin123',
//           ),
//           throwsA(exception),
//         );
//       });

//       test('rethrows LogInWithEmailAndPasswordIncorrectCredentialsFailure',
//           () async {
//         final exception =
//             FakeLogInWithEmailAndPasswordIncorrectCredentialsFailure();
//         when(
//           () => authenticationClient.logInWithEmailAndPassword(
//             email: any(named: 'email'),
//             password: any(named: 'password'),
//           ),
//         ).thenThrow(exception);
//         expect(
//           () => userRepository.logInWithEmailAndPassword(
//             email: 'ben_franklin@upenn.edu',
//             password: 'BenFranklin123',
//           ),
//           throwsA(exception),
//         );
//       });

//       test(
//           'throws LogInWithEmailAndPasswordFailure '
//           'on generic exception', () async {
//         when(
//           () => authenticationClient.logInWithEmailAndPassword(
//             email: any(named: 'email'),
//             password: any(named: 'password'),
//           ),
//         ).thenThrow(Exception());
//         expect(
//           () => userRepository.logInWithEmailAndPassword(
//             email: 'ben_franklin@upenn.edu',
//             password: 'BenFranklin123',
//           ),
//           throwsA(isA<LogInWithEmailAndPasswordFailure>()),
//         );
//       });
//     });

//     group('logOut', () {
//       test('calls logOut on AuthenticationClient', () async {
//         when(() => authenticationClient.logOut()).thenAnswer((_) async {});
//         await userRepository.logOut();
//         verify(() => authenticationClient.logOut()).called(1);
//       });

//       test('calls clear on DatabaseClient', () async {
//         when(() => authenticationClient.logOut()).thenAnswer((_) async {});
//         await userRepository.logOut();
//       });

//       test('rethrows LogOutFailure', () async {
//         final exception = FakeLogOutFailure();
//         when(() => authenticationClient.logOut()).thenThrow(exception);
//         expect(() => userRepository.logOut(), throwsA(exception));
//       });

//       test('throws LogOutFailure on generic exception', () async {
//         when(() => authenticationClient.logOut()).thenThrow(Exception());
//         expect(() => userRepository.logOut(), throwsA(isA<LogOutFailure>()));
//       });
//     });

//     group('deleteAccount', () {
//       test('calls deleteAccount on AuthenticationClient', () async {
//         when(() => authenticationClient.deleteAccount())
//             .thenAnswer((_) async {});
//         await userRepository.deleteAccount();
//         verify(() => authenticationClient.deleteAccount()).called(1);
//       });

//       test('rethrows LogOutFailure', () async {
//         final exception = FakeLogOutFailure();
//         when(() => authenticationClient.deleteAccount())
// .thenThrow(exception);
//         expect(() => userRepository.deleteAccount(), throwsA(exception));
//       });

//       test('throws LogOutFailure on generic exception', () async {
//         when(() => authenticationClient.deleteAccount())
// .thenThrow(Exception());
//         expect(
//           () => userRepository.deleteAccount(),
//           throwsA(
//             isA<LogOutFailure>(),
//           ),
//         );
//       });
//     });

//     group('sendVerificationEmail', () {
//       test('calls sendVerificationEmail with email on AuthenticationClient',
//           () async {
//         when(
//           () => authenticationClient.sendVerificationEmail(
//             email: any(named: 'email'),
//           ),
//         ).thenAnswer((_) async {
//           return '';
//         });
//         await userRepository.sendVerificationEmail(
//           email: 'ben_franklin@upenn.edu',
//         );
//         verify(
//           () => authenticationClient.sendVerificationEmail(
//             email: any(named: 'email'),
//           ),
//         ).called(1);
//       });

//       test('rethrows SendVerificationEmailFailure', () async {
//         final exception = SendVerificationEmailFailure(
//           'Error',
//           StackTrace.fromString(
//             'Error',
//           ),
//         );
//         when(
//           () => authenticationClient.sendVerificationEmail(
//             email: any(named: 'email'),
//           ),
//         ).thenThrow(exception);
//         expect(
//           () => userRepository.sendVerificationEmail(
//             email: 'ben_franklin@upenn.edu',
//           ),
//           throwsA(exception),
//         );
//       });

//       test('throws SendVerificationEmailFailure on generic exception',
//           () async {
//         when(
//           () => authenticationClient.sendVerificationEmail(
//             email: any(named: 'email'),
//           ),
//         ).thenThrow(Exception());
//         expect(
//           () => userRepository.sendVerificationEmail(
//             email: 'ben_franklin@upenn.edu',
//           ),
//           throwsA(isA<SendVerificationEmailFailure>()),
//         );
//       });
//     });

//     group('sendVerificationCode', () {
//       test('calls sendVerificationCode with email on AuthenticationClient',
//           () async {
//         when(
//           () => authenticationClient.sendEmailVerificationCode(
//             email: any(named: 'email'),
//             code: any(named: 'code'),
//           ),
//         ).thenAnswer((_) async {});
//         await userRepository.sendEmailVerificationCode(
//           email: 'ben_franklin@upenn.edu',
//           code: 'CODE',
//         );
//         verify(
//           () => authenticationClient.sendEmailVerificationCode(
//             email: any(named: 'email'),
//             code: any(named: 'code'),
//           ),
//         ).called(1);
//       });

//       test('rethrows SendVerificationEmailFailure', () async {
//         final exception = SendVerificationEmailFailure(
//           'Error',
//           StackTrace.fromString(
//             'Error',
//           ),
//         );
//         when(
//           () => authenticationClient.sendEmailVerificationCode(
//             email: any(named: 'email'),
//             code: any(named: 'code'),
//           ),
//         ).thenThrow(exception);
//         expect(
//           () => userRepository.sendEmailVerificationCode(
//             email: 'ben_franklin@upenn.edu',
//             code: 'CODE',
//           ),
//           throwsA(exception),
//         );
//       });

//       test('throws SendVerificationEmailFailure on generic exception',
//           () async {
//         when(
//           () => authenticationClient.sendEmailVerificationCode(
//             email: any(named: 'email'),
//             code: any(named: 'code'),
//           ),
//         ).thenThrow(Exception());
//         expect(
//           () => userRepository.sendEmailVerificationCode(
//             email: 'ben_franklin@upenn.edu',
//             code: 'CODE',
//           ),
//           throwsA(isA<SendVerificationEmailFailure>()),
//         );
//       });
//     });
//   });
// }
