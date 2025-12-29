import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:gl_horses/core/common/common.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:models/models.dart';

class BarnSetupForm extends StatefulWidget {
  const BarnSetupForm({
    required this.shape,
    required this.onCancel,
    required this.onContinue,
    this.setup,
    super.key,
  });

  final BarnSetup? setup;
  final BarnShape? shape;
  final VoidCallback onCancel;
  final ValueChanged<BarnSetup> onContinue;

  @override
  State<BarnSetupForm> createState() => _BarnSetupFormState();
}

class _BarnSetupFormState extends State<BarnSetupForm> {
  final _formKey = GlobalKey<FormState>();

  final _stallsCtrl = TextEditingController();
  final _aislesCtrl = TextEditingController();
  final _verticalCtrl = TextEditingController();
  final _horizontalCtrl = TextEditingController();

  @override
  void initState() {
    _stallsCtrl.text = '${widget.setup?.stalls ?? ''}';
    _aislesCtrl.text = '${widget.setup?.stallsPerAisle ?? ''}';
    _verticalCtrl.text = '${widget.setup?.verticalStalls ?? ''}';
    _horizontalCtrl.text = '${widget.setup?.horizontalStalls ?? ''}';
    super.initState();
  }

  @override
  void dispose() {
    _stallsCtrl.dispose();
    _aislesCtrl.dispose();
    _verticalCtrl.dispose();
    _horizontalCtrl.dispose();
    super.dispose();
  }

  bool get _isAisles => widget.shape == BarnShape.aisles;

  bool get _isCircle => widget.shape == BarnShape.circle;

  bool get _isLShape => widget.shape == BarnShape.lShape;

  bool get _isValid {
    final validate = _formKey.currentState?.validate() ?? false;
    if (!validate) return false;
    if (_isAisles) {
      return _stallsCtrl.text.isNotEmpty && _aislesCtrl.text.isNotEmpty;
    }
    if (_isCircle) {
      return _stallsCtrl.text.isNotEmpty;
    }
    if (_isLShape) {
      return _verticalCtrl.text.isNotEmpty && _horizontalCtrl.text.isNotEmpty;
    }
    return false;
  }

  void _submit() {
    if (!_isValid) return;
    final shape = widget.shape!;
    final vertical = int.tryParse(_verticalCtrl.text) ?? 0;
    final horizontal = int.tryParse(_horizontalCtrl.text) ?? 0;
    final stalls = _isLShape
        ? vertical + horizontal
        : int.tryParse(_stallsCtrl.text) ?? 0;

    final data = BarnSetup(
      shape: shape,
      stalls: stalls,
      stallsPerAisle: _isAisles ? int.tryParse(_aislesCtrl.text) : null,
      verticalStalls: _isLShape ? vertical : null,
      horizontalStalls: _isLShape ? horizontal : null,
    );
    widget.onContinue(data);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = context.l10n;

    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: 24.edgeInsetsH,
            child: Form(
              key: _formKey,
              onChanged: () => setState(() {}),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l10n.numberOfStalls,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  GLSpaces.px8,
                  Text(
                    l10n.setupStallsSubtitle,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w400,
                      color: GLColors.neutral500,
                    ),
                  ),
                  GLSpaces.px32,

                  if (_isAisles || _isCircle) ...[
                    FormLabel(l10n.numberOfStalls),
                    GLSpaces.px8,
                    TextFormField(
                      controller: _stallsCtrl,
                      keyboardType: TextInputType.number,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                      ],
                      decoration: InputDecoration(
                        hintText: l10n.hintNumberOfStalls,
                        counterText: l10n.maximumStallsCount(
                          _isCircle
                              ? maxCircleStallNumber
                              : maxAisleStallNumber,
                        ),
                      ),
                      validator: (v) => FormValidator.minAndMaxNumber(
                        v,
                        range: (
                          1,
                          _isCircle
                              ? maxCircleStallNumber
                              : maxAisleStallNumber,
                        ),
                        emptyMessage: l10n.requiredField,
                        invalidMessage: l10n.validRange,
                      ),
                    ),
                    GLSpaces.px16,
                  ],

                  if (_isAisles) ...[
                    FormLabel(l10n.stallsPerAisle),
                    GLSpaces.px8,
                    TextFormField(
                      controller: _aislesCtrl,
                      keyboardType: TextInputType.number,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                      ],
                      decoration: InputDecoration(
                        hintText: l10n.hintStallsPerAisle,
                      ),
                      validator: (v) {
                        final base = FormValidator.minAndMaxNumber(
                          v,
                          range: (1, (maxAisleStallNumber / 2).toInt()),
                          emptyMessage: l10n.requiredField,
                          invalidMessage: l10n.validRange,
                        );
                        if (base != null) return base;

                        final perAisle = int.tryParse(v ?? '') ?? 0;
                        final stalls = int.tryParse(_stallsCtrl.text) ?? 0;
                        if (perAisle > stalls) {
                          return l10n.stallsPerAisleExceedsTotal;
                        }
                        return null;
                      },
                    ),
                    GLSpaces.px16,
                  ],

                  if (_isLShape) ...[
                    FormLabel(l10n.verticalStalls),
                    GLSpaces.px8,
                    TextFormField(
                      controller: _verticalCtrl,
                      keyboardType: TextInputType.number,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                      ],
                      decoration: InputDecoration(
                        hintText: l10n.hintVerticalStalls,
                        counterText: l10n.maximumStallsCount(
                          (maxAisleStallNumber / 2).toInt(),
                        ),
                      ),
                      validator: (v) => FormValidator.minAndMaxNumber(
                        v,
                        range: (1, (maxAisleStallNumber / 2).toInt()),
                        emptyMessage: l10n.requiredField,
                        invalidMessage: l10n.validRange,
                      ),
                    ),
                    GLSpaces.px16,
                    FormLabel(l10n.horizontalStalls),
                    GLSpaces.px8,
                    TextFormField(
                      controller: _horizontalCtrl,
                      keyboardType: TextInputType.number,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                      ],
                      decoration: InputDecoration(
                        hintText: l10n.hintHorizontalStalls,
                        counterText: 'Maximum stalls $maxLShapeStallNumber',
                      ),

                      validator: (v) => FormValidator.minAndMaxNumber(
                        v,
                        range: (1, (maxAisleStallNumber / 2).toInt()),
                        emptyMessage: l10n.requiredField,
                        invalidMessage: l10n.validRange,
                      ),
                    ),
                    GLSpaces.px16,
                  ],
                ],
              ),
            ),
          ),
        ),
        Padding(
          padding: 24.edgeInsetsH,
          child: Column(
            children: [
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isValid ? _submit : null,
                  style: GLButtonStyles.primaryM,
                  child: Text(l10n.continueCta),
                ),
              ),
              GLSpaces.px16,
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: widget.onCancel,
                  style: GLButtonStyles.outlineM,
                  child: Text(l10n.cancelCta),
                ),
              ),
            ],
          ),
        ),
        GLSpaces.px24,
      ],
    );
  }
}
