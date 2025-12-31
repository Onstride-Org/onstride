import 'package:flutter/material.dart';
import 'package:models/models.dart';

import '../services/services.dart';
import '../widgets/widgets.dart';

/// App settings screen with language, theme, and preferences
class SettingsScreen extends StatefulWidget {
  const SettingsScreen({
    required this.settings,
    required this.onSettingsChanged,
    super.key,
  });

  final UserAppSettings settings;
  final ValueChanged<UserAppSettings> onSettingsChanged;

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late UserAppSettings _settings;

  @override
  void initState() {
    super.initState();
    _settings = widget.settings;
  }

  void _updateSettings(UserAppSettings newSettings) {
    setState(() => _settings = newSettings);
    widget.onSettingsChanged(newSettings);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final layout = ResponsiveService.getLayoutInfo(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: SingleChildScrollView(
        padding: layout.contentPadding,
        child: ResponsiveContent(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Language & Region
              LanguageSettingsCard(
                settings: _settings,
                onSettingsChanged: _updateSettings,
              ),

              const SizedBox(height: 16),

              // Appearance
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.palette, color: theme.colorScheme.primary),
                          const SizedBox(width: 8),
                          Text(
                            'Appearance',
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      ListTile(
                        title: const Text('Theme'),
                        subtitle: Text(_settings.themeMode),
                        leading: Icon(_getThemeIcon(_settings.themeMode)),
                        trailing: DropdownButton<String>(
                          value: _settings.themeMode,
                          underline: const SizedBox.shrink(),
                          onChanged: (value) {
                            if (value != null) {
                              _updateSettings(
                                  _settings.copyWith(themeMode: value));
                            }
                          },
                          items: const [
                            DropdownMenuItem(
                                value: 'system', child: Text('System')),
                            DropdownMenuItem(
                                value: 'light', child: Text('Light')),
                            DropdownMenuItem(
                                value: 'dark', child: Text('Dark')),
                          ],
                        ),
                        contentPadding: EdgeInsets.zero,
                      ),
                      const Divider(),
                      SwitchListTile(
                        title: const Text('Compact Mode'),
                        subtitle:
                            const Text('Use smaller spacing and elements'),
                        value: _settings.compactMode,
                        onChanged: (value) {
                          _updateSettings(
                              _settings.copyWith(compactMode: value));
                        },
                        contentPadding: EdgeInsets.zero,
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // Notifications
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.notifications,
                              color: theme.colorScheme.primary),
                          const SizedBox(width: 8),
                          Text(
                            'Notifications',
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      SwitchListTile(
                        title: const Text('Push Notifications'),
                        subtitle:
                            const Text('Receive notifications on your device'),
                        value: _settings.pushNotificationsEnabled,
                        onChanged: (value) {
                          _updateSettings(_settings.copyWith(
                              pushNotificationsEnabled: value));
                        },
                        contentPadding: EdgeInsets.zero,
                      ),
                      const Divider(),
                      SwitchListTile(
                        title: const Text('Email Notifications'),
                        subtitle: const Text('Receive updates via email'),
                        value: _settings.emailNotificationsEnabled,
                        onChanged: (value) {
                          _updateSettings(_settings.copyWith(
                              emailNotificationsEnabled: value));
                        },
                        contentPadding: EdgeInsets.zero,
                      ),
                      const Divider(),
                      ListTile(
                        title: const Text('Quiet Hours'),
                        subtitle: Text(_settings.quietHoursEnabled
                            ? '${_settings.quietHoursStart} - ${_settings.quietHoursEnd}'
                            : 'Off'),
                        leading: const Icon(Icons.bedtime),
                        trailing: Switch(
                          value: _settings.quietHoursEnabled,
                          onChanged: (value) {
                            _updateSettings(
                                _settings.copyWith(quietHoursEnabled: value));
                          },
                        ),
                        contentPadding: EdgeInsets.zero,
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // Data & Privacy
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.security,
                              color: theme.colorScheme.primary),
                          const SizedBox(width: 8),
                          Text(
                            'Data & Privacy',
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      SwitchListTile(
                        title: const Text('Auto-Sync'),
                        subtitle: const Text(
                            'Automatically sync data when connected'),
                        value: _settings.autoSyncEnabled,
                        onChanged: (value) {
                          _updateSettings(
                              _settings.copyWith(autoSyncEnabled: value));
                        },
                        contentPadding: EdgeInsets.zero,
                      ),
                      const Divider(),
                      SwitchListTile(
                        title: const Text('Analytics'),
                        subtitle: const Text(
                            'Help improve the app by sharing usage data'),
                        value: _settings.analyticsEnabled,
                        onChanged: (value) {
                          _updateSettings(
                              _settings.copyWith(analyticsEnabled: value));
                        },
                        contentPadding: EdgeInsets.zero,
                      ),
                      const Divider(),
                      ListTile(
                        title: const Text('Export My Data'),
                        subtitle: const Text(
                            'Download a copy of your data'),
                        leading: const Icon(Icons.download),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () {
                          // Export data
                        },
                        contentPadding: EdgeInsets.zero,
                      ),
                      const Divider(),
                      ListTile(
                        title: Text(
                          'Delete My Account',
                          style: TextStyle(color: theme.colorScheme.error),
                        ),
                        subtitle: const Text(
                            'Permanently delete your account and data'),
                        leading: Icon(Icons.delete_forever,
                            color: theme.colorScheme.error),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => _showDeleteAccountDialog(),
                        contentPadding: EdgeInsets.zero,
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // About
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.info, color: theme.colorScheme.primary),
                          const SizedBox(width: 8),
                          Text(
                            'About',
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      ListTile(
                        title: const Text('Version'),
                        subtitle: const Text('1.0.0 (Build 1)'),
                        contentPadding: EdgeInsets.zero,
                      ),
                      const Divider(),
                      ListTile(
                        title: const Text('Terms of Service'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () {},
                        contentPadding: EdgeInsets.zero,
                      ),
                      const Divider(),
                      ListTile(
                        title: const Text('Privacy Policy'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () {},
                        contentPadding: EdgeInsets.zero,
                      ),
                      const Divider(),
                      ListTile(
                        title: const Text('Open Source Licenses'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () {
                          showLicensePage(context: context);
                        },
                        contentPadding: EdgeInsets.zero,
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  IconData _getThemeIcon(String themeMode) {
    switch (themeMode) {
      case 'light':
        return Icons.light_mode;
      case 'dark':
        return Icons.dark_mode;
      default:
        return Icons.brightness_auto;
    }
  }

  void _showDeleteAccountDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Account'),
        content: const Text(
          'Are you sure you want to delete your account? '
          'This action cannot be undone and all your data will be permanently deleted.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              // Handle account deletion
            },
            style: TextButton.styleFrom(
              foregroundColor: Theme.of(context).colorScheme.error,
            ),
            child: const Text('Delete Account'),
          ),
        ],
      ),
    );
  }
}
