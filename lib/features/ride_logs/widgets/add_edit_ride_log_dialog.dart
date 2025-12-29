import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/ride_logs/providers/providers.dart';
import 'package:intl/intl.dart';
import 'package:models/models.dart';

class AddEditRideLogDialog extends ConsumerStatefulWidget {
  const AddEditRideLogDialog({
    required this.horseId,
    required this.barnId,
    this.rideLog,
    super.key,
  });

  final String horseId;
  final String barnId;
  final RideLogModel? rideLog;

  static Future<RideLogModel?> show(
    BuildContext context, {
    required String horseId,
    required String barnId,
    RideLogModel? rideLog,
  }) {
    return showModalBottomSheet<RideLogModel>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (context) => AddEditRideLogDialog(
        horseId: horseId,
        barnId: barnId,
        rideLog: rideLog,
      ),
    );
  }

  @override
  ConsumerState<AddEditRideLogDialog> createState() =>
      _AddEditRideLogDialogState();
}

class _AddEditRideLogDialogState extends ConsumerState<AddEditRideLogDialog> {
  final _formKey = GlobalKey<FormState>();
  late DateTime _selectedDate;
  late TimeOfDay _selectedTime;
  late RideType _selectedType;
  late TextEditingController _durationController;
  late TextEditingController _riderNameController;
  late TextEditingController _notesController;

  bool get isEditing => widget.rideLog != null;

  @override
  void initState() {
    super.initState();
    final rideLog = widget.rideLog;
    _selectedDate = rideLog?.date ?? DateTime.now();
    _selectedTime = rideLog != null
        ? TimeOfDay.fromDateTime(rideLog.date)
        : TimeOfDay.now();
    _selectedType = rideLog?.type ?? RideType.training;
    _durationController = TextEditingController(
      text: rideLog?.durationMinutes.toString() ?? '30',
    );
    _riderNameController = TextEditingController(
      text: rideLog?.riderName ?? '',
    );
    _notesController = TextEditingController(
      text: rideLog?.notes ?? '',
    );
  }

  @override
  void dispose() {
    _durationController.dispose();
    _riderNameController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() => _selectedDate = picked);
    }
  }

  Future<void> _selectTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _selectedTime,
    );
    if (picked != null) {
      setState(() => _selectedTime = picked);
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    final user = ref.read(accountProvider).currentUser;
    final dateTime = DateTime(
      _selectedDate.year,
      _selectedDate.month,
      _selectedDate.day,
      _selectedTime.hour,
      _selectedTime.minute,
    );

    final rideLog = RideLogModel(
      id: widget.rideLog?.id ?? '',
      horseId: widget.horseId,
      barnId: widget.barnId,
      date: dateTime,
      type: _selectedType,
      durationMinutes: int.tryParse(_durationController.text) ?? 30,
      riderName: _riderNameController.text.isNotEmpty
          ? _riderNameController.text
          : null,
      notes: _notesController.text.isNotEmpty ? _notesController.text : null,
      createdById: widget.rideLog?.createdById ?? user.id,
      createdAt: widget.rideLog?.createdAt ?? DateTime.now(),
      updatedAt: DateTime.now(),
    );

    RideLogModel? result;
    if (isEditing) {
      result = await ref.read(createRideLogProvider.notifier).update(rideLog);
    } else {
      result = await ref.read(createRideLogProvider.notifier).create(rideLog);
    }

    if (mounted && result != null) {
      Navigator.of(context).pop(result);
    }
  }

  @override
  Widget build(BuildContext context) {
    final createState = ref.watch(createRideLogProvider);
    final isLoading = createState is LoadingCreateRideLogState;

    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      isEditing ? 'Edit Ride Log' : 'Add Ride Log',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ],
                ),
                GLSpaces.px24,
                Text(
                  'Ride Type',
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                GLSpaces.px8,
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: RideType.values.map((type) {
                    final isSelected = type == _selectedType;
                    return ChoiceChip(
                      label: Text(type.displayName),
                      selected: isSelected,
                      onSelected: (_) => setState(() => _selectedType = type),
                    );
                  }).toList(),
                ),
                GLSpaces.px16,
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Date',
                            style: Theme.of(context).textTheme.titleSmall,
                          ),
                          GLSpaces.px8,
                          InkWell(
                            onTap: _selectDate,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 16,
                              ),
                              decoration: BoxDecoration(
                                border: Border.all(color: Colors.grey.shade400),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.calendar_today, size: 18),
                                  const SizedBox(width: 8),
                                  Text(
                                    DateFormat('MMM dd, yyyy')
                                        .format(_selectedDate),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Time',
                            style: Theme.of(context).textTheme.titleSmall,
                          ),
                          GLSpaces.px8,
                          InkWell(
                            onTap: _selectTime,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 16,
                              ),
                              decoration: BoxDecoration(
                                border: Border.all(color: Colors.grey.shade400),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.access_time, size: 18),
                                  const SizedBox(width: 8),
                                  Text(_selectedTime.format(context)),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                GLSpaces.px16,
                Text(
                  'Duration (minutes)',
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                GLSpaces.px8,
                TextFormField(
                  controller: _durationController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    hintText: 'Enter duration in minutes',
                    prefixIcon: Icon(Icons.timer),
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter duration';
                    }
                    final duration = int.tryParse(value);
                    if (duration == null || duration <= 0) {
                      return 'Please enter a valid duration';
                    }
                    return null;
                  },
                ),
                GLSpaces.px16,
                Text(
                  'Rider Name (optional)',
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                GLSpaces.px8,
                TextFormField(
                  controller: _riderNameController,
                  decoration: const InputDecoration(
                    hintText: 'Enter rider name',
                    prefixIcon: Icon(Icons.person),
                    border: OutlineInputBorder(),
                  ),
                ),
                GLSpaces.px16,
                Text(
                  'Notes (optional)',
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                GLSpaces.px8,
                TextFormField(
                  controller: _notesController,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    hintText: 'Add any notes about the ride...',
                    border: OutlineInputBorder(),
                  ),
                ),
                GLSpaces.px24,
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: isLoading ? null : _save,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Text(isEditing ? 'Update Ride Log' : 'Add Ride Log'),
                  ),
                ),
                GLSpaces.px16,
              ],
            ),
          ),
        ),
      ),
    );
  }
}
