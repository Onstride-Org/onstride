import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/features/notifications/providers/notification_preferences/notification_preferences_provider.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:go_router/go_router.dart';
import 'package:models/models.dart';

/// Screen for managing notification preferences.
class NotificationPreferencesScreen extends ConsumerStatefulWidget {
  const NotificationPreferencesScreen({super.key});

  static const path = 'notification-preferences';
  static const name = 'notification-preferences';

  @override
  ConsumerState<NotificationPreferencesScreen> createState() =>
      _NotificationPreferencesScreenState();
}

class _NotificationPreferencesScreenState
    extends ConsumerState<NotificationPreferencesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref
          .read(notificationPreferencesNotifierProvider.notifier)
          .loadPreferences();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(notificationPreferencesNotifierProvider);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: context.pop,
        ),
        title: Text(context.l10n.notificationPreferences),
        centerTitle: true,
      ),
      body: _buildBody(state),
    );
  }

  Widget _buildBody(NotificationPreferencesState state) {
    if (state is LoadingNotificationPreferencesState) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state is ErrorNotificationPreferencesState) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 48, color: Colors.red.shade300),
            const SizedBox(height: 16),
            Text(state.message),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                ref
                    .read(notificationPreferencesNotifierProvider.notifier)
                    .loadPreferences();
              },
              child: Text(context.l10n.retry),
            ),
          ],
        ),
      );
    }

    if (state is! LoadedNotificationPreferencesState &&
        state is! SavingNotificationPreferencesState) {
      return const SizedBox.shrink();
    }

    // Get preferences from either loaded or saving state
    final prefs = state is LoadedNotificationPreferencesState
        ? state.preferences
        : const NotificationPreferences();

    final isSaving = state is SavingNotificationPreferencesState;

    return Stack(
      children: [
        ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Master toggles
            _SectionCard(
              title: context.l10n.generalSettings,
              children: [
                _SwitchTile(
                  title: context.l10n.pushNotifications,
                  subtitle: context.l10n.pushNotificationsDescription,
                  value: prefs.pushEnabled,
                  onChanged: (value) {
                    ref
                        .read(notificationPreferencesNotifierProvider.notifier)
                        .togglePushNotifications(value);
                  },
                ),
                const Divider(height: 1),
                _SwitchTile(
                  title: context.l10n.emailNotifications,
                  subtitle: context.l10n.emailNotificationsDescription,
                  value: prefs.emailEnabled,
                  onChanged: (value) {
                    ref
                        .read(notificationPreferencesNotifierProvider.notifier)
                        .toggleEmailNotifications(value);
                  },
                ),
              ],
            ),

            const SizedBox(height: 16),

            // Task notifications
            _SectionCard(
              title: context.l10n.taskNotifications,
              children: [
                _SwitchTile(
                  title: context.l10n.taskAssigned,
                  subtitle: context.l10n.taskAssignedDescription,
                  value: prefs.tasks.onAssigned,
                  enabled: prefs.pushEnabled,
                  onChanged: (value) {
                    ref
                        .read(notificationPreferencesNotifierProvider.notifier)
                        .updateTaskSettings(onAssigned: value);
                  },
                ),
                const Divider(height: 1),
                _SwitchTile(
                  title: context.l10n.taskDueSoon,
                  subtitle: context.l10n.taskDueSoonDescription,
                  value: prefs.tasks.onDueSoon,
                  enabled: prefs.pushEnabled,
                  onChanged: (value) {
                    ref
                        .read(notificationPreferencesNotifierProvider.notifier)
                        .updateTaskSettings(onDueSoon: value);
                  },
                ),
                const Divider(height: 1),
                _SwitchTile(
                  title: context.l10n.taskCompleted,
                  subtitle: context.l10n.taskCompletedDescription,
                  value: prefs.tasks.onCompleted,
                  enabled: prefs.pushEnabled,
                  onChanged: (value) {
                    ref
                        .read(notificationPreferencesNotifierProvider.notifier)
                        .updateTaskSettings(onCompleted: value);
                  },
                ),
                const Divider(height: 1),
                _SwitchTile(
                  title: context.l10n.taskOverdue,
                  subtitle: context.l10n.taskOverdueDescription,
                  value: prefs.tasks.onOverdue,
                  enabled: prefs.pushEnabled,
                  onChanged: (value) {
                    ref
                        .read(notificationPreferencesNotifierProvider.notifier)
                        .updateTaskSettings(onOverdue: value);
                  },
                ),
              ],
            ),

            const SizedBox(height: 16),

            // Invoice notifications
            _SectionCard(
              title: context.l10n.invoiceNotifications,
              children: [
                _SwitchTile(
                  title: context.l10n.invoiceCreated,
                  subtitle: context.l10n.invoiceCreatedDescription,
                  value: prefs.invoices.onCreated,
                  enabled: prefs.pushEnabled,
                  onChanged: (value) {
                    ref
                        .read(notificationPreferencesNotifierProvider.notifier)
                        .updateInvoiceSettings(onCreated: value);
                  },
                ),
                const Divider(height: 1),
                _SwitchTile(
                  title: context.l10n.invoiceDueSoon,
                  subtitle: context.l10n.invoiceDueSoonDescription,
                  value: prefs.invoices.onDueSoon,
                  enabled: prefs.pushEnabled,
                  onChanged: (value) {
                    ref
                        .read(notificationPreferencesNotifierProvider.notifier)
                        .updateInvoiceSettings(onDueSoon: value);
                  },
                ),
                const Divider(height: 1),
                _SwitchTile(
                  title: context.l10n.invoicePaid,
                  subtitle: context.l10n.invoicePaidDescription,
                  value: prefs.invoices.onPaid,
                  enabled: prefs.pushEnabled,
                  onChanged: (value) {
                    ref
                        .read(notificationPreferencesNotifierProvider.notifier)
                        .updateInvoiceSettings(onPaid: value);
                  },
                ),
              ],
            ),

            const SizedBox(height: 16),

            // Ride log notifications
            _SectionCard(
              title: context.l10n.rideLogNotifications,
              children: [
                _SwitchTile(
                  title: context.l10n.rideLogged,
                  subtitle: context.l10n.rideLoggedDescription,
                  value: prefs.rideLogs.onRideLogged,
                  enabled: prefs.pushEnabled,
                  onChanged: (value) {
                    ref
                        .read(notificationPreferencesNotifierProvider.notifier)
                        .updateRideLogSettings(onRideLogged: value);
                  },
                ),
                const Divider(height: 1),
                _SwitchTile(
                  title: context.l10n.weeklySummary,
                  subtitle: context.l10n.weeklySummaryDescription,
                  value: prefs.rideLogs.weeklySummary,
                  enabled: prefs.emailEnabled,
                  onChanged: (value) {
                    ref
                        .read(notificationPreferencesNotifierProvider.notifier)
                        .updateRideLogSettings(weeklySummary: value);
                  },
                ),
              ],
            ),

            const SizedBox(height: 24),
          ],
        ),
        if (isSaving)
          Container(
            color: Colors.black.withValues(alpha: 0.1),
            child: const Center(child: CircularProgressIndicator()),
          ),
      ],
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({
    required this.title,
    required this.children,
  });

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            title,
            style: context.titleMedium.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(children: children),
        ),
      ],
    );
  }
}

class _SwitchTile extends StatelessWidget {
  const _SwitchTile({
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
    this.enabled = true,
  });

  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: enabled ? 1.0 : 0.5,
      child: SwitchListTile(
        title: Text(
          title,
          style: context.bodyMedium.copyWith(fontWeight: FontWeight.w500),
        ),
        subtitle: Text(
          subtitle,
          style: context.bodySmall.copyWith(color: context.hintColor),
        ),
        value: value,
        onChanged: enabled ? onChanged : null,
        activeColor: context.primaryColor,
      ),
    );
  }
}
