// add_edit_horse_dialog.dart
import 'dart:io';

import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/features.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:go_router/go_router.dart';
import 'package:models/models.dart';

class AddEditHorseDialog extends ConsumerStatefulWidget {
  const AddEditHorseDialog({super.key, this.horse});

  final HorseModel? horse;

  static Future<HorseModel?> show(BuildContext context, {HorseModel? horse}) {
    return showModalBottomSheet<HorseModel?>(
      context: context,
      backgroundColor: context.backgroundColor,
      isScrollControlled: true,
      builder: (_) {
        return SizedBox(
          height: .9.sh,
          child: AddEditHorseDialog(horse: horse),
        );
      },
    );
  }

  @override
  ConsumerState<AddEditHorseDialog> createState() => _AddEditHorseDialogState();
}

class _AddEditHorseDialogState extends ConsumerState<AddEditHorseDialog> {
  final _formKey = GlobalKey<FormState>();
  final nameController = TextEditingController();
  final colorController = TextEditingController();
  final birthdayController = TextEditingController();

  HorseSexStatus? sexStatus;
  HorseBreed? breed;
  HorseStatus? status;
  StallPosition? stall;
  GLUser? boarder;
  DateTime? birthday;

  @override
  void initState() {
    super.initState();

    final horse = widget.horse;
    if (horse != null) {
      birthday = horse.birthday;
      nameController.text = horse.name;
      colorController.text = horse.color ?? '';
      birthdayController.text = horse.birthday.mmDdYy;
      sexStatus = horse.sexStatus;
      breed = horse.breed;
      status = horse.status;
    }

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = ref.read(accountProvider).currentUser;
      ref.read(fetchUsersProvider.notifier).fetchUsers();
      boarder = user.isBoarder
          ? user
          : ref.read(fetchUsersProvider).getUserById(horse?.boarderId);
      stall = ref
          .read(accountProvider.notifier)
          .getStallPositionById(horse?.stallId);
      setState(() {});
    });
  }

  @override
  void dispose() {
    nameController.dispose();
    colorController.dispose();
    birthdayController.dispose();
    super.dispose();
  }

  void _editorListener(HorseEditorState? previous, HorseEditorState next) {
    switch (next.status) {
      case RequestStatus.initial:
        return;
      case RequestStatus.loading:
        return showInvisibleLoadingDialog(context);
      case RequestStatus.success:
        context.pop();
        context
          ..showSuccess(
            title: widget.horse == null
                ? context.l10n.createdSuccess
                : context.l10n.updatedSuccess,
          )
          ..pop(next.horse);
        _updateStallPositions(next.horse?.id);
        return;
      case RequestStatus.error:
        context.pop();
        context.pop();
        context.showDataException(next.exception!);
        return;
    }
  }

  String _resolveBarnId() {
    final fromHorse = widget.horse?.barnId;
    if (fromHorse != null && fromHorse.isNotEmpty) return fromHorse;
    final accountState = ref.read(accountProvider);
    return accountState.currentBarn?.id ?? accountState.currentUser.barnId!;
  }

  void _onSubmit() {
    final l10n = context.l10n;
    FocusScope.of(context).unfocus();

    final isEditing = widget.horse != null;
    if (!_formKey.currentState!.validate() ||
        breed == null ||
        sexStatus == null) {
      context.showError(title: l10n.pleaseCompleteAllFields);
      return;
    }

    final barnId = _resolveBarnId();
    if (birthday == null) {
      context.showError(title: l10n.pleaseCompleteAllFields);
      return;
    }

    final request = HorseRequest(
      name: nameController.text.trim(),
      barnId: barnId,
      createdById: ref.read(accountProvider).currentUser.id,
      sexStatus: sexStatus!,
      breed: breed!,
      age: _calcAge(birthday!),
      birthday: birthday!,
      color: colorController.text.trim().isEmpty
          ? null
          : colorController.text.trim(),
      boarderId: boarder?.id,
      status: status,
      stallId: stall?.id,
    );

    final editor = ref.read(horseEditorProvider.notifier);
    if (isEditing) {
      editor.update(
        horseId: widget.horse!,
        request: request,
        boarder: boarder,
      );
    } else {
      editor.create(request, boarder);
    }
  }

  Future<void> _updateStallPositions(String? horseId) async {
    final oldStall = widget.horse?.stallId;
    final newStall = stall?.id;
    final accountNotifier = ref.read(accountProvider.notifier);
    if (newStall != null) {
      try {
        accountNotifier.assignHorseToStall(newStall, horseId);
      } catch (e) {
        if (mounted) {
          context.showError(title: context.l10n.assignHorseToStallError);
        }
        rethrow;
      }
    } else if (oldStall != null && newStall == null) {
      accountNotifier.assignHorseToStall(oldStall, null);
    }
  }

  int _calcAge(DateTime birthday) {
    final now = DateTime.now();
    int age = now.year - birthday.year;
    final hadBirthday =
        (now.month > birthday.month) ||
        (now.month == birthday.month && now.day >= birthday.day);
    if (!hadBirthday) age -= 1;
    return age;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final isEditing = widget.horse != null;

    ref.listen<HorseEditorState>(horseEditorProvider, _editorListener);
    final state = ref.watch(horseEditorProvider);
    final user = ref.watch(accountProvider).currentUser;
    final assignToStall = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        FormLabel(l10n.assignToStall),
        GLSpaces.px8,
        BarnStallSelector(
          horse: widget.horse,
          onChanged: (value) => setState(() => stall = value),
        ),
      ],
    );
    return Padding(
      padding: MediaQuery.of(context).viewInsets + 24.edgeInsetsA,
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              isEditing ? l10n.editTitle : l10n.createTitle,
              style: context.headlineSmall,
            ),
            if (!isEditing)
              Text(
                l10n.createSubtitle,
                style: const TextStyle(fontWeight: FontWeight.normal),
              ),
            GLSpaces.px24,
            Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  FormLabel(l10n.name),
                  GLSpaces.px8,
                  TextFormField(
                    controller: nameController,
                    maxLength: 15,
                    textCapitalization: TextCapitalization.words,
                    decoration: InputDecoration(
                      hintText: l10n.horseNameHint,
                      helperText: l10n.horseNameHelper,
                    ),
                    validator: (value) => FormValidator.noEmpty(
                      value,
                      emptyMessage: l10n.nameRequired,
                    ),
                  ),
                  GLSpaces.px16,
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            FormLabel(l10n.breed),
                            GLSpaces.px8,
                            BreedSelector(
                              onChanged: (value) {
                                setState(() => breed = value);
                              },
                              breed: breed,
                            ),
                          ],
                        ),
                      ),
                      GLSpaces.px12,
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            FormLabel(l10n.sex),
                            GLSpaces.px8,
                            SexStatusSelector(
                              onChanged: (value) {
                                setState(() => sexStatus = value);
                              },
                              sexStatus: sexStatus,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  GLSpaces.px16,
                  FormLabel(l10n.horseColor),
                  GLSpaces.px8,
                  TextFormField(
                    controller: colorController,
                    textCapitalization: TextCapitalization.sentences,
                    decoration: InputDecoration(
                      hintText: l10n.colorHint,
                    ),
                    validator: (value) => FormValidator.minLength(
                      value,
                      minLength: 3,
                      emptyMessage: l10n.colorRequired,
                      invalidMessage: l10n.colorInvalid,
                    ),
                  ),
                  GLSpaces.px16,
                  FormLabel(l10n.dobLabel),
                  GLSpaces.px8,
                  FormField<DateTime>(
                    initialValue: birthday,
                    validator: (value) => FormValidator.noEmpty(
                      value?.toIso8601String(),
                      emptyMessage: l10n.dobRequired,
                    ),
                    builder: (field) => Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        BirthdateInput(
                          initialDate: birthday,
                          maxYear: DateTime.now().year,
                          onChanged: (date, isExact) {
                            setState(() => birthday = date);
                            birthdayController.text = date == null
                                ? ''
                                : '${date.month.toString().padLeft(2, '0')}/'
                                      '${date.day.toString().padLeft(2, '0')}/'
                                      '${date.year}';
                            field.didChange(date);
                          },
                        ),
                        if (field.hasError) ...[
                          GLSpaces.px8,
                          Text(
                            field.errorText!,
                            style: context.bodySmall.copyWith(
                              color: GLColors.error500,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  GLSpaces.px16,
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      if (!user.isBoarder) ...[
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              FormLabel(l10n.boarder),
                              GLSpaces.px8,
                              BoarderSelector(
                                onChanged: (value) {
                                  setState(() => boarder = value);
                                },
                                boarder: boarder,
                              ),
                            ],
                          ),
                        ),
                        GLSpaces.px12,
                      ],
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            FormLabel(l10n.status),
                            GLSpaces.px8,
                            HorseStatusSelector(
                              onChanged: (value) =>
                                  setState(() => status = value),
                              status: status,
                            ),
                          ],
                        ),
                      ),
                      // if (user.isBoarder) ...[
                      //   GLSpaces.px12,
                      //   Expanded(child: assignToStall),
                      // ],
                    ],
                  ),
                  if (!user.isBoarder) ...[
                    GLSpaces.px16,
                    assignToStall,
                  ],
                  GLSpaces.px16,
                  HorseDocumentsPicker(
                    documents: (widget.horse?.documents ?? const [])
                        .where(
                          (doc) => !state.documentsToDelete.any(
                            (d) => d.path == doc.path,
                          ),
                        )
                        .toList(),
                    onDocumentsChanged: (List<File> files) {
                      ref.read(horseEditorProvider.notifier).clearFiles();
                      if (files.isNotEmpty) {
                        ref.read(horseEditorProvider.notifier).addFiles(files);
                      }
                    },
                    onRemoveExisting: (GLHorsesDocument doc) async {
                      final confirm = await ConfirmDialog.show(
                        context,
                        title: l10n.removeDocument,
                        description: l10n.removeDocumentDescription,
                        caption: Padding(
                          padding: 8.edgeInsetsT,
                          child: ExistingDocTile(document: doc),
                        ),
                      );
                      if (confirm != null && confirm) {
                        ref
                            .read(horseEditorProvider.notifier)
                            .markDocumentToDelete(doc);
                      }
                    },
                  ),

                  GLSpaces.px24,
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: context.pop,
                          style: GLButtonStyles.outlineM,
                          child: Text(l10n.cancel),
                        ),
                      ),
                      GLSpaces.px16,
                      Expanded(
                        child: ElevatedButton(
                          onPressed: _onSubmit,
                          style: GLButtonStyles.primaryM,
                          child: Text(isEditing ? l10n.update : l10n.save),
                        ),
                      ),
                    ],
                  ),
                  GLSpaces.px40,
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
