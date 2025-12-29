import 'package:auth_repository/auth_repository.dart';
import 'package:data_provider_client/data_provider_client.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/profile/providers/delete_account_prevention_reason.dart';
import 'package:invoices_repository/invoices_repository.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:tasks_repository/tasks_repository.dart';

part 'delete_account_validation_provider.freezed.dart';
part 'delete_account_validation_provider.g.dart';
part 'delete_account_validation_state.dart';

@riverpod
class DeleteAccountValidation extends _$DeleteAccountValidation {
  AuthRepository get _authRepository => ref.read(authRepositoryProvider);

  TasksRepository get _tasksRepository => ref.read(tasksRepositoryProvider);

  InvoicesRepository get _invoicesRepository =>
      ref.read(invoicesRepositoryProvider);

  Future<DeleteAccountValidationResult> validateAccountDeletion({
    required GLUser user,
    required String password,
  }) async {
    try {
      state = const DeleteAccountValidationState.loading();

      // Re-authenticate user with password
      await _authRepository.reAuthenticateForDeleteAccount(password: password);

      // Check if user is Owner - block all Owner accounts
      if (user.isOwner) {
        state = const DeleteAccountValidationState.prevented(
          reason: DeleteAccountPreventionReason.ownerAccount,
        );
        return const DeleteAccountValidationResult.prevented(
          reason: DeleteAccountPreventionReason.ownerAccount,
        );
      }

      // Check if user is Boarder with outstanding invoices
      if (user.isBoarder) {
        final hasOutstandingInvoices = await _checkOutstandingInvoices(user);
        if (hasOutstandingInvoices) {
          state = const DeleteAccountValidationState.prevented(
            reason: DeleteAccountPreventionReason.outstandingInvoices,
          );
          return const DeleteAccountValidationResult.prevented(
            reason: DeleteAccountPreventionReason.outstandingInvoices,
          );
        }
      }

      final assignedTasks = await _getAssignedTasks(user);
      if (assignedTasks.isNotEmpty) {
        await _unassignTasks(assignedTasks, user.id);
      }
      state = const DeleteAccountValidationState.valid();
      return const DeleteAccountValidationResult.valid();
    } on AuthenticationException {
      state = const DeleteAccountValidationState.error(
        reason: DeleteAccountPreventionReason.authenticationFailed,
      );
      return const DeleteAccountValidationResult.error(
        reason: DeleteAccountPreventionReason.authenticationFailed,
      );
    } on DataProviderException {
      state = const DeleteAccountValidationState.error(
        reason: DeleteAccountPreventionReason.dataValidationFailed,
      );
      return const DeleteAccountValidationResult.error(
        reason: DeleteAccountPreventionReason.dataValidationFailed,
      );
    } catch (e) {
      state = const DeleteAccountValidationState.error(
        reason: DeleteAccountPreventionReason.unknownError,
      );
      return const DeleteAccountValidationResult.error(
        reason: DeleteAccountPreventionReason.unknownError,
      );
    }
  }

  Future<bool> _checkOutstandingInvoices(GLUser user) async {
    try {
      final invoices = await _invoicesRepository.fetchInvoices(
        barnId: user.barnId ?? '',
        reload: true,
        boarderId: user.id,
      );

      final outstandingInvoices = invoices
          .where((invoice) => invoice.status == InvoiceStatus.pending)
          .toList();

      return outstandingInvoices.isNotEmpty;
    } catch (e) {
      return false;
    }
  }

  Future<List<TaskModel>> _getAssignedTasks(GLUser user) async {
    try {
      final tasks = await _tasksRepository.fetchAndUpdateTasks(
        groomId: user.isGroomer ? user.id : null,
        barnId: user.barnId,
      );

      // Check for incomplete tasks
      return tasks
          .where(
            (task) =>
                task.status != TaskStatus.completed &&
                task.assigneeIds.contains(user.id),
          )
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> _unassignTasks(List<TaskModel> tasks, String userId) async {
    try {
      for (final task in tasks) {
        final updatedTask = task.copyWith(
          assignees: [...task.assignees]..removeWhere((e) => e.id == userId),
          updatedAt: DateTime.now(),
        );
        await _tasksRepository.updateTask(task: updatedTask);
      }
    } catch (e) {
      rethrow;
    }
  }

  @override
  DeleteAccountValidationState build() =>
      const DeleteAccountValidationState.initial();
}

@freezed
sealed class DeleteAccountValidationState with _$DeleteAccountValidationState {
  const factory DeleteAccountValidationState.initial() =
      InitialDeleteAccountValidationState;

  const factory DeleteAccountValidationState.loading() =
      LoadingDeleteAccountValidationState;

  const factory DeleteAccountValidationState.valid() =
      ValidDeleteAccountValidationState;

  const factory DeleteAccountValidationState.prevented({
    required DeleteAccountPreventionReason reason,
  }) = PreventedDeleteAccountValidationState;

  const factory DeleteAccountValidationState.error({
    required DeleteAccountPreventionReason reason,
  }) = ErrorDeleteAccountValidationState;
}

@freezed
sealed class DeleteAccountValidationResult
    with _$DeleteAccountValidationResult {
  const factory DeleteAccountValidationResult.valid() =
      ValidDeleteAccountValidationResult;

  const factory DeleteAccountValidationResult.prevented({
    required DeleteAccountPreventionReason reason,
  }) = PreventedDeleteAccountValidationResult;

  const factory DeleteAccountValidationResult.error({
    required DeleteAccountPreventionReason reason,
  }) = ErrorDeleteAccountValidationResult;
}
