import 'dart:async';

import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/features.dart';
import 'package:gl_horses/l10n/gen_l10n/app_localizations.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:go_router/go_router.dart';
import 'package:models/models.dart';

class AddTaskForm extends ConsumerStatefulWidget {
  const AddTaskForm({
    required this.createdAt,
    super.key,
  });

  final DateTime createdAt;

  @override
  ConsumerState<AddTaskForm> createState() => _AddTaskFormState();
}

class _AddTaskFormState extends ConsumerState<AddTaskForm> {
  final TextEditingController taskNameController = TextEditingController();
  final TextEditingController dueDateController = TextEditingController();

  List<HorseModel> _selectedHorses = <HorseModel>[];
  List<GLUser> _selectedAssignees = <GLUser>[];

  bool _reminderEnabled = true;
  bool _taskNameError = false;
  bool _assigneeError = false;
  bool _dueDateError = false;
  bool _duplicateError = false;

  late AppLocalizations l10n;

  late DateTime _pickerFocused;
  late DateTime _pickerSelected;
  final List<String> _monthNames = [];
  late final List<int> _years = List<int>.generate(101, (i) => 2000 + i);

  @override
  void initState() {
    super.initState();
    final user = ref.read(accountProvider).currentUser;

    // If current user is a groomer, auto-assign them as the single assignee.
    if (user.accountType == AccountType.groomer) {
      _selectedAssignees = <GLUser>[user];
    }

    _pickerFocused = DateTime(
      widget.createdAt.year,
      widget.createdAt.month,
      widget.createdAt.day,
    );
    _pickerSelected = _pickerFocused;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(fetchHorsesProvider.notifier).fetchAllHorses();
      ref.read(fetchUsersProvider.notifier).fetchAllUsers();
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    l10n = context.l10n;
    if (_monthNames.isEmpty) {
      _monthNames.addAll([
        l10n.january,
        l10n.february,
        l10n.march,
        l10n.april,
        l10n.may,
        l10n.june,
        l10n.july,
        l10n.august,
        l10n.september,
        l10n.october,
        l10n.november,
        l10n.december,
      ]);
    }
  }

  @override
  void dispose() {
    taskNameController.dispose();
    dueDateController.dispose();
    super.dispose();
  }

  void _resetValidationErrors() {
    setState(() {
      _taskNameError = false;
      _assigneeError = false;
      _dueDateError = false;
      _duplicateError = false;
    });
  }

  Future<void> _onSave() async {
    _resetValidationErrors();

    var hasErrors = false;

    if (!_isTaskNameValid) {
      _taskNameError = true;
      hasErrors = true;
    }

    if (_selectedAssignees.isEmpty) {
      _assigneeError = true;
      hasErrors = true;
    }

    if (!_isDueDateValid || dueDateController.text.isEmpty) {
      _dueDateError = true;
      hasErrors = true;
    }

    if (!hasErrors && _hasDuplicateTask) {
      _duplicateError = true;
      hasErrors = true;
    }

    if (hasErrors) {
      setState(() {});
      showErrorToast(
        context,
        _duplicateError
            ? l10n.taskAlreadyExistsErrorMsg
            : l10n.completeAllRequiredFieldsMsg,
      );
      return;
    }

    final user = ref.watch(accountProvider).currentUser;
    final now = DateTime.now();

    var finalDueDate = _pickerSelected;
    if (_pickerSelected.hour == 0 && _pickerSelected.minute == 0) {
      finalDueDate = DateTime(
        _pickerSelected.year,
        _pickerSelected.month,
        _pickerSelected.day,
        23,
        59,
      );
    }

    final task = TaskModel(
      id: '',
      name: taskNameController.text.trim(),
      sendReminder: _reminderEnabled,
      createdAt: widget.createdAt,
      updatedAt: now,
      dueDate: finalDueDate,
      status: TaskStatus.notStarted,
      barnId: user.barnId ?? '',

      horses: _selectedHorses
          .map(
            (h) => HorseSummary(
              id: h.id,
              name: h.name,
              boarderId: h.boarderId,
            ),
          )
          .toList(),

      assignees: _selectedAssignees
          .map(
            (u) => GLUserSummary(
              id: u.id,
              name: u.name ?? '',
              accountType: u.accountType!,
            ),
          )
          .toList(),
    );

    final created = await ref.read(createTaskProvider.notifier).create(task);
    if (!mounted) return;

    if (created != null) {
      context
        ..showSnackBar(AppSnackBar.success(title: l10n.taskAddedMsg))
        ..pop(true);
    } else {
      showErrorToast(context, l10n.errorCreatingTask);
    }
  }

  bool get _isTaskNameValid => taskNameController.text.trim().isNotEmpty;

  bool get _isDueDateValid {
    final today = DateTime.now();
    final todayDate = DateTime(today.year, today.month, today.day);
    final selectedDate = DateTime(
      _pickerSelected.year,
      _pickerSelected.month,
      _pickerSelected.day,
    );
    return !selectedDate.isBefore(todayDate);
  }

  List<TaskModel> get _existingTasksForSelectedDate {
    final allTasks = ref
        .read(getTaskListProvider.notifier)
        .getTasksFromState(_pickerSelected);

    return allTasks
        .where((task) => task.dueDate.isSameDayAs(_pickerSelected))
        .toList();
  }

  bool get _hasDuplicateTask {
    final name = taskNameController.text.trim().toLowerCase();
    if (name.isEmpty || _selectedHorses.isEmpty) return false;

    final selectedHorseIds = _selectedHorses.map((h) => h.id).toSet();

    return _existingTasksForSelectedDate.any((task) {
      final anySameHorse = task.horses.any(
        (h) => selectedHorseIds.contains(h.id),
      );
      if (!anySameHorse) return false;

      final taskName = task.name.trim().toLowerCase();
      final similar = taskName.contains(name) || name.contains(taskName);
      return similar;
    });
  }

  bool get _canSubmit {
    return _isTaskNameValid &&
        !_hasDuplicateTask &&
        dueDateController.text.isNotEmpty &&
        _selectedHorses.isNotEmpty &&
        _selectedAssignees.isNotEmpty &&
        _isDueDateValid;
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(accountProvider).currentUser;
    final isCurrentUserGroom = user.accountType == AccountType.groomer;
    final isDueDateInvalid =
        dueDateController.text.isNotEmpty && !_isDueDateValid;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        GLSpaces.px16,
        const _SheetHandle(),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: _FormTitle(title: l10n.createNewTask),
        ),
        GLSpaces.px24,
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TaskNameField(
                label: l10n.taskName,
                hint: l10n.taskNameHint,
                controller: taskNameController,
                duplicateError: _duplicateError,
                validationError: _taskNameError,
                onChanged: (_) {
                  if (_taskNameError) setState(() => _taskNameError = false);
                  if (_duplicateError) setState(() => _duplicateError = false);
                },
              ),
              GLSpaces.px16,

              HorsesDropdown(
                label: l10n.assignedHorse,
                hint: l10n.selectOption,
                selected: _selectedHorses,
                onChanged: (horses) {
                  setState(() {
                    _selectedHorses = horses;
                    if (_duplicateError) _duplicateError = false;
                  });
                },
              ),

              GLSpaces.px16,

              AssigneesDropdown(
                label: l10n.assignedGroom,
                hint: l10n.selectOption,
                selected: _selectedAssignees,
                onChanged: (assignees) {
                  setState(() {
                    _selectedAssignees = assignees;
                    if (_assigneeError) _assigneeError = false;
                  });
                },
                isDisabled: isCurrentUserGroom,
                validationError: _assigneeError,
              ),

              GLSpaces.px16,
              ReminderSwitchRow(
                text: l10n.sendTaskReminderToAssignee,
                value: _reminderEnabled,
                onChanged: (v) => setState(() => _reminderEnabled = v),
              ),
              GLSpaces.px16,
              DueDateTimeField(
                label: l10n.dueDate,
                hint: l10n.dueDateHint,
                controller: dueDateController,
                monthNames: _monthNames,
                years: _years,
                focused: _pickerFocused,
                selected: _pickerSelected,
                isError: isDueDateInvalid,
                errorText: l10n.dueDateErrorMsg,
                validationError: _dueDateError,
                onPicked: (selected, focused) => setState(() {
                  _pickerSelected = selected;
                  _pickerFocused = focused;
                  dueDateController.text = selected.mmmDdYyyyTime(
                    context.l10n.locale,
                  );
                  if (_dueDateError) _dueDateError = false;
                  if (_duplicateError) _duplicateError = false;
                }),
              ),
              GLSpaces.px32,
              _FormActions(
                canSubmit: _canSubmit,
                onSubmit: _onSave,
              ),
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

class _FormActions extends ConsumerWidget {
  const _FormActions({
    required this.canSubmit,
    required this.onSubmit,
  });

  final bool canSubmit;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isCreating = ref.watch(createTaskProvider) is LoadingCreateTaskState;

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
            onPressed: isCreating ? null : onSubmit,
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 12),
            ),
            child: isCreating
                ? const Center(
                    child: SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    ),
                  )
                : Text(
                    context.l10n.save,
                    style: const TextStyle(fontWeight: FontWeight.normal),
                  ),
          ),
        ),
      ],
    );
  }
}
