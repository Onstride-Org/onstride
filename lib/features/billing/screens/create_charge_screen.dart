import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/billing/providers/providers.dart';
import 'package:gl_horses/features/horses/providers/providers.dart';
import 'package:gl_horses/features/users/providers/providers.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:models/models.dart';

/// Screen for creating a new charge.
class CreateChargeScreen extends ConsumerStatefulWidget {
  const CreateChargeScreen({super.key});

  static String name = 'create-charge';
  static String path = '/billing/charge/new';

  @override
  ConsumerState<CreateChargeScreen> createState() => _CreateChargeScreenState();
}

class _CreateChargeScreenState extends ConsumerState<CreateChargeScreen> {
  final _formKey = GlobalKey<FormState>();
  final _descriptionController = TextEditingController();
  final _amountController = TextEditingController();
  final _quantityController = TextEditingController(text: '1');
  final _notesController = TextEditingController();

  DateTime _chargeDate = DateTime.now();
  ChargeType _chargeType = ChargeType.service;
  GLUser? _selectedClient;
  HorseModel? _selectedHorse;
  bool _isOneOff = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(fetchUsersProvider.notifier).fetchAllUsers();
      ref.read(fetchHorsesProvider.notifier).fetchAllHorses();
    });
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    _amountController.dispose();
    _quantityController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _chargeDate,
      firstDate: DateTime.now().subtract(const Duration(days: 30)),
      lastDate: DateTime.now().add(const Duration(days: 30)),
    );
    if (picked != null) {
      setState(() => _chargeDate = picked);
    }
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedClient == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.l10n.pleaseSelectClient)),
      );
      return;
    }

    final account = ref.read(accountProvider);
    final user = account.currentUser;
    final barnId = user.barnId ?? '';

    final payload = CreateChargePayload(
      barnId: barnId,
      clientId: _selectedClient!.id,
      type: _chargeType,
      description: _descriptionController.text.trim(),
      amount: double.tryParse(_amountController.text) ?? 0,
      quantity: int.tryParse(_quantityController.text) ?? 1,
      chargeDate: _chargeDate,
      horseId: _selectedHorse?.id,
      horseName: _selectedHorse?.name,
      isOneOff: _isOneOff,
      createdById: user.id,
      createdByName: user.fullName,
      notes: _notesController.text.trim(),
    );

    ref.read(createChargeProvider.notifier).create(payload);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final createState = ref.watch(createChargeProvider);
    final usersState = ref.watch(fetchUsersProvider);
    final horsesState = ref.watch(fetchHorsesProvider);

    ref.listen(createChargeProvider, (_, next) {
      if (next is SuccessCreateChargeState) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.chargeCreated)),
        );
        ref.read(createChargeProvider.notifier).reset();
        context.pop();
      } else if (next is ErrorCreateChargeState) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(next.message)),
        );
      }
    });

    final clients = usersState.maybeWhen(
      success: (users) => users
          .where((u) => u.accountType == AccountType.boarder)
          .toList(),
      orElse: () => <GLUser>[],
    );

    final horses = horsesState.maybeWhen(
      success: (data) => data.horses,
      orElse: () => <HorseModel>[],
    );

    final isLoading = createState is LoadingCreateChargeState;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.addCharge),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Client Selection
            Text(l10n.selectClient,
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            DropdownButtonFormField<GLUser>(
              value: _selectedClient,
              decoration: InputDecoration(
                border: const OutlineInputBorder(),
                hintText: l10n.selectClient,
              ),
              items: clients.map((client) {
                return DropdownMenuItem(
                  value: client,
                  child: Text(client.fullName),
                );
              }).toList(),
              onChanged: (value) => setState(() => _selectedClient = value),
            ),

            const SizedBox(height: 24),

            // Charge Type
            Text(l10n.chargeType,
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            DropdownButtonFormField<ChargeType>(
              value: _chargeType,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
              ),
              items: ChargeType.values.map((type) {
                return DropdownMenuItem(
                  value: type,
                  child: Text(type.displayName),
                );
              }).toList(),
              onChanged: (value) {
                if (value != null) setState(() => _chargeType = value);
              },
            ),

            const SizedBox(height: 24),

            // Description
            Text(l10n.description,
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            TextFormField(
              controller: _descriptionController,
              decoration: InputDecoration(
                border: const OutlineInputBorder(),
                hintText: l10n.enterDescription,
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return l10n.descriptionRequired;
                }
                return null;
              },
            ),

            const SizedBox(height: 24),

            // Amount and Quantity
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(l10n.amount,
                          style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _amountController,
                        decoration: const InputDecoration(
                          border: OutlineInputBorder(),
                          prefixText: '\$ ',
                        ),
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return l10n.amountRequired;
                          }
                          if (double.tryParse(value) == null) {
                            return l10n.invalidAmount;
                          }
                          return null;
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(l10n.quantity,
                          style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _quantityController,
                        decoration: const InputDecoration(
                          border: OutlineInputBorder(),
                        ),
                        keyboardType: TextInputType.number,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return l10n.quantityRequired;
                          }
                          if (int.tryParse(value) == null) {
                            return l10n.invalidQuantity;
                          }
                          return null;
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 24),

            // Charge Date
            Text(l10n.chargeDate,
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: _selectDate,
              icon: const Icon(Icons.calendar_today),
              label: Text(DateFormat.yMMMd().format(_chargeDate)),
            ),

            const SizedBox(height: 24),

            // Horse Selection (Optional)
            Text('${l10n.horse} (${l10n.optional})',
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            DropdownButtonFormField<HorseModel?>(
              value: _selectedHorse,
              decoration: InputDecoration(
                border: const OutlineInputBorder(),
                hintText: l10n.selectHorse,
              ),
              items: [
                DropdownMenuItem<HorseModel?>(
                  value: null,
                  child: Text(l10n.noHorseSelected),
                ),
                ...horses.map((horse) {
                  return DropdownMenuItem(
                    value: horse,
                    child: Text(horse.name),
                  );
                }),
              ],
              onChanged: (value) => setState(() => _selectedHorse = value),
            ),

            const SizedBox(height: 24),

            // One-off toggle
            SwitchListTile(
              title: Text(l10n.oneOffCharge),
              subtitle: Text(l10n.oneOffChargeDescription),
              value: _isOneOff,
              onChanged: (value) => setState(() => _isOneOff = value),
            ),

            const SizedBox(height: 16),

            // Notes
            Text('${l10n.notes} (${l10n.optional})',
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            TextFormField(
              controller: _notesController,
              decoration: InputDecoration(
                border: const OutlineInputBorder(),
                hintText: l10n.addNotesHint,
              ),
              maxLines: 2,
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
                  : Text(l10n.createCharge),
            ),
          ],
        ),
      ),
    );
  }
}
