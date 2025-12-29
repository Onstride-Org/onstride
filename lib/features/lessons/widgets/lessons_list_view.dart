import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/lessons/providers/providers.dart';
import 'package:gl_horses/features/lessons/widgets/lesson_card.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:models/models.dart';

/// List view of scheduled lessons.
class LessonsListView extends ConsumerWidget {
  const LessonsListView({
    required this.lessons,
    super.key,
  });

  final List<LessonModel> lessons;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final account = ref.watch(accountProvider);
    final user = account.currentUser;

    ref.listen(manageLessonProvider, (_, next) {
      if (next is SuccessManageLessonState) {
        ref.read(fetchLessonsProvider.notifier).updateLesson(next.lesson);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.l10n.lessonUpdated)),
        );
      } else if (next is ErrorManageLessonState) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(next.message)),
        );
      }
    });

    return ListView.builder(
      itemCount: lessons.length,
      itemBuilder: (context, index) {
        final lesson = lessons[index];
        return LessonCard(
          lesson: lesson,
          onComplete: lesson.canComplete
              ? () => _completeLesson(ref, lesson)
              : null,
          onCancel: lesson.canCancel
              ? () => _showCancelDialog(context, ref, lesson, user.id)
              : null,
        );
      },
    );
  }

  void _completeLesson(WidgetRef ref, LessonModel lesson) {
    ref.read(manageLessonProvider.notifier).complete(
      id: lesson.id,
      barnId: lesson.barnId,
    );
  }

  void _showCancelDialog(
    BuildContext context,
    WidgetRef ref,
    LessonModel lesson,
    String userId,
  ) {
    final reasonController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(context.l10n.cancelLesson),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(context.l10n.cancelLessonConfirmation),
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
            child: Text(context.l10n.no),
          ),
          FilledButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              ref.read(manageLessonProvider.notifier).cancel(
                id: lesson.id,
                barnId: lesson.barnId,
                cancelledBy: userId,
                reason: reasonController.text.trim(),
              );
            },
            child: Text(context.l10n.yes),
          ),
        ],
      ),
    );
  }
}
