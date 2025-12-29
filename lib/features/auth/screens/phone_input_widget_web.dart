import 'package:flutter/material.dart';
import 'package:gl_horses/core/core.dart';

class PhoneInputState {
  String countryCode = '+1';

  Future<void> hydrateFromE164(
    String phoneE164,
    TextEditingController controller,
  ) async {
    // Simple parsing for web - extract country code and number
    if (phoneE164.startsWith('+1')) {
      countryCode = '+1';
      controller.text = phoneE164.substring(2);
    } else if (phoneE164.startsWith('+')) {
      // Try to extract first 2-3 digits as country code
      countryCode = phoneE164.substring(0, 3);
      controller.text = phoneE164.substring(3);
    } else {
      controller.text = phoneE164;
    }
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
  return _WebPhoneInput(
    key: key,
    state: state,
    textController: textController,
    onInputChanged: onInputChanged,
    onInputValidated: onInputValidated,
    validator: validator,
  );
}

class _WebPhoneInput extends StatefulWidget {
  const _WebPhoneInput({
    super.key,
    required this.state,
    required this.textController,
    required this.onInputChanged,
    required this.onInputValidated,
    required this.validator,
  });

  final PhoneInputState state;
  final TextEditingController textController;
  final void Function(String phoneNumber) onInputChanged;
  final void Function(bool isValid) onInputValidated;
  final String? Function(String?) validator;

  @override
  State<_WebPhoneInput> createState() => _WebPhoneInputState();
}

class _WebPhoneInputState extends State<_WebPhoneInput> {
  late String _selectedCountryCode;

  static const _countryCodes = [
    ('+1', 'US'),
    ('+44', 'UK'),
    ('+52', 'MX'),
    ('+33', 'FR'),
    ('+49', 'DE'),
    ('+34', 'ES'),
    ('+39', 'IT'),
    ('+81', 'JP'),
    ('+86', 'CN'),
    ('+91', 'IN'),
    ('+61', 'AU'),
    ('+55', 'BR'),
  ];

  @override
  void initState() {
    super.initState();
    _selectedCountryCode = widget.state.countryCode;
    widget.textController.addListener(_onTextChanged);
  }

  @override
  void dispose() {
    widget.textController.removeListener(_onTextChanged);
    super.dispose();
  }

  void _onTextChanged() {
    final number = widget.textController.text.trim();
    final fullNumber = '$_selectedCountryCode$number';
    widget.onInputChanged(fullNumber);

    // Basic validation: has digits and reasonable length
    final isValid = number.length >= 7 && number.length <= 15;
    widget.onInputValidated(isValid);
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 90,
          child: DropdownButtonFormField<String>(
            value: _selectedCountryCode,
            decoration: const InputDecoration(
              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 16),
            ),
            items: _countryCodes.map((code) {
              return DropdownMenuItem(
                value: code.$1,
                child: Text('${code.$2} ${code.$1}'),
              );
            }).toList(),
            onChanged: (value) {
              if (value != null) {
                setState(() => _selectedCountryCode = value);
                widget.state.countryCode = value;
                _onTextChanged();
              }
            },
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: TextFormField(
            controller: widget.textController,
            decoration: const InputDecoration(hintText: phoneHintText),
            keyboardType: TextInputType.phone,
            validator: widget.validator,
          ),
        ),
      ],
    );
  }
}
