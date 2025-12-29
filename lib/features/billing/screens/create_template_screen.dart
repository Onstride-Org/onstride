import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/billing/providers/providers.dart';
import 'package:go_router/go_router.dart';
import 'package:models/models.dart';
import 'package:uuid/uuid.dart';

/// Screen for creating a billing template.
class CreateTemplateScreen extends ConsumerStatefulWidget {
  const CreateTemplateScreen({super.key});

  static String name = 'create-template';
  static String path = '/billing/template/new';

  @override
  ConsumerState<CreateTemplateScreen> createState() =>
      _CreateTemplateScreenState();
}

class _CreateTemplateScreenState extends ConsumerState<CreateTemplateScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _taxRateController = TextEditingController(text: '0');

  List<TemplateLineItem> _lineItems = [];
  bool _applyTax = false;
  bool _isDefault = false;

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _taxRateController.dispose();
    super.dispose();
  }

  void _addLineItem() {
    setState(() {
      _lineItems.add(
        TemplateLineItem(
          id: const Uuid().v4(),
          description: '',
          type: ChargeType.service,
          amount: 0,
          sortOrder: _lineItems.length,
        ),
      );
    });
  }

  void _removeLineItem(int index) {
    setState(() {
      _lineItems.removeAt(index);
    });
  }

  void _updateLineItem(int index, TemplateLineItem item) {
    setState(() {
      _lineItems[index] = item;
    });
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    if (_lineItems.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.l10n.addAtLeastOneItem)),
      );
      return;
    }

    final account = ref.read(accountProvider);
    final user = account.currentUser;
    final barnId = user.barnId ?? '';

    final payload = CreateBillingTemplatePayload(
      barnId: barnId,
      name: _nameController.text.trim(),
      description: _descriptionController.text.trim(),
      lineItems: _lineItems,
      taxRate: (double.tryParse(_taxRateController.text) ?? 0) / 100,
      applyTax: _applyTax,
      isDefault: _isDefault,
      createdById: user.id,
    );

    ref.read(manageBillingTemplateProvider.notifier).create(payload);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final manageState = ref.watch(manageBillingTemplateProvider);

    ref.listen(manageBillingTemplateProvider, (_, next) {
      if (next is SuccessManageTemplateState) {
        ref.read(fetchBillingTemplatesProvider.notifier)
            .addTemplate(next.template);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.templateCreated)),
        );
        ref.read(manageBillingTemplateProvider.notifier).reset();
        context.pop();
      } else if (next is ErrorManageTemplateState) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(next.message)),
        );
      }
    });

    final isLoading = manageState is LoadingManageTemplateState;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.createTemplate),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Template Name
            Text(l10n.templateName,
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            TextFormField(
              controller: _nameController,
              decoration: InputDecoration(
                border: const OutlineInputBorder(),
                hintText: l10n.enterTemplateName,
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return l10n.templateNameRequired;
                }
                return null;
              },
            ),

            const SizedBox(height: 24),

            // Description
            Text('${l10n.description} (${l10n.optional})',
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            TextFormField(
              controller: _descriptionController,
              decoration: InputDecoration(
                border: const OutlineInputBorder(),
                hintText: l10n.enterDescription,
              ),
              maxLines: 2,
            ),

            const SizedBox(height: 24),

            // Line Items Header
            Row(
              children: [
                Text(l10n.lineItems,
                    style: Theme.of(context).textTheme.titleMedium),
                const Spacer(),
                TextButton.icon(
                  onPressed: _addLineItem,
                  icon: const Icon(Icons.add),
                  label: Text(l10n.addItem),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Line Items List
            if (_lineItems.isEmpty)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Center(
                    child: Column(
                      children: [
                        const Icon(Icons.list, size: 48, color: Colors.grey),
                        const SizedBox(height: 8),
                        Text(l10n.noLineItems),
                        const SizedBox(height: 16),
                        OutlinedButton.icon(
                          onPressed: _addLineItem,
                          icon: const Icon(Icons.add),
                          label: Text(l10n.addFirstItem),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else
              ...List.generate(_lineItems.length, (index) {
                return _LineItemCard(
                  key: ValueKey(_lineItems[index].id),
                  item: _lineItems[index],
                  onChanged: (item) => _updateLineItem(index, item),
                  onRemove: () => _removeLineItem(index),
                );
              }),

            const SizedBox(height: 24),

            // Tax Settings
            Text(l10n.taxSettings,
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            SwitchListTile(
              title: Text(l10n.applyTax),
              value: _applyTax,
              onChanged: (value) => setState(() => _applyTax = value),
            ),
            if (_applyTax) ...[
              const SizedBox(height: 8),
              TextFormField(
                controller: _taxRateController,
                decoration: InputDecoration(
                  border: const OutlineInputBorder(),
                  labelText: l10n.taxRate,
                  suffixText: '%',
                ),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
              ),
            ],

            const SizedBox(height: 24),

            // Default template toggle
            SwitchListTile(
              title: Text(l10n.defaultTemplate),
              subtitle: Text(l10n.defaultTemplateDescription),
              value: _isDefault,
              onChanged: (value) => setState(() => _isDefault = value),
            ),

            const SizedBox(height: 32),

            // Submit Button
            FilledButton(
              onPressed: isLoading ? null : _submit,
              child: isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Text(l10n.saveTemplate),
            ),
          ],
        ),
      ),
    );
  }
}

class _LineItemCard extends StatefulWidget {
  const _LineItemCard({
    super.key,
    required this.item,
    required this.onChanged,
    required this.onRemove,
  });

  final TemplateLineItem item;
  final ValueChanged<TemplateLineItem> onChanged;
  final VoidCallback onRemove;

  @override
  State<_LineItemCard> createState() => _LineItemCardState();
}

class _LineItemCardState extends State<_LineItemCard> {
  late TextEditingController _descController;
  late TextEditingController _amountController;
  late TextEditingController _qtyController;

  @override
  void initState() {
    super.initState();
    _descController = TextEditingController(text: widget.item.description);
    _amountController = TextEditingController(
      text: widget.item.amount > 0 ? widget.item.amount.toString() : '',
    );
    _qtyController = TextEditingController(
      text: widget.item.defaultQuantity.toString(),
    );
  }

  @override
  void dispose() {
    _descController.dispose();
    _amountController.dispose();
    _qtyController.dispose();
    super.dispose();
  }

  void _update() {
    widget.onChanged(widget.item.copyWith(
      description: _descController.text,
      amount: double.tryParse(_amountController.text) ?? 0,
      defaultQuantity: int.tryParse(_qtyController.text) ?? 1,
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(
                  flex: 2,
                  child: DropdownButtonFormField<ChargeType>(
                    value: widget.item.type,
                    decoration: const InputDecoration(
                      labelText: 'Type',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    items: ChargeType.values.map((type) {
                      return DropdownMenuItem(
                        value: type,
                        child: Text(type.displayName,
                            style: const TextStyle(fontSize: 13)),
                      );
                    }).toList(),
                    onChanged: (value) {
                      if (value != null) {
                        widget.onChanged(widget.item.copyWith(type: value));
                      }
                    },
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.delete_outline, color: Colors.red),
                  onPressed: widget.onRemove,
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _descController,
              decoration: const InputDecoration(
                labelText: 'Description',
                border: OutlineInputBorder(),
                isDense: true,
              ),
              onChanged: (_) => _update(),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _amountController,
                    decoration: const InputDecoration(
                      labelText: 'Amount',
                      prefixText: '\$ ',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    keyboardType:
                        const TextInputType.numberWithOptions(decimal: true),
                    onChanged: (_) => _update(),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _qtyController,
                    decoration: const InputDecoration(
                      labelText: 'Default Qty',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    keyboardType: TextInputType.number,
                    onChanged: (_) => _update(),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Checkbox(
                  value: widget.item.isTaxable,
                  onChanged: (value) {
                    widget.onChanged(
                        widget.item.copyWith(isTaxable: value ?? false));
                  },
                ),
                const Text('Taxable'),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
