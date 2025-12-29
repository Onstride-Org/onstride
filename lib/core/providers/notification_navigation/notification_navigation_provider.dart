import 'package:gl_horses/core/providers/notification_navigation/notification_navigation_state.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'notification_navigation_provider.g.dart';

@riverpod
class NotificationNavigation extends _$NotificationNavigation {
  @override
  NotificationNavigationState build() =>
      const NotificationNavigationState.initial();

  // -------------------- Tasks --------------------

  /// Legacy entrypoint used by Task notifications
  void handleTaskTap(String taskId, DateTime targetDate) {
    if (taskId.isEmpty) return;

    state = NotificationNavigationState.navigateToTask(
      taskId: taskId,
      targetDate: targetDate,
      shouldNavigateToHome: true,
      shouldSelectTaskTab: true,
    );
  }

  /// Used when the task is already on screen / context restored
  void handleTaskFound(String taskId, DateTime targetDate) {
    state = NotificationNavigationState.navigateToTask(
      taskId: taskId,
      targetDate: targetDate,
      shouldNavigateToHome: false,
      shouldSelectTaskTab: false,
    );
  }

  void handleTaskNotFound(String taskId) {
    state = NotificationNavigationState.taskNotFound(taskId: taskId);
  }

  // -------------------- Invoices --------------------
  void handleInvoiceTap(String invoiceId, String barnId) {
    if (invoiceId.isEmpty) return;
    state = NotificationNavigationState.navigateToInvoice(
      invoiceId: invoiceId,
      barnId: barnId,
    );
  }

  // -------------------- Reset --------------------

  void reset() {
    state = const NotificationNavigationState.initial();
  }
}
