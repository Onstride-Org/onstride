import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:models/models.dart';

/// Displays USEF/FEI registration information for a horse.
class HorseRegistrationCard extends StatelessWidget {
  const HorseRegistrationCard({required this.horse, super.key});

  final HorseModel horse;

  @override
  Widget build(BuildContext context) {
    final hasRegistration = horse.usefNumber != null ||
        horse.feiNumber != null ||
        horse.registeredName != null;

    if (!hasRegistration) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Registration',
                style: context.titleMedium.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              GLSpaces.px16,
              Center(
                child: Column(
                  children: [
                    Icon(
                      Icons.badge_outlined,
                      size: 48,
                      color: GLColors.neutral400,
                    ),
                    GLSpaces.px8,
                    Text(
                      'No registration information',
                      style: context.bodyMedium.copyWith(
                        color: GLColors.neutral500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  'Registration',
                  style: context.titleMedium.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                if (horse.registrySyncedAt != null)
                  Text(
                    'Synced ${_formatDate(horse.registrySyncedAt!)}',
                    style: context.bodySmall.copyWith(
                      color: GLColors.neutral500,
                    ),
                  ),
              ],
            ),
            GLSpaces.px16,

            // Registered Name
            if (horse.registeredName != null) ...[
              _RegistrationRow(
                icon: Icons.text_fields,
                label: 'Registered Name',
                value: horse.registeredName!,
              ),
              GLSpaces.px12,
            ],

            // USEF Number
            if (horse.usefNumber != null) ...[
              _RegistrationRow(
                icon: Icons.flag_outlined,
                label: 'USEF',
                value: horse.usefNumber!,
                copyable: true,
              ),
              GLSpaces.px12,
            ],

            // FEI Number
            if (horse.feiNumber != null) ...[
              _RegistrationRow(
                icon: Icons.public,
                label: 'FEI',
                value: horse.feiNumber!,
                copyable: true,
              ),
              GLSpaces.px12,
            ],

            // Stride Number
            if (horse.strideNumber != null) ...[
              _RegistrationRow(
                icon: Icons.tag,
                label: 'Stride ID',
                value: horse.strideNumber!,
                copyable: true,
                highlight: true,
              ),
            ],

            // Competition History
            if (horse.competitionHistory != null &&
                horse.competitionHistory!.isNotEmpty) ...[
              GLSpaces.px8,
              const Divider(),
              GLSpaces.px8,
              Text(
                'Competition History',
                style: context.bodyMedium.copyWith(
                  fontWeight: FontWeight.w500,
                ),
              ),
              GLSpaces.px8,
              Text(
                horse.competitionHistory!,
                style: context.bodySmall.copyWith(
                  color: GLColors.neutral600,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.month}/${date.day}/${date.year}';
  }
}

class _RegistrationRow extends StatelessWidget {
  const _RegistrationRow({
    required this.icon,
    required this.label,
    required this.value,
    this.copyable = false,
    this.highlight = false,
  });

  final IconData icon;
  final String label;
  final String value;
  final bool copyable;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(
          icon,
          size: 20,
          color: highlight ? GLColors.brand600 : GLColors.neutral600,
        ),
        GLSpaces.px8,
        Text(
          '$label:',
          style: context.bodyMedium.copyWith(
            fontWeight: FontWeight.w500,
          ),
        ),
        GLSpaces.px8,
        Expanded(
          child: Text(
            value,
            style: context.bodyMedium.copyWith(
              fontFamily: copyable ? 'monospace' : null,
              color: highlight ? GLColors.brand600 : null,
              fontWeight: highlight ? FontWeight.w600 : null,
            ),
          ),
        ),
        if (copyable)
          IconButton(
            icon: const Icon(Icons.copy, size: 18),
            onPressed: () {
              Clipboard.setData(ClipboardData(text: value));
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('$label copied to clipboard'),
                  duration: const Duration(seconds: 2),
                ),
              );
            },
            tooltip: 'Copy',
            visualDensity: VisualDensity.compact,
          ),
      ],
    );
  }
}
