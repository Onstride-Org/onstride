import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/horses/providers/providers.dart';
import 'package:gl_horses/features/lessons/providers/providers.dart';
import 'package:gl_horses/features/users/providers/providers.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:models/models.dart';

/// Screen for creating a new lesson request.
class CreateLessonRequestScreen extends ConsumerStatefulWidget {
  const CreateLessonRequestScreen({super.key});

  static String name = 'create-lesson-request';
  static String path = '/lessons/request/new';

  @override
  ConsumerState<CreateLessonRequestScreen> createState() =>
      _CreateLessonRequestScreenState();
}

class _CreateLessonRequestScreenState
    extends ConsumerState<CreateLessonRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  final _notesController = TextEditingController();

  DateTime _selectedDate = DateTime.now().add(const Duration(days: 1));
  TimeOfDay _selectedTime = const TimeOfDay(hour: 10, minute: 0);
  int _duration = 60;
  LessonType _lessonType = LessonType.privateSingle;
  GLUser? _selectedTrainer;
  HorseModel? _selectedHorse;

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
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 90)),
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

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedTrainer == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.l10n.pleaseSelectTrainer)),
      );
      return;
    }

    final account = ref.read(accountProvider);
    final user = account.currentUser;
    final barnId = user.barnId ?? '';

    final scheduledDateTime = DateTime(
      _selectedDate.year,
      _selectedDate.month,
      _selectedDate.day,
      _selectedTime.hour,
      _selectedTime.minute,
    );

    final payload = CreateLessonRequestPayload(
      barnId: barnId,
      trainerId: _selectedTrainer!.id,
      clientId: user.id,
      initiatedBy: RequestInitiator.client,
      proposedDate: scheduledDateTime,
      proposedDuration: _duration,
      lessonType: _lessonType,
      horseId: _selectedHorse?.id,
      horseName: _selectedHorse?.name,
      trainerName: _selectedTrainer!.fullName,
      clientName: user.fullName,
      notes: _notesController.text.trim(),
    );

    ref.read(createLessonRequestProvider.notifier).create(payload);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final createState = ref.watch(createLessonRequestProvider);
    final usersState = ref.watch(fetchUsersProvider);
    final horsesState = ref.watch(fetchHorsesProvider);

    ref.listen(createLessonRequestProvider, (_, next) {
      if (next is SuccessCreateLessonRequestState) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.lessonRequestSent)),
        );
        ref.read(createLessonRequestProvider.notifier).reset();
        context.pop();
      } else if (next is ErrorCreateLessonRequestState) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(next.message)),
        );
      }
    });

    // Get trainers from users
    final trainers = usersState.allUsers
        .where((u) =>
            u.accountType == AccountType.owner ||
            u.accountType == AccountType.manager)
        .toList();

    // Get horses
    final horses = horsesState.horses;

    final isLoading = createState is LoadingCreateLessonRequestState;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.requestLesson),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Trainer Selection
            Text(l10n.selectTrainer,
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            DropdownButtonFormField<GLUser>(
              value: _selectedTrainer,
              decoration: InputDecoration(
                border: const OutlineInputBorder(),
                hintText: l10n.selectTrainer,
              ),
              items: trainers.map((trainer) {
                return DropdownMenuItem(
                  value: trainer,
                  child: Text(trainer.fullName),
                );
              }).toList(),
              onChanged: (value) => setState(() => _selectedTrainer = value),
            ),

            const SizedBox(height: 24),

            // Lesson Type
            Text(l10n.lessonType,
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            DropdownButtonFormField<LessonType>(
              value: _lessonType,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
              ),
              items: LessonType.values.map((type) {
                return DropdownMenuItem(
                  value: type,
                  child: Text(type.displayName),
                );
              }).toList(),
              onChanged: (value) {
                if (value != null) setState(() => _lessonType = value);
              },
            ),

            const SizedBox(height: 24),

            // Date and Time
            Text(l10n.dateAndTime,
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _selectDate,
                    icon: const Icon(Icons.calendar_today),
                    label: Text(DateFormat.yMMMd().format(_selectedDate)),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _selectTime,
                    icon: const Icon(Icons.access_time),
                    label: Text(_selectedTime.format(context)),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 24),

            // Duration
            Text(l10n.duration, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            SegmentedButton<int>(
              segments: const [
                ButtonSegment(value: 30, label: Text('30m')),
                ButtonSegment(value: 45, label: Text('45m')),
                ButtonSegment(value: 60, label: Text('1h')),
                ButtonSegment(value: 90, label: Text('1.5h')),
              ],
              selected: {_duration},
              onSelectionChanged: (selected) {
                setState(() => _duration = selected.first);
              },
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
              maxLines: 3,
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
                  : Text(l10n.sendRequest),
            ),
          ],
        ),
      ),
    );
  }
}
