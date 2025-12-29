import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:models/models.dart';

class GLBottomTabNavigationBar extends ConsumerWidget {
  const GLBottomTabNavigationBar({
    required this.index,
    required this.onTap,
    this.tabController,
    super.key,
  });

  final int index;
  final ValueChanged<int> onTap;
  final TabController? tabController;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final primary = context.primaryColor;
    final user = ref.watch(accountProvider).currentUser;
    final isOwner = user.isOwner;
    final permissions = user.permissions;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            blurRadius: 20,
            color: context.shadowColor,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: AnimatedBuilder(
        animation: const AlwaysStoppedAnimation(0),
        builder: (_, _) {
          final tabIndex = index;
          final tabs = [
            if (permissions.contains(PermissionRole.horseManagement) || isOwner)
              TabItemClass(
                unSelectedIcon: GLIcons.horses,
                selectedIcon: GLIcons.horseshoefill_1,
                text: 'Horses',
              ),
            TabItemClass(
              unSelectedIcon: GLIcons.taskoutline,
              selectedIcon: GLIcons.taskfilled,
              text: 'Task',
            ),

            TabItemClass(
              unSelectedIcon: GLIcons.stableoutlined,
              selectedIcon: GLIcons.stablefilled_1,
              text: 'Stable',
            ),
            if (user.canGenerateInvoices || isOwner)
              TabItemClass(
                unSelectedIcon: GLIcons.invoice,
                selectedIcon: GLIcons.invoicefilled,
                text: 'Invoices',
              ),
          ];

          return SafeArea(
            child: TabBar(
              controller: tabController,
              dividerColor: Colors.transparent,
              labelColor: primary,
              unselectedLabelColor: context.hintColor,
              labelStyle: context.labelMedium.copyWith(
                fontWeight: FontWeight.w600,
              ),
              onTap: onTap,
              unselectedLabelStyle: context.labelMedium,
              indicator: BoxDecoration(
                border: Border(
                  top: BorderSide(color: primary, width: 2),
                ),
              ),

              indicatorSize: TabBarIndicatorSize.tab,
              tabs: List.generate(
                tabs.length,
                (index) {
                  final isSelected = index == tabIndex;
                  final tab = tabs[index];
                  return Tab(
                    icon: Icon(
                      isSelected ? tab.selectedIcon : tab.unSelectedIcon,
                    ),
                    text: tab.text,
                  );
                },
              ),
            ),
          );
        },
      ),
    );
  }
}

class TabItemClass {
  TabItemClass({
    required this.selectedIcon,
    required this.unSelectedIcon,
    required this.text,
    this.enable = false,
  });

  final IconData selectedIcon;
  final IconData unSelectedIcon;
  final String text;
  final bool enable;
}
