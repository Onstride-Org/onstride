import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:gl_horses/l10n/l10n.dart';

class PayInvoiceForm extends StatefulWidget {
  const PayInvoiceForm({this.invoiceNumber = 'INV-000143', super.key});
  final String invoiceNumber;

  @override
  State<PayInvoiceForm> createState() => _PayInvoiceFormState();
}

class _PayInvoiceFormState extends State<PayInvoiceForm> {
  final TextEditingController cardNumberController = TextEditingController();
  final TextEditingController expDateController = TextEditingController();
  final TextEditingController nameController = TextEditingController();
  final TextEditingController securityCodeController = TextEditingController();

  @override
  void initState() {
    super.initState();
    cardNumberController.addListener(_formatCardNumber);
    expDateController.addListener(_formatExpirationDate);
  }

  @override
  void dispose() {
    cardNumberController.dispose();
    expDateController.dispose();
    nameController.dispose();
    securityCodeController.dispose();
    super.dispose();
  }

  void _formatCardNumber() {
    final digits = cardNumberController.text.replaceAll(RegExp(r'\D'), '');
    final groups = <String>[];
    for (var i = 0; i < digits.length; i += 4) {
      groups.add(
        digits.substring(
          i,
          i + (i + 4 <= digits.length ? 4 : digits.length - i),
        ),
      );
    }
    final newText = groups.join(' ');
    if (cardNumberController.text != newText) {
      final sel = newText.length;
      cardNumberController.value = TextEditingValue(
        text: newText,
        selection: TextSelection.collapsed(offset: sel),
      );
    }
    setState(() {});
  }

  void _formatExpirationDate() {
    final digits = expDateController.text.replaceAll(RegExp(r'\D'), '');
    var result = digits;
    if (digits.length > 2) {
      result =
          '${digits.substring(0, 2)}/${digits.substring(2, digits.length.clamp(2, 4))}';
    }
    if (expDateController.text != result) {
      final sel = result.length;
      expDateController.value = TextEditingValue(
        text: result,
        selection: TextSelection.collapsed(offset: sel),
      );
    }
    setState(() {});
  }

  bool get _isCardNumberValid =>
      cardNumberController.text.replaceAll(' ', '').length == 16;
  bool get _isExpirationDateValid =>
      RegExp(r'^(0[1-9]|1[0-2])\/\d{2}$').hasMatch(expDateController.text);
  bool get _isNameValid => nameController.text.trim().isNotEmpty;
  bool get _isSecurityCodeValid =>
      RegExp(r'^\d{3,4}$').hasMatch(securityCodeController.text);
  bool get _canPay =>
      _isCardNumberValid &&
      _isExpirationDateValid &&
      _isNameValid &&
      _isSecurityCodeValid;

  OutlineInputBorder _border(Color color) => OutlineInputBorder(
    borderRadius: BorderRadius.circular(8),
    borderSide: BorderSide(color: color),
  );

  @override
  Widget build(BuildContext context) {
    const labelStyle = TextStyle(fontSize: 14, fontWeight: FontWeight.w500);
    const borderColor = GLColors.neutral1000;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        GLSpaces.px16,
        const _SheetHandle(),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: _FormTitle(
            title: '${context.l10n.payInvoiceTitle} #${widget.invoiceNumber}',
          ),
        ),
        GLSpaces.px24,
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _CardNumberField(
                controller: cardNumberController,
                labelStyle: labelStyle,
                borderColor: borderColor,
                isValid: _isCardNumberValid,
                border: _border,
              ),
              GLSpaces.px16,
              _ExpirationDateField(
                controller: expDateController,
                labelStyle: labelStyle,
                borderColor: borderColor,
                isValid: _isExpirationDateValid,
                border: _border,
              ),
              GLSpaces.px16,
              _NameOnCardField(
                controller: nameController,
                labelStyle: labelStyle,
                borderColor: borderColor,
                border: _border,
              ),
              GLSpaces.px16,
              _SecurityCodeField(
                controller: securityCodeController,
                labelStyle: labelStyle,
                borderColor: borderColor,
                isValid: _isSecurityCodeValid,
                border: _border,
              ),
              GLSpaces.px32,
              _ActionButtons(canPay: _canPay),
              GLSpaces.px16,
            ],
          ),
        ),
      ],
    );
  }
}

class _SheetHandle extends StatelessWidget {
  const _SheetHandle();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        width: 40,
        height: 5,
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: Colors.grey.shade300,
          borderRadius: BorderRadius.circular(2.5),
        ),
      ),
    );
  }
}

class _FormTitle extends StatelessWidget {
  const _FormTitle({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: Theme.of(context).textTheme.headlineSmall,
    );
  }
}

class _CardNumberField extends StatelessWidget {
  const _CardNumberField({
    required this.controller,
    required this.labelStyle,
    required this.borderColor,
    required this.isValid,
    required this.border,
  });
  final TextEditingController controller;
  final TextStyle labelStyle;
  final Color borderColor;
  final bool isValid;
  final OutlineInputBorder Function(Color) border;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(context.l10n.cardNumber, style: labelStyle),
        GLSpaces.px8,
        TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          maxLength: 16,
          decoration: InputDecoration(
            hintText: '0000 0000 0000 0000',
            contentPadding: const EdgeInsets.symmetric(
              vertical: 14,
              horizontal: 12,
            ),
            enabledBorder: border(borderColor),
            focusedBorder: border(isValid ? borderColor : borderColor),
            disabledBorder: border(borderColor),
            counterText: '',
          ),
        ),
      ],
    );
  }
}

class _ExpirationDateField extends StatelessWidget {
  const _ExpirationDateField({
    required this.controller,
    required this.labelStyle,
    required this.borderColor,
    required this.isValid,
    required this.border,
  });
  final TextEditingController controller;
  final TextStyle labelStyle;
  final Color borderColor;
  final bool isValid;
  final OutlineInputBorder Function(Color) border;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(context.l10n.expirationDate, style: labelStyle),
        GLSpaces.px8,
        TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          decoration: InputDecoration(
            hintText: '00/00',
            contentPadding: const EdgeInsets.symmetric(
              vertical: 14,
              horizontal: 12,
            ),
            enabledBorder: border(borderColor),
            focusedBorder: border(isValid ? borderColor : borderColor),
            disabledBorder: border(borderColor),
          ),
        ),
      ],
    );
  }
}

class _NameOnCardField extends StatelessWidget {
  const _NameOnCardField({
    required this.controller,
    required this.labelStyle,
    required this.borderColor,
    required this.border,
  });
  final TextEditingController controller;
  final TextStyle labelStyle;
  final Color borderColor;
  final OutlineInputBorder Function(Color) border;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(context.l10n.nameOnCard, style: labelStyle),
        GLSpaces.px8,
        TextField(
          controller: controller,
          textCapitalization: TextCapitalization.words,
          decoration: InputDecoration(
            hintText: context.l10n.enterCardNameHint,
            contentPadding: const EdgeInsets.symmetric(
              vertical: 14,
              horizontal: 12,
            ),
            enabledBorder: border(borderColor),
            focusedBorder: border(borderColor),
            disabledBorder: border(borderColor),
          ),
        ),
      ],
    );
  }
}

class _SecurityCodeField extends StatelessWidget {
  const _SecurityCodeField({
    required this.controller,
    required this.labelStyle,
    required this.borderColor,
    required this.isValid,
    required this.border,
  });
  final TextEditingController controller;
  final TextStyle labelStyle;
  final Color borderColor;
  final bool isValid;
  final OutlineInputBorder Function(Color) border;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(context.l10n.securityCode, style: labelStyle),
        GLSpaces.px8,
        TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          maxLength: 4,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          obscureText: true,
          decoration: InputDecoration(
            counterText: '',
            hintText: '123',
            contentPadding: const EdgeInsets.symmetric(
              vertical: 14,
              horizontal: 12,
            ),
            enabledBorder: border(borderColor),
            focusedBorder: border(isValid ? borderColor : borderColor),
            disabledBorder: border(borderColor),
          ),
        ),
      ],
    );
  }
}

class _ActionButtons extends StatelessWidget {
  const _ActionButtons({required this.canPay});
  final bool canPay;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton(
            onPressed: () => Navigator.of(context).pop(false),
            style: OutlinedButton.styleFrom(
              side: BorderSide(color: context.primaryColor),
              padding: const EdgeInsets.symmetric(vertical: 12),
            ),
            child: Text(context.l10n.cancel),
          ),
        ),
        GLSpaces.px16,
        Expanded(
          child: ElevatedButton(
            onPressed: canPay ? () => Navigator.of(context).pop(true) : null,
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 12),
            ),
            child: Text(
              context.l10n.payInvoicelabel,
              style: const TextStyle(fontWeight: FontWeight.normal),
            ),
          ),
        ),
      ],
    );
  }
}
