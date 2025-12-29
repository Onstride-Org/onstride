import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/lessons/providers/providers.dart';
import 'package:gl_horses/features/lessons/screens/create_lesson_request_screen.dart';
import 'package:gl_horses/features/lessons/widgets/widgets.dart';
import 'package:gl_horses/l10n/l10n.dart';
import 'package:go_router/go_router.dart';
import 'package:models/models.dart';

/// Main screen for viewing and managing lessons.
class LessonsScreen extends ConsumerStatefulWidget {
  const LessonsScreen({super.key});

  static String name = 'lessons';
  static String path = '/lessons';

  @override
  ConsumerState<LessonsScreen> createState() => _LessonsScreenState();
}

class _LessonsScreenState extends ConsumerState<LessonsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadLessons();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _loadLessons() {
    final account = ref.read(accountProvider);
    final user = account.currentUser;
    final barnId = user.barnId ?? '';

    // Load lessons based on role
    if (user.accountType == AccountType.owner ||
        user.accountType == AccountType.manager) {
      ref.read(fetchLessonsProvider.notifier).fetchForBarn(barnId: barnId);
      ref.read(fetchLessonRequestsProvider.notifier).fetchForTrainer(
            trainerId: user.id,
            barnId: barnId,
          );
    } else {
      ref.read(fetchLessonsProvider.notifier).fetchForClient(
            clientId: user.id,
            barnId: barnId,
          );
      ref.read(fetchLessonRequestsProvider.notifier).fetchForClient(
            clientId: user.id,
            barnId: barnId,
          );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final lessonsState = ref.watch(fetchLessonsProvider);
    final requestsState = ref.watch(fetchLessonRequestsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.lessons),
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(text: l10n.scheduledLessons),
            Tab(text: l10n.lessonRequests),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => context.push(CreateLessonRequestScreen.path),
          ),
        ],
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Scheduled Lessons Tab
          _buildLessonsTab(lessonsState),
          // Lesson Requests Tab
          _buildRequestsTab(requestsState),
        ],
      ),
    );
  }

  Widget _buildLessonsTab(FetchLessonsState state) {
    return switch (state) {
      InitialFetchLessonsState() => const Center(
          child: CircularProgressIndicator(),
        ),
      LoadingFetchLessonsState() => const Center(
          child: CircularProgressIndicator(),
        ),
      SuccessFetchLessonsState(:final lessons) => lessons.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.calendar_today, size: 64, color: Colors.grey),
                  const SizedBox(height: 16),
                  Text(
                    context.l10n.noLessonsScheduled,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ],
              ),
            )
          : LessonsListView(lessons: lessons),
      ErrorFetchLessonsState(:final message) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              Text(message),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _loadLessons,
                child: Text(context.l10n.retry),
              ),
            ],
          ),
        ),
    };
  }

  Widget _buildRequestsTab(FetchLessonRequestsState state) {
    return switch (state) {
      InitialFetchLessonRequestsState() => const Center(
          child: CircularProgressIndicator(),
        ),
      LoadingFetchLessonRequestsState() => const Center(
          child: CircularProgressIndicator(),
        ),
      SuccessFetchLessonRequestsState(:final requests) => requests.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.inbox, size: 64, color: Colors.grey),
                  const SizedBox(height: 16),
                  Text(
                    context.l10n.noLessonRequests,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ],
              ),
            )
          : LessonRequestsListView(requests: requests),
      ErrorFetchLessonRequestsState(:final message) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              Text(message),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _loadLessons,
                child: Text(context.l10n.retry),
              ),
            ],
          ),
        ),
    };
  }
}
