import 'dart:async';

import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/features.dart';
import 'package:gl_horses/l10n/l10n.dart';

class HorsesScreenView extends ConsumerStatefulWidget {
  const HorsesScreenView({
    this.showGreeting = false,
    super.key,
  });

  final bool showGreeting;

  @override
  ConsumerState<HorsesScreenView> createState() => _HorsesScreenViewState();
}

class _HorsesScreenViewState extends ConsumerState<HorsesScreenView> {
  late TextEditingController searchController;
  final ScrollController _scrollController = ScrollController();
  Timer? _debounce;

  static const double _paginationThreshold = 20;

  @override
  void initState() {
    searchController = TextEditingController();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final barnId = ref.read(accountProvider).currentUser.barnId;
      if (barnId != null) {
        ref.read(fetchHorsesProvider.notifier).fetch(reload: true);
      }
    });

    searchController.addListener(() {
      _debounce?.cancel();
      _debounce = Timer(const Duration(milliseconds: 350), () {
        final notifier = ref.read(fetchHorsesProvider.notifier);
        final term = searchController.text.trim();
        notifier.changeSearchTerm(term);
        final barnId = ref.read(accountProvider).currentUser.barnId;
        if (barnId == null) return;
        if (term.isEmpty) {
          notifier.clearSearch();
        } else {
          notifier.search();
        }
      });
    });
    _scrollController.addListener(_onScroll);
    super.initState();
  }

  void _onScroll() {
    final state = ref.read(fetchHorsesProvider);
    if (state.isLoading) return;
    final position = _scrollController.position;
    final isCloseToBottom =
        position.pixels >= (position.maxScrollExtent - _paginationThreshold);

    if (!isCloseToBottom) return;

    final barnId = ref.read(accountProvider).currentUser.barnId;
    if (barnId == null) return;

    final notifier = ref.read(fetchHorsesProvider.notifier);
    if (state.isSearching) {
      notifier.search(searchTerm: searchController.text);
    } else {
      notifier.fetch();
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(fetchHorsesProvider);
    final horses = state.isSearching ? state.searchHorses : state.horses;
    final user = ref.watch(accountProvider).currentUser;

    return Scaffold(
      appBar: const GLAuthUserAppBar(),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 27),
        child: Column(
          children: [
            if (widget.showGreeting) ...[
              GLWelcomeGreeting(user: user),
              GLSpaces.px12,
            ],
            const ManageHorses(),
            GLSpaces.px12,
            _HorsesSearchField(
              controller: searchController,
              hintText: context.l10n.searchHorseHint,
              onClear: () {
                ref.read(fetchHorsesProvider.notifier).clearSearch();
                FocusScope.of(context).unfocus();
              },
            ),
            GLSpaces.px16,
            Expanded(
              child: horses.isEmpty && !state.isLoading
                  ? state.isSearching
                        ? Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Text(
                                context.l10n.noHorsesFound,
                                style: context.bodyLarge,
                              ),
                              Text(
                                context
                                    .l10n
                                    .weCouldnTFindAnyHorsesMatchingYourSearch,
                                style: context.bodyMedium.copyWith(
                                  color: context.hintColor,
                                ),
                              ),
                            ],
                          )
                        : const _EmptyHorses()
                  : RefreshIndicator(
                      onRefresh: () async =>
                          ref.read(fetchHorsesProvider.notifier).reload(),
                      child: GridView.builder(
                        controller: _scrollController,
                        itemCount: horses.length,
                        padding: 16.edgeInsetsB,
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              crossAxisSpacing: 16,
                              mainAxisSpacing: 16,
                              childAspectRatio: 1.05,
                            ),
                        itemBuilder: (context, index) {
                          final horse = horses[index];
                          return HorseCard(horse: horse);
                        },
                      ),
                    ),
            ),
            if (state.isLoading && horses.isEmpty) ...[
              const GLBouncingDotsIndicator(),
              const Spacer(flex: 2),
            ],
            AnimatedSize(
              duration: kThemeAnimationDuration,
              child: (state.isLoading && horses.isNotEmpty)
                  ? GLBouncingDotsIndicator(size: 6.sp)
                  : const SizedBox.shrink(),
            ),
          ],
        ),
      ),
    );
  }
}

class _HorsesSearchField extends StatelessWidget {
  const _HorsesSearchField({
    required this.controller,
    required this.hintText,
    this.onClear,
    super.key,
  });

  final TextEditingController controller;
  final String hintText;
  final VoidCallback? onClear;

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
                },
              )
            : null,
      ),
      onChanged: (_) {
        (context as Element).markNeedsBuild();
      },
    );
  }
}

class _EmptyHorses extends StatelessWidget {
  const _EmptyHorses();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: 40.edgeInsetsH,
        child: NotResultsWidget.data(
          title: context.l10n.youHavenTSetAnyHorseYet,
          description: '',
        ),
      ),
    );
  }
}
