import 'package:app_ui/app_ui.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/branding/providers/providers.dart';
import 'package:gl_horses/features/branding/widgets/widgets.dart';
import 'package:models/models.dart';

class BrandingScreen extends ConsumerStatefulWidget {
  const BrandingScreen({required this.barnId, super.key});

  static const name = 'branding';
  static const path = '/barns/:barnId/branding';

  final String barnId;

  @override
  ConsumerState<BrandingScreen> createState() => _BrandingScreenState();
}

class _BrandingScreenState extends ConsumerState<BrandingScreen> {
  final _formKey = GlobalKey<FormState>();

  Color? _primaryColor;
  Color? _secondaryColor;
  Color? _accentColor;

  final _welcomeMessageController = TextEditingController();
  final _invoiceFooterController = TextEditingController();
  final _customDomainController = TextEditingController();
  final _facebookController = TextEditingController();
  final _instagramController = TextEditingController();
  final _websiteController = TextEditingController();

  bool _showLogoOnInvoices = true;
  bool _showAddressOnInvoices = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(fetchBrandingProvider.notifier).fetch(barnId: widget.barnId);
    });
  }

  @override
  void dispose() {
    _welcomeMessageController.dispose();
    _invoiceFooterController.dispose();
    _customDomainController.dispose();
    _facebookController.dispose();
    _instagramController.dispose();
    _websiteController.dispose();
    super.dispose();
  }

  void _loadBrandingData(BarnBranding? branding) {
    if (branding == null) return;

    _primaryColor = branding.primaryColor != null
        ? Color(int.parse(branding.primaryColor!.replaceFirst('#', '0xFF')))
        : null;
    _secondaryColor = branding.secondaryColor != null
        ? Color(int.parse(branding.secondaryColor!.replaceFirst('#', '0xFF')))
        : null;
    _accentColor = branding.accentColor != null
        ? Color(int.parse(branding.accentColor!.replaceFirst('#', '0xFF')))
        : null;

    _welcomeMessageController.text = branding.welcomeMessage ?? '';
    _invoiceFooterController.text = branding.invoiceFooter ?? '';
    _customDomainController.text = branding.customDomain ?? '';
    _facebookController.text = branding.facebookUrl ?? '';
    _instagramController.text = branding.instagramUrl ?? '';
    _websiteController.text = branding.websiteUrl ?? '';
    _showLogoOnInvoices = branding.showLogoOnInvoices;
    _showAddressOnInvoices = branding.showAddressOnInvoices;
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(fetchBrandingProvider);

    ref.listen<FetchBrandingState>(fetchBrandingProvider, (previous, next) {
      if (next is SuccessFetchBrandingState && previous is! SuccessFetchBrandingState) {
        _loadBrandingData(next.branding);
      }
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text('Barn Branding'),
        actions: [
          TextButton(
            onPressed: _saveBranding,
            child: const Text('Save'),
          ),
        ],
      ),
      body: state.when(
        initial: () => const Center(child: CircularProgressIndicator()),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (message) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: GLColors.error500),
              GLSpaces.px16,
              Text(message),
              GLSpaces.px16,
              ElevatedButton(
                onPressed: () => ref
                    .read(fetchBrandingProvider.notifier)
                    .fetch(barnId: widget.barnId),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        success: (branding) {
          return Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Logos Section
                Text(
                  'Logos',
                  style: context.headlineSmall,
                ),
                GLSpaces.px16,
                LogoUploadSection(
                  title: 'Main Logo',
                  description: 'Recommended: 400x100px, PNG or SVG',
                  logoUrl: branding?.logoUrl,
                  onUpload: () => _uploadLogo(false),
                  onDelete: () => _deleteLogo(false),
                ),
                GLSpaces.px16,
                LogoUploadSection(
                  title: 'Icon/Favicon',
                  description: 'Recommended: 512x512px, square PNG',
                  logoUrl: branding?.logoIconUrl,
                  onUpload: () => _uploadLogo(true),
                  onDelete: () => _deleteLogo(true),
                  isIcon: true,
                ),

                GLSpaces.px32,

                // Colors Section
                Text(
                  'Brand Colors',
                  style: context.headlineSmall,
                ),
                GLSpaces.px16,
                ColorPickerTile(
                  label: 'Primary Color',
                  color: _primaryColor,
                  onColorChanged: (c) => setState(() => _primaryColor = c),
                ),
                ColorPickerTile(
                  label: 'Secondary Color',
                  color: _secondaryColor,
                  onColorChanged: (c) => setState(() => _secondaryColor = c),
                ),
                ColorPickerTile(
                  label: 'Accent Color',
                  color: _accentColor,
                  onColorChanged: (c) => setState(() => _accentColor = c),
                ),

                GLSpaces.px32,

                // Custom Messages Section
                Text(
                  'Custom Messages',
                  style: context.headlineSmall,
                ),
                GLSpaces.px16,
                TextFormField(
                  controller: _welcomeMessageController,
                  decoration: const InputDecoration(
                    labelText: 'Welcome Message',
                    hintText: 'Displayed on the dashboard',
                  ),
                  maxLines: 2,
                ),
                GLSpaces.px16,
                TextFormField(
                  controller: _invoiceFooterController,
                  decoration: const InputDecoration(
                    labelText: 'Invoice Footer',
                    hintText: 'Displayed at the bottom of invoices',
                  ),
                  maxLines: 2,
                ),

                GLSpaces.px32,

                // Invoice Branding Section
                Text(
                  'Invoice Branding',
                  style: context.headlineSmall,
                ),
                GLSpaces.px16,
                SwitchListTile(
                  title: const Text('Show Logo on Invoices'),
                  value: _showLogoOnInvoices,
                  onChanged: (v) => setState(() => _showLogoOnInvoices = v),
                  contentPadding: EdgeInsets.zero,
                ),
                SwitchListTile(
                  title: const Text('Show Address on Invoices'),
                  value: _showAddressOnInvoices,
                  onChanged: (v) => setState(() => _showAddressOnInvoices = v),
                  contentPadding: EdgeInsets.zero,
                ),

                GLSpaces.px32,

                // Social Links Section
                Text(
                  'Social Links',
                  style: context.headlineSmall,
                ),
                GLSpaces.px16,
                TextFormField(
                  controller: _facebookController,
                  decoration: const InputDecoration(
                    labelText: 'Facebook URL',
                    prefixIcon: Icon(Icons.facebook),
                  ),
                  keyboardType: TextInputType.url,
                ),
                GLSpaces.px16,
                TextFormField(
                  controller: _instagramController,
                  decoration: const InputDecoration(
                    labelText: 'Instagram URL',
                    prefixIcon: Icon(Icons.camera_alt_outlined),
                  ),
                  keyboardType: TextInputType.url,
                ),
                GLSpaces.px16,
                TextFormField(
                  controller: _websiteController,
                  decoration: const InputDecoration(
                    labelText: 'Website URL',
                    prefixIcon: Icon(Icons.language),
                  ),
                  keyboardType: TextInputType.url,
                ),

                GLSpaces.px32,

                // Custom Domain Section
                Text(
                  'Custom Domain',
                  style: context.headlineSmall,
                ),
                GLSpaces.px8,
                Text(
                  'Use your own domain for your barn portal',
                  style: context.bodySmall.copyWith(color: GLColors.neutral500),
                ),
                GLSpaces.px16,
                TextFormField(
                  controller: _customDomainController,
                  decoration: const InputDecoration(
                    labelText: 'Custom Domain',
                    hintText: 'e.g., portal.yourbarn.com',
                    prefixIcon: Icon(Icons.link),
                  ),
                  keyboardType: TextInputType.url,
                ),

                GLSpaces.px32,

                // Reset Button
                OutlinedButton.icon(
                  onPressed: _confirmReset,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Reset to Defaults'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: GLColors.error600,
                    side: const BorderSide(color: GLColors.error600),
                  ),
                ),

                GLSpaces.px32,
              ],
            ),
          );
        },
      ),
    );
  }

  String _colorToHex(Color? color) {
    if (color == null) return '';
    return '#${color.value.toRadixString(16).substring(2).toUpperCase()}';
  }

  Future<void> _saveBranding() async {
    if (!_formKey.currentState!.validate()) return;

    final state = ref.read(fetchBrandingProvider);
    if (state is! SuccessFetchBrandingState) return;

    final existingBranding = state.branding;
    final branding = BarnBranding(
      id: existingBranding?.id ?? '',
      barnId: widget.barnId,
      logoUrl: existingBranding?.logoUrl,
      logoIconUrl: existingBranding?.logoIconUrl,
      primaryColor: _colorToHex(_primaryColor),
      secondaryColor: _colorToHex(_secondaryColor),
      accentColor: _colorToHex(_accentColor),
      welcomeMessage: _welcomeMessageController.text.isNotEmpty
          ? _welcomeMessageController.text
          : null,
      invoiceFooter: _invoiceFooterController.text.isNotEmpty
          ? _invoiceFooterController.text
          : null,
      showLogoOnInvoices: _showLogoOnInvoices,
      showAddressOnInvoices: _showAddressOnInvoices,
      facebookUrl: _facebookController.text.isNotEmpty
          ? _facebookController.text
          : null,
      instagramUrl: _instagramController.text.isNotEmpty
          ? _instagramController.text
          : null,
      websiteUrl: _websiteController.text.isNotEmpty
          ? _websiteController.text
          : null,
      customDomain: _customDomainController.text.isNotEmpty
          ? _customDomainController.text
          : null,
      updatedAt: DateTime.now(),
    );

    await ref.read(fetchBrandingProvider.notifier).saveBranding(branding);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Branding saved successfully')),
      );
    }
  }

  Future<void> _uploadLogo(bool isIcon) async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.image,
      allowMultiple: false,
    );

    if (result != null && result.files.isNotEmpty) {
      final file = result.files.first;
      if (file.path != null) {
        await ref.read(fetchBrandingProvider.notifier).uploadLogo(
              barnId: widget.barnId,
              filePath: file.path!,
              isIcon: isIcon,
            );
      }
    }
  }

  Future<void> _deleteLogo(bool isIcon) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(isIcon ? 'Delete Icon' : 'Delete Logo'),
        content: const Text('Are you sure you want to delete this image?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: GLColors.error600),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await ref.read(fetchBrandingProvider.notifier).deleteLogo(
            barnId: widget.barnId,
            isIcon: isIcon,
          );
    }
  }

  Future<void> _confirmReset() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reset Branding'),
        content: const Text(
          'This will reset all branding settings to defaults and delete all uploaded logos. This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: GLColors.error600),
            child: const Text('Reset'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final user = ref.read(accountProvider).currentUser;
      await ref.read(fetchBrandingProvider.notifier).resetBranding(
            barnId: widget.barnId,
            resetBy: user.id,
          );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Branding reset to defaults')),
        );
      }
    }
  }
}
