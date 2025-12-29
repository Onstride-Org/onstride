import 'package:data_provider_client/data_provider_client.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:gl_horses/core/common/common.dart';
import 'package:gl_horses/core/config/dependency_injection/repository/repository_providers.dart';
import 'package:invoices_repository/invoices_repository.dart';
import 'package:models/models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'delete_invoice_provider.freezed.dart';
part 'delete_invoice_provider.g.dart';
part 'delete_invoice_state.dart';

@riverpod
class DeleteInvoice extends _$DeleteInvoice with ProviderGuardMixin {
  @override
  DeleteInvoiceState build() => const DeleteInvoiceState.initial();

  InvoicesRepository get _repository => ref.read(invoicesRepositoryProvider);

  Future<void> deleteInvoice({
    required InvoiceModel invoice,
  }) async {
    await guard<void>(
      onStart: () => state = const DeleteInvoiceState.loading(),
      action: () => _repository.deleteInvoice(invoice: invoice),
      onSuccess: (_) => state = DeleteInvoiceState.success(invoice),
      onException: (e) => state = DeleteInvoiceState.error(e),
    );
  }
}
