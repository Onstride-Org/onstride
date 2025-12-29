import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/lessons/providers/providers.dart';
import 'package:gl_horses/features/lessons/widgets/lesson_request_card.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:models/models.dart';

/// List view of lesson requests.
class LessonRequestsListView extends ConsumerWidget {
  const LessonRequestsListView({
    required this.requests,
    super.key,
  });

  final List<LessonRequestModel> requests;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final account = ref.watch(accountProvider);
    final user = account.currentUser;
    final isTrainer = user.accountType == AccountType.owner ||
        user.accountType == AccountType.manager;

    ref.listen(respondToLessonRequestProvider, (_, next) {
      if (next is SuccessRespondToRequestState) {
        ref.read(fetchLessonRequestsProvider.notifier).updateRequest(next.request);

        if (next.request.status == LessonStatus.approved) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(context.l10n.lessonApproved)),
          );
        } else if (next.request.status == LessonStatus.rejected) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(context.l10n.lessonDeclined)),
          );
        } else if (next.request.status == LessonStatus.countered) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(context.l10n.counterProposalSent)),
          );
        }
      } else if (next is ErrorRespondToRequestState) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(next.message)),
        );
      }
    });

    return ListView.builder(
      itemCount: requests.length,
      itemBuilder: (context, index) {
        final request = requests[index];
        final canRespond = request.isPending &&
            ((isTrainer && request.needsTrainerResponse) ||
             (!isTrainer && request.needsClientResponse));

        return LessonRequestCard(
          request: request,
          onApprove: canRespond
              ? () => _approveRequest(ref, request, user)
              : null,
          onReject: canRespond
              ? () => _showRejectDialog(context, ref, request, user)
              : null,
          onCounter: canRespond
              ? () => _showCounterDialog(context, ref, request, user)
              : null,
        );
      },
    );
  }

  void _approveRequest(WidgetRef ref, LessonRequestModel request, GLUser user) {
    final response = LessonRequestResponse(
      requestId: request.id,
      newStatus: LessonStatus.approved,
    );

    ref.read(respondToLessonRequestProvider.notifier).respond(
      requestId: request.id,
      barnId: request.barnId,
      response: response,
      responderId: user.id,
    );
  }

  void _showRejectDialog(
    BuildContext context,
    WidgetRef ref,
    LessonRequestModel request,
    GLUser user,
  ) {
    final reasonController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(context.l10n.declineRequest),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(context.l10n.declineRequestConfirmation),
            const SizedBox(height: 16),
            TextField(
              controller: reasonController,
              decoration: InputDecoration(
                labelText: context.l10n.reason,
                border: const OutlineInputBorder(),
              ),
              maxLines: 2,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text(context.l10n.cancel),
          ),
          FilledButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              final response = LessonRequestResponse(
                requestId: request.id,
                newStatus: LessonStatus.rejected,
                responseMessage: reasonController.text.trim(),
              );
              ref.read(respondToLessonRequestProvider.notifier).respond(
                requestId: request.id,
                barnId: request.barnId,
                response: response,
                responderId: user.id,
              );
            },
            child: Text(context.l10n.decline),
          ),
        ],
      ),
    );
  }

  void _showCounterDialog(
    BuildContext context,
    WidgetRef ref,
    LessonRequestModel request,
    GLUser user,
  ) {
    DateTime proposedDate = request.effectiveDate;
    int proposedDuration = request.effectiveDuration;
    final notesController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: Text(context.l10n.counterProposal),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(context.l10n.suggestAlternativeTime),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () async {
                          final date = await showDatePicker(
                            context: context,
                            initialDate: proposedDate,
                            firstDate: DateTime.now(),
                            lastDate: DateTime.now().add(const Duration(days: 90)),
                          );
                          if (date != null) {
                            setState(() {
                              proposedDate = DateTime(
                                date.year,
                                date.month,
                                date.day,
                                proposedDate.hour,
                                proposedDate.minute,
                              );
                            });
                          }
                        },
                        icon: const Icon(Icons.calendar_today),
                        label: Text('${proposedDate.month}/${proposedDate.day}'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () async {
                          final time = await showTimePicker(
                            context: context,
                            initialTime: TimeOfDay.fromDateTime(proposedDate),
                          );
                          if (time != null) {
                            setState(() {
                              proposedDate = DateTime(
                                proposedDate.year,
                                proposedDate.month,
                                proposedDate.day,
                                time.hour,
                                time.minute,
                              );
                            });
                          }
                        },
                        icon: const Icon(Icons.access_time),
                        label: Text('${proposedDate.hour}:${proposedDate.minute.toString().padLeft(2, '0')}'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<int>(
                  value: proposedDuration,
                  decoration: InputDecoration(
                    labelText: context.l10n.duration,
                    border: const OutlineInputBorder(),
                  ),
                  items: const [
                    DropdownMenuItem(value: 30, child: Text('30 minutes')),
                    DropdownMenuItem(value: 45, child: Text('45 minutes')),
                    DropdownMenuItem(value: 60, child: Text('1 hour')),
                    DropdownMenuItem(value: 90, child: Text('1.5 hours')),
                  ],
                  onChanged: (value) {
                    if (value != null) {
                      setState(() => proposedDuration = value);
                    }
                  },
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: notesController,
                  decoration: InputDecoration(
                    labelText: context.l10n.notes,
                    border: const OutlineInputBorder(),
                  ),
                  maxLines: 2,
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: Text(context.l10n.cancel),
            ),
            FilledButton(
              onPressed: () {
                Navigator.of(ctx).pop();
                final response = LessonRequestResponse(
                  requestId: request.id,
                  newStatus: LessonStatus.countered,
                  counterProposedDate: proposedDate,
                  counterProposedDuration: proposedDuration,
                  counterNotes: notesController.text.trim(),
                );
                ref.read(respondToLessonRequestProvider.notifier).respond(
                  requestId: request.id,
                  barnId: request.barnId,
                  response: response,
                  responderId: user.id,
                );
              },
              child: Text(context.l10n.sendCounter),
            ),
          ],
        ),
      ),
    );
  }
}
