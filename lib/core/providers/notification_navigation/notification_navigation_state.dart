import 'package:freezed_annotation/freezed_annotation.dart';

part 'notification_navigation_state.freezed.dart';

/// Navigation intents emitted by notification flow.
/// UI layer should consume an intent once and then call reset().
@freezed
sealed class NotificationNavigationState with _$NotificationNavigationState {
  const factory NotificationNavigationState.initial() =
      InitialNotificationNavigationState;

  /// Navigate to Task detail. May optionally drive Home + tab selection.
  const factory NotificationNavigationState.navigateToTask({
    required String taskId,
    required DateTime targetDate,
    required bool shouldNavigateToHome,
    required bool shouldSelectTaskTab,
  }) = NavigateToTaskState;

  /// Navigate directly to Invoice detail.
  const factory NotificationNavigationState.navigateToInvoice({
    required String invoiceId,
    required String barnId,
  }) = NavigateToInvoiceState;

  /// Feedback intents (errors / not found)
  const factory NotificationNavigationState.taskNotFound({
    required String taskId,
  }) = TaskNotFoundState;
}
