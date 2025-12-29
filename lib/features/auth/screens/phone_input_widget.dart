import 'package:flutter/material.dart';
import 'package:gl_horses/core/core.dart';
import 'package:intl_phone_number_input/intl_phone_number_input.dart';

class PhoneInputState {
  PhoneNumber initialPhoneNumber = PhoneNumber(isoCode: 'US');

  Future<void> hydrateFromE164(
    String phoneE164,
    TextEditingController controller,
  ) async {
    final number = await PhoneNumber.getRegionInfoFromPhoneNumber(phoneE164);
    initialPhoneNumber = number;
    controller.text = number.parseNumber();
  }
}

Widget buildPhoneInput({
  required Key key,
  required PhoneInputState state,
  required TextEditingController textController,
  required void Function(String phoneNumber) onInputChanged,
  required void Function(bool isValid) onInputValidated,
  required String? Function(String?) validator,
}) {
  return InternationalPhoneNumberInput(
    key: key,
    initialValue: state.initialPhoneNumber,
    textFieldController: textController,
    selectorConfig: const SelectorConfig(
      selectorType: PhoneInputSelectorType.BOTTOM_SHEET,
      useEmoji: true,
      leadingPadding: 12,
      setSelectorButtonAsPrefixIcon: true,
    ),
    inputDecoration: const InputDecoration(hintText: phoneHintText),
    autoValidateMode: AutovalidateMode.onUserInteraction,
    onInputChanged: (PhoneNumber number) {
      onInputChanged(number.phoneNumber ?? '');
    },
    onInputValidated: onInputValidated,
    validator: validator,
  );
}
