import 'package:flutter/material.dart';
import 'package:models/models.dart';

/// Language picker dropdown
class LanguagePicker extends StatelessWidget {
  const LanguagePicker({
    required this.selectedLanguage,
    required this.onLanguageChanged,
    super.key,
  });

  final AppLanguage selectedLanguage;
  final ValueChanged<AppLanguage> onLanguageChanged;

  @override
  Widget build(BuildContext context) {
    return DropdownButton<AppLanguage>(
      value: selectedLanguage,
      onChanged: (value) {
        if (value != null) {
          onLanguageChanged(value);
        }
      },
      items: AppLanguage.values.map((language) {
        return DropdownMenuItem(
          value: language,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(_getFlag(language)),
              const SizedBox(width: 8),
              Text(_getLanguageName(language)),
            ],
          ),
        );
      }).toList(),
    );
  }

  String _getFlag(AppLanguage language) {
    switch (language) {
      case AppLanguage.english:
        return '🇺🇸';
      case AppLanguage.spanish:
        return '🇪🇸';
      case AppLanguage.french:
        return '🇫🇷';
      case AppLanguage.german:
        return '🇩🇪';
      case AppLanguage.portuguese:
        return '🇧🇷';
    }
  }

  String _getLanguageName(AppLanguage language) {
    switch (language) {
      case AppLanguage.english:
        return 'English';
      case AppLanguage.spanish:
        return 'Español';
      case AppLanguage.french:
        return 'Français';
      case AppLanguage.german:
        return 'Deutsch';
      case AppLanguage.portuguese:
        return 'Português';
    }
  }
}

/// Language selection tile for settings
class LanguageSelectionTile extends StatelessWidget {
  const LanguageSelectionTile({
    required this.selectedLanguage,
    required this.onLanguageChanged,
    super.key,
  });

  final AppLanguage selectedLanguage;
  final ValueChanged<AppLanguage> onLanguageChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return ListTile(
      leading: const Icon(Icons.language),
      title: const Text('Language'),
      subtitle: Text(_getLanguageName(selectedLanguage)),
      trailing: const Icon(Icons.chevron_right),
      onTap: () => _showLanguageDialog(context),
    );
  }

  void _showLanguageDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Select Language'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: AppLanguage.values.map((language) {
            return RadioListTile<AppLanguage>(
              value: language,
              groupValue: selectedLanguage,
              onChanged: (value) {
                if (value != null) {
                  onLanguageChanged(value);
                  Navigator.of(context).pop();
                }
              },
              title: Row(
                children: [
                  Text(_getFlag(language)),
                  const SizedBox(width: 12),
                  Text(_getLanguageName(language)),
                ],
              ),
            );
          }).toList(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }

  String _getFlag(AppLanguage language) {
    switch (language) {
      case AppLanguage.english:
        return '🇺🇸';
      case AppLanguage.spanish:
        return '🇪🇸';
      case AppLanguage.french:
        return '🇫🇷';
      case AppLanguage.german:
        return '🇩🇪';
      case AppLanguage.portuguese:
        return '🇧🇷';
    }
  }

  String _getLanguageName(AppLanguage language) {
    switch (language) {
      case AppLanguage.english:
        return 'English';
      case AppLanguage.spanish:
        return 'Español';
      case AppLanguage.french:
        return 'Français';
      case AppLanguage.german:
        return 'Deutsch';
      case AppLanguage.portuguese:
        return 'Português';
    }
  }
}

/// Full language settings card
class LanguageSettingsCard extends StatelessWidget {
  const LanguageSettingsCard({
    required this.settings,
    required this.onSettingsChanged,
    super.key,
  });

  final UserAppSettings settings;
  final ValueChanged<UserAppSettings> onSettingsChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.translate, color: theme.colorScheme.primary),
                const SizedBox(width: 8),
                Text(
                  'Language & Region',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            ListTile(
              title: const Text('App Language'),
              subtitle: Text(_getLanguageName(settings.language)),
              leading: Text(
                _getFlag(settings.language),
                style: const TextStyle(fontSize: 24),
              ),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => _showLanguageSelector(context),
              contentPadding: EdgeInsets.zero,
            ),
            const Divider(),
            ListTile(
              title: const Text('Date Format'),
              subtitle: Text(settings.dateFormat),
              leading: const Icon(Icons.calendar_today),
              trailing: DropdownButton<String>(
                value: settings.dateFormat,
                underline: const SizedBox.shrink(),
                onChanged: (value) {
                  if (value != null) {
                    onSettingsChanged(settings.copyWith(dateFormat: value));
                  }
                },
                items: const [
                  DropdownMenuItem(value: 'MM/DD/YYYY', child: Text('MM/DD/YYYY')),
                  DropdownMenuItem(value: 'DD/MM/YYYY', child: Text('DD/MM/YYYY')),
                  DropdownMenuItem(value: 'YYYY-MM-DD', child: Text('YYYY-MM-DD')),
                ],
              ),
              contentPadding: EdgeInsets.zero,
            ),
            const Divider(),
            ListTile(
              title: const Text('Time Format'),
              subtitle: Text(settings.timeFormat),
              leading: const Icon(Icons.access_time),
              trailing: DropdownButton<String>(
                value: settings.timeFormat,
                underline: const SizedBox.shrink(),
                onChanged: (value) {
                  if (value != null) {
                    onSettingsChanged(settings.copyWith(timeFormat: value));
                  }
                },
                items: const [
                  DropdownMenuItem(value: '12h', child: Text('12-hour')),
                  DropdownMenuItem(value: '24h', child: Text('24-hour')),
                ],
              ),
              contentPadding: EdgeInsets.zero,
            ),
            const Divider(),
            ListTile(
              title: const Text('Measurement Units'),
              subtitle: Text(settings.measurementUnit),
              leading: const Icon(Icons.straighten),
              trailing: DropdownButton<String>(
                value: settings.measurementUnit,
                underline: const SizedBox.shrink(),
                onChanged: (value) {
                  if (value != null) {
                    onSettingsChanged(settings.copyWith(measurementUnit: value));
                  }
                },
                items: const [
                  DropdownMenuItem(value: 'imperial', child: Text('Imperial')),
                  DropdownMenuItem(value: 'metric', child: Text('Metric')),
                ],
              ),
              contentPadding: EdgeInsets.zero,
            ),
          ],
        ),
      ),
    );
  }

  void _showLanguageSelector(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'Select Language',
                style: Theme.of(context).textTheme.titleLarge,
              ),
            ),
            ...AppLanguage.values.map((language) {
              return ListTile(
                leading: Text(
                  _getFlag(language),
                  style: const TextStyle(fontSize: 24),
                ),
                title: Text(_getLanguageName(language)),
                trailing: settings.language == language
                    ? const Icon(Icons.check, color: Colors.green)
                    : null,
                onTap: () {
                  onSettingsChanged(settings.copyWith(language: language));
                  Navigator.of(context).pop();
                },
              );
            }),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  String _getFlag(AppLanguage language) {
    switch (language) {
      case AppLanguage.english:
        return '🇺🇸';
      case AppLanguage.spanish:
        return '🇪🇸';
      case AppLanguage.french:
        return '🇫🇷';
      case AppLanguage.german:
        return '🇩🇪';
      case AppLanguage.portuguese:
        return '🇧🇷';
    }
  }

  String _getLanguageName(AppLanguage language) {
    switch (language) {
      case AppLanguage.english:
        return 'English';
      case AppLanguage.spanish:
        return 'Español';
      case AppLanguage.french:
        return 'Français';
      case AppLanguage.german:
        return 'Deutsch';
      case AppLanguage.portuguese:
        return 'Português';
    }
  }
}
