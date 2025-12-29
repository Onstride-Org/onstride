import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/features/users/providers/fetch_owner_users/fetch_owner_users_provider.dart';
import 'package:models/models.dart';

class AssigneesDropdown extends ConsumerWidget {
  const AssigneesDropdown({
    required this.label,
    required this.hint,
    required this.selected,
    required this.onChanged,
    this.isDisabled = false,
    this.validationError = false,
    super.key,
  });

  final String label;
  final String hint;

  final List<GLUser> selected;
  final ValueChanged<List<GLUser>> onChanged;

  final bool isDisabled;
  final bool validationError;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(fetchUsersProvider);
    final users = state.allUsers;

    final borderColor = validationError ? GLColors.error400 : null;

    final dropdown = GLMultiselectDropdown<GLUser>(
      items: users,
      selectedItems: selected,
      hintLabel: hint,
      enabled: !isDisabled,
      onChanged: onChanged,
      hasBorder: borderColor == null,
      itemBuilder: (user) {
        return Container(
          width: double.infinity,
          padding: 12.edgeInsetsV,
          child: Text(
            user.name ?? '',
            overflow: TextOverflow.ellipsis,
          ),
        );
      },
      selectedItemBuilder: (user) => Text(
        user.name ?? '',
        overflow: TextOverflow.ellipsis,
        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
          color: isDisabled ? Colors.grey : null,
        ),
      ),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.bodyMedium),
        GLSpaces.px8,
        if (borderColor != null)
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: borderColor),
            ),
            child: dropdown,
          )
        else
          dropdown,
      ],
    );
  }
}
