// ignore_for_file: public_member_api_docs

enum RegistrationMethod { email, google, apple, facebook }

extension RegistrationMethodX on RegistrationMethod {
  String toName() {
    switch (this) {
      case RegistrationMethod.email:
        return 'email';
      case RegistrationMethod.google:
        return 'google';
      case RegistrationMethod.apple:
        return 'apple';
      case RegistrationMethod.facebook:
        return 'facebook';
    }
  }

  static RegistrationMethod fromName(String name) {
    switch (name) {
      case 'email':
        return RegistrationMethod.email;
      case 'google':
        return RegistrationMethod.google;
      case 'apple':
        return RegistrationMethod.apple;
      case 'facebook':
        return RegistrationMethod.facebook;
      default:
        return RegistrationMethod.email;
    }
  }
}
