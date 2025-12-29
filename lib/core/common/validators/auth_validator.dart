/// A utility class that provides common form field validations.
///
/// Includes validators for email, password, phone, and general text input.
class FormValidator {
  const FormValidator._();

  /// Validates an email address.
  ///
  /// Returns [emptyMessage] if the input is null or empty,
  /// and [invalidMessage] if the format is invalid.
  static String? email(
    String? text, {
    required String emptyMessage,
    required String invalidMessage,
  }) {
    if (text == null || text.trim().isEmpty) {
      return emptyMessage;
    }
    if (!_validEmailFormat(text.trim())) {
      return invalidMessage;
    }
    return null;
  }

  /// Returns `true` if the given [text] is a valid email format.
  static bool isValidEmail(String text) {
    if (text.trim().isEmpty) {
      return false;
    }
    return _validEmailFormat(text.trim());
  }

  /// Validates that the password is not empty and meets minimum security.
  ///
  /// Returns [emptyMessage] if the input is empty or null,
  /// and [invalidMessage] if the strength is too weak.
  /// Returns `null` if the password is secure, otherwise returns an error message.
  static String? passwordSecurity(
    String? text, {
    required String? emptyMessage,
    required String invalidMessage,
  }) {
    if (text == null || text.trim().isEmpty) {
      return emptyMessage;
    }

    final trimmed = text.trim();

    final isValid =
        hasMinimumPasswordLength(trimmed) &&
        hasRequiredPasswordCharacters(trimmed);

    return isValid ? null : invalidMessage;
  }

  /// Returns `true` if the password meets all security requirements.
  static bool isValidPassword(String? text) {
    if (text == null || text.trim().isEmpty) {
      return false;
    }

    final trimmed = text.trim();

    return hasMinimumPasswordLength(trimmed) &&
        hasRequiredPasswordCharacters(trimmed);
  }

  /// Validates that two password fields match.
  ///
  /// Returns [emptyMessage] if [value] is empty, or [invalidMessage] if it doesn't match [otherPassword].
  static String? passwordsMatchValidator(
    String? value, {
    required String otherPassword,
    required String? emptyMessage,
    required String? invalidMessage,
  }) {
    final text = value ?? '';
    if (text.isEmpty) {
      return emptyMessage;
    }
    if (otherPassword != text) {
      return invalidMessage;
    }
    return null;
  }

  /// Validates that the provided [text] represents a number between [min] and [max].
  ///
  /// - If [text] is `null` or empty, returns [emptyMessage].
  /// - If [text] cannot be parsed to an integer, returns the result of [invalidMessage].
  /// - If the parsed number is outside the inclusive range `[min, max]`,
  ///   returns the result of [invalidMessage].
  /// - Otherwise, returns `null` to indicate that the value is valid.
  ///
  /// Example:
  /// ```dart
  /// TextFormField(
  ///   validator: (v) => FormValidator.minAndMaxNumber(
  ///     v,
  ///     min: 1,
  ///     max: 50,
  ///     emptyMessage: 'Required',
  ///     invalidMessage: (min, max) => 'The valid range of values is $min to $max',
  ///   ),
  /// )
  /// ```
  static String? minAndMaxNumber(
    String? text, {
    required (int, int) range,
    required String emptyMessage,
    required String Function(int min, int max) invalidMessage,
  }) {
    final min = range.$1;
    final max = range.$2;
    if (text == null || text.trim().isEmpty) {
      return emptyMessage;
    }

    final number = int.tryParse(text.trim());
    if (number == null) {
      return invalidMessage(min, max);
    }

    if (number < min || number > max) {
      return invalidMessage(min, max);
    }

    return null;
  }

  /// Validates a minimum length requirement.
  ///
  /// Returns [emptyMessage] if empty, or [invalidMessage] if length is less than [minLength].

  static String? minLength(
    String? text, {
    required String emptyMessage,
    required String invalidMessage,
    int minLength = 4,
  }) {
    if (text == null || text.trim().isEmpty) {
      return emptyMessage;
    }
    final validLength = text.trim().length >= minLength;
    return validLength ? null : invalidMessage;
  }

  /// Validates that a field is not empty.
  ///
  /// Returns [emptyMessage] if the input is null or empty.
  static String? noEmpty(
    String? text, {
    required String emptyMessage,
  }) {
    if (text == null || text.trim().isEmpty) {
      return emptyMessage;
    }
    return null;
  }

  /// Returns `true` if [phone] is a valid phone number.
  static bool isValidPhone(String phone) {
    final phone2 = FormValidator.phone(
      phone,
      emptyMessage: '',
      invalidMessage: '',
    );
    return phone2 == null;
  }

  /// Validates a phone number format.
  ///
  /// Must start with a `+` followed by exactly 10 digits for US format.
  /// Can contain spaces, dashes, parentheses.
  /// Returns appropriate messages based on validation failure.
  static String? phone(
    String? value, {
    required String emptyMessage,
    required String invalidMessage,
    String? startsWithDialCodeMessage,
  }) {
    if (value == null || value.trim().isEmpty) {
      return emptyMessage;
    }

    final trimmed = value.trim();

    if (!trimmed.startsWith('+')) {
      return startsWithDialCodeMessage ?? invalidMessage;
    }

    final digitsOnly = trimmed.replaceAll(RegExp(r'[\s\-\(\)\+]'), '');

    if (!RegExp(r'^\d+$').hasMatch(digitsOnly)) {
      return invalidMessage;
    }

    // For US format, we expect exactly 10 digits after the country code
    if (digitsOnly.length != 11) {
      return invalidMessage;
    }

    return null;
  }

  /// Checks if an email is in a valid format using regex.
  static bool _validEmailFormat(String email) {
    const Pattern pattern =
        r'^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$';
    final regex = RegExp(pattern as String);
    return regex.hasMatch(email);
  }

  /// Returns `true` if the password has at least one uppercase, lowercase, number and special character.
  static bool hasRequiredPasswordCharacters(String text) {
    final hasUppercase = RegExp('[A-Z]').hasMatch(text);
    final hasLowercase = RegExp('[a-z]').hasMatch(text);
    final hasNumber = RegExp('[0-9]').hasMatch(text);
    final hasSpecialChar = RegExp(r'[!@#\$&*~.,;:_\-]').hasMatch(text);

    return hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
  }

  /// Returns `true` if the password has at least the required minimum length.
  static bool hasMinimumPasswordLength(String text, [int minLength = 8]) {
    return text.length >= minLength;
  }
}
