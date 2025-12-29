import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/features.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:go_router/go_router.dart';
import 'package:models/models.dart';

class InvoicesScreen extends ConsumerStatefulWidget {
  const InvoicesScreen({
    this.showGreeting = false,
    this.boarderId,
    super.key,
  });

  final bool showGreeting;
  final String? boarderId;

  static const path = 'invoices/:boarderId';
  static const name = 'invoices';

  @override
  ConsumerState<InvoicesScreen> createState() => _InvoicesScreenState();
}

class _InvoicesScreenState extends ConsumerState<InvoicesScreen> {
  final _searchCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(fetchInvoicesProvider.notifier)
        ..setBoarderId(widget.boarderId)
        ..fetch(reload: true);
    });
    _scrollCtrl.addListener(() {
      final state = ref.read(fetchInvoicesProvider);
      if (!state.isSearching &&
          state.hasMoreData &&
          !state.isLoading &&
          _scrollCtrl.position.pixels >=
              _scrollCtrl.position.maxScrollExtent - 200) {
        ref.read(fetchInvoicesProvider.notifier).fetch();
      }
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _statusListener(FetchInvoicesState? previous, FetchInvoicesState next) {
    if (next.exception != null) {
      context.showDataException(next.exception!);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(fetchInvoicesProvider);
    final l10n = context.l10n;
    final user = ref.watch(accountProvider).currentUser;
    final invoices = state.isSearching ? state.searchInvoices : state.invoices;
    ref.listen(fetchInvoicesProvider, _statusListener);
    return Scaffold(
      appBar: widget.boarderId != null
          ? AppBar(title: Text(l10n.invoicesTitle))
          : const GLAuthUserAppBar(title: SizedBox()),
      body: Column(
        children: [
          if (widget.showGreeting)
            Padding(
              padding: 16.edgeInsetsH,
              child: GLWelcomeGreeting(user: user),
            ),
          if (user.isOwner || user.canGenerateInvoices) ...[
            Padding(
              padding: 16.edgeInsetsH,
              child: Padding(
                padding: 8.edgeInsetsA,
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        l10n.invoicesTitle,
                        style: context.titleMedium.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),

                    IconButton(
                      onPressed: () async {
                        final res = await context.pushNamed(
                          CreateEditInvoiceScreen.name,
                        );
                        if (res is InvoiceModel && context.mounted) {
                          context.showSuccess(
                            title: context.l10n.invoiceCreated,
                            // action: AppSnackBarAction(
                            //   label: 'Undo',
                            //   action: () => ref
                            //       .read(deleteInvoiceProvider.notifier)
                            //       .deleteInvoice(invoice: res),
                            // ),
                          );
                        }
                      },
                      color: context.primaryColor,
                      style: IconButton.styleFrom(
                        backgroundColor: GLColors.brand600,
                        padding: 2.edgeInsetsA,
                        fixedSize: Size.square(28.sp),
                        maximumSize: Size.square(28.sp),
                        minimumSize: Size.square(0.sp),
                      ),
                      icon: FittedBox(
                        child: Icon(
                          GLIcons.add,
                          color: context.backgroundColor,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],

          Padding(
            padding: 16.edgeInsetsH,
            child: _InvoicesSearchField(
              controller: _searchCtrl,
              hintText: l10n.searchYourInvoice,
              onChanged: (value) {
                ref
                    .read(fetchInvoicesProvider.notifier)
                    .changeSearchTerm(value);
                if (value.trim().isEmpty) {
                  ref.read(fetchInvoicesProvider.notifier).clearSearch();
                } else {
                  ref.read(fetchInvoicesProvider.notifier).search(reload: true);
                }
              },
              onClear: () {
                _searchCtrl.clear();
                ref.read(fetchInvoicesProvider.notifier).clearSearch();
                FocusScope.of(context).unfocus();
              },
            ),
          ),

          Expanded(
            child: invoices.isEmpty && !state.isLoading
                ? state.isSearching
                      ? Padding(
                          padding: 16.edgeInsetsA,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Text(
                                context.l10n.noInvoicesFound,
                                style: context.bodyLarge,
                              ),
                              Text(
                                context
                                    .l10n
                                    .weCouldnTFindAnyInvoicesMatchingYourSearch,
                                style: context.bodyMedium.copyWith(
                                  color: context.hintColor,
                                ),
                              ),
                            ],
                          ),
                        )
                      : const _EmptyInvoices()
                : Stack(
                    children: [
                      InvoicesListView(
                        scrollCtrl: _scrollCtrl,
                        invoices: invoices,
                      ),
                      if (state.isLoading && invoices.isEmpty)
                        const Center(child: GLBouncingDotsIndicator()),
                      if (state.isLoading && invoices.isNotEmpty)
                        const Align(
                          alignment: Alignment.bottomCenter,
                          child: Padding(
                            padding: EdgeInsets.only(bottom: 12),
                            child: GLBouncingDotsIndicator(),
                          ),
                        ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}

class _InvoicesSearchField extends StatelessWidget {
  const _InvoicesSearchField({
    required this.controller,
    required this.hintText,
    this.onClear,
    this.onChanged,
    super.key,
  });

  final TextEditingController controller;
  final String hintText;
  final VoidCallback? onClear;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      decoration: InputDecoration(
        prefixIcon: Icon(
          GLIcons.seach,
          color: context.hintColor,
        ),
        hintStyle: TextStyle(color: context.hintColor),
        hintText: hintText,
        suffixIcon: controller.text.isNotEmpty
            ? IconButton(
                icon: const Icon(GLIcons.x),
                onPressed: () {
                  controller.clear();
                  onClear?.call();
                  (context as Element).markNeedsBuild();
                },
              )
            : null,
      ),
      onChanged: (value) {
        onChanged?.call(value);
        (context as Element).markNeedsBuild();
      },
    );
  }
}

class _EmptyInvoices extends StatelessWidget {
  const _EmptyInvoices();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: 40.edgeInsetsH,
        child: NotResultsWidget.data(
          title: context.l10n.youHavenTSetAnyInvoiceYet,
          description: '',
        ),
      ),
    );
  }
}
