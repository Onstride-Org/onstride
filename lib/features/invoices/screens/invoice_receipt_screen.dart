import 'package:app_ui/app_ui.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:gl_horses/features/features.dart';
import 'package:gl_horses/features/invoices/providers/fetch_invoices/fetch_invoices_provider.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:models/models.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:gl_horses/features/invoices/screens/invoice_receipt_webview.dart'
    if (dart.library.html) 'package:gl_horses/features/invoices/screens/invoice_receipt_webview_stub.dart'
    as webview;

class InvoiceReceiptScreen extends ConsumerStatefulWidget {
  const InvoiceReceiptScreen({required this.invoiceId, super.key});

  static const path = 'receipt:id';
  static const name = 'receipt';

  final String invoiceId;

  @override
  ConsumerState<InvoiceReceiptScreen> createState() =>
      _InvoiceReceiptScreenState();
}

class _InvoiceReceiptScreenState extends ConsumerState<InvoiceReceiptScreen> {
  InvoiceModel? invoice;

  webview.WebViewWrapper? _webViewWrapper;

  @override
  void initState() {
    super.initState();

    if (!kIsWeb) {
      _webViewWrapper = webview.WebViewWrapper();
    }

    WidgetsBinding.instance.addPostFrameCallback((_) {
      invoice = ref
          .read(fetchInvoicesProvider)
          .getInvoiceById(widget.invoiceId);
      setState(() {});
      final url = invoice?.stripePaymentInfo?.receiptUrl;
      if (url != null && url.isNotEmpty) {
        _webViewWrapper?.loadUrl(url);
      }
    });
  }

  void _openReceipt() {
    final url = invoice?.stripePaymentInfo?.receiptUrl;
    if (url == null || url.isEmpty) return;
    if (kIsWeb) {
      launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
    } else {
      _webViewWrapper?.loadUrl(url);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    final inv = invoice;
    final lines = inv?.charges ?? const <InvoiceCharge>[];
    final totalCents = inv?.subtotalCents ?? 0.0;
    final totalPaid = inv?.subtotalCents ?? 0.0;
    final hasReceipt = (inv?.stripePaymentInfo?.receiptUrl ?? '').isNotEmpty;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.receipt),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: 16.edgeInsetsA,
              children: [
                ...[
                  for (final c in lines) ...[
                    _LineTile(
                      title: c.description,
                      subtitle: c.quantity == 1
                          ? '1 session'
                          : '${c.quantity} sessions',
                      price: _formatMoney(c.amount * c.quantity),
                    ),
                    GLSpaces.px12,
                  ],
                ],

                GLSpaces.px8,
                _PaymentMethodSection(
                  methodText: 'Payment method: Credit card',
                  lines: lines,
                  total: totalCents / 100,
                ),

                GLSpaces.px16,
                if (!kIsWeb && _webViewWrapper != null)
                  SizedBox(
                    height: 1.sh,
                    width: 1.sw,
                    child: _webViewWrapper!.buildWidget(),
                  )
                else
                  Container(
                    height: 200.h,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey.shade300),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.receipt_long, size: 48.sp, color: Colors.grey),
                        GLSpaces.px12,
                        Text(
                          'Click "Download receipt" to view',
                          style: GLTextStyles.bodyMedium,
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),

          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Theme.of(context).scaffoldBackgroundColor,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.06),
                  blurRadius: 10,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: SafeArea(
              top: false,
              child: Row(
                children: [
                  Expanded(
                    child: _TotalPaidBlock(
                      label: 'Total amount paid',
                      amountText: _formatMoney(totalPaid),
                    ),
                  ),
                  GLSpaces.px12,
                  Expanded(
                    child: ElevatedButton(
                      style: GLButtonStyles.primaryM,
                      onPressed: hasReceipt ? _openReceipt : null,
                      child: const Text('Download receipt'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------- UI Partials ----------------

class _LineTile extends StatelessWidget {
  const _LineTile({
    required this.title,
    required this.price,
    this.subtitle,
  });

  final String title;
  final String price;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: 4.edgeInsetsV,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title.isEmpty ? 'Item' : title,
                  style: GLTextStyles.bodyLarge.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (subtitle != null && subtitle!.isNotEmpty)
                  Padding(
                    padding: 4.edgeInsetsT,
                    child: Text(
                      subtitle!,
                      style: GLTextStyles.bodySmall.copyWith(
                        color: Theme.of(
                          context,
                        ).textTheme.bodySmall?.color?.withOpacity(0.7),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          Text(
            price,
            style: GLTextStyles.bodyLarge,
            textAlign: TextAlign.right,
          ),
        ],
      ),
    );
  }
}

class _PaymentMethodSection extends StatelessWidget {
  const _PaymentMethodSection({
    required this.methodText,
    required this.lines,
    required this.total,
  });

  final String methodText;
  final List<InvoiceCharge> lines;
  final double total;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: 8.edgeInsetsA,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            methodText,
            style: GLTextStyles.bodyLarge.copyWith(fontWeight: FontWeight.w600),
          ),
          GLSpaces.px12,
          ...[
            for (final c in lines)
              Padding(
                padding: 6.edgeInsetsV,
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        c.description,
                        style: GLTextStyles.bodyMedium.copyWith(
                          color: Theme.of(
                            context,
                          ).textTheme.bodyMedium?.color?.withOpacity(0.6),
                        ),
                      ),
                    ),
                    Text(
                      _formatMoney(c.amount * c.quantity),
                      style: GLTextStyles.bodyMedium,
                    ),
                  ],
                ),
              ),
            GLSpaces.px8,
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Total amount',
                    style: GLTextStyles.bodyMedium.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                Text(
                  _formatMoney(total),
                  style: GLTextStyles.bodyMedium.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _TotalPaidBlock extends StatelessWidget {
  const _TotalPaidBlock({
    required this.label,
    required this.amountText,
  });

  final String label;
  final String amountText;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GLTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600),
        ),
        GLSpaces.px4,
        Text(
          amountText,
          style: GLTextStyles.bodyLarge,
        ),
      ],
    );
  }
}

// ---------------- Utils ----------------

String _formatMoney(num amount) => '\$${amount.toStringAsFixed(2)}';
