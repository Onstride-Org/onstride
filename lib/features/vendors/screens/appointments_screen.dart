import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gl_horses/core/core.dart';
import 'package:gl_horses/features/vendors/providers/providers.dart';
import 'package:gl_horses/features/vendors/widgets/widgets.dart';
import 'package:models/models.dart';

class AppointmentsScreen extends ConsumerStatefulWidget {
  const AppointmentsScreen({required this.barnId, super.key});

  static const name = 'appointments';
  static const path = '/barns/:barnId/appointments';

  final String barnId;

  @override
  ConsumerState<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends ConsumerState<AppointmentsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  AppointmentStatus? _statusFilter;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(fetchAppointmentsProvider.notifier).fetchForBarn(
            barnId: widget.barnId,
          );
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(fetchAppointmentsProvider);
    final user = ref.watch(accountProvider).currentUser;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Appointments'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Upcoming'),
            Tab(text: 'Today'),
            Tab(text: 'Past'),
          ],
        ),
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
                    .read(fetchAppointmentsProvider.notifier)
                    .fetchForBarn(barnId: widget.barnId),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        success: (appointments) {
          final now = DateTime.now();
          final today = DateTime(now.year, now.month, now.day);
          final tomorrow = today.add(const Duration(days: 1));

          final upcomingAppointments = appointments.where((a) {
            return a.scheduledAt.isAfter(tomorrow) &&
                a.status != AppointmentStatus.cancelled &&
                a.status != AppointmentStatus.completed;
          }).toList();

          final todayAppointments = appointments.where((a) {
            return a.scheduledAt.isAfter(today) &&
                a.scheduledAt.isBefore(tomorrow);
          }).toList();

          final pastAppointments = appointments.where((a) {
            return a.scheduledAt.isBefore(today) ||
                a.status == AppointmentStatus.completed ||
                a.status == AppointmentStatus.cancelled;
          }).toList();

          return TabBarView(
            controller: _tabController,
            children: [
              _AppointmentsList(
                appointments: upcomingAppointments,
                barnId: widget.barnId,
                emptyMessage: 'No upcoming appointments',
                emptyIcon: Icons.calendar_today,
              ),
              _AppointmentsList(
                appointments: todayAppointments,
                barnId: widget.barnId,
                emptyMessage: 'No appointments today',
                emptyIcon: Icons.today,
              ),
              _AppointmentsList(
                appointments: pastAppointments,
                barnId: widget.barnId,
                emptyMessage: 'No past appointments',
                emptyIcon: Icons.history,
                isPast: true,
              ),
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCreateAppointmentDialog(context),
        label: const Text('New Appointment'),
        icon: const Icon(Icons.add),
      ),
    );
  }

  Future<void> _showCreateAppointmentDialog(BuildContext context) async {
    // TODO: Implement create appointment dialog
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Create appointment functionality coming soon'),
      ),
    );
  }
}

class _AppointmentsList extends ConsumerWidget {
  const _AppointmentsList({
    required this.appointments,
    required this.barnId,
    required this.emptyMessage,
    required this.emptyIcon,
    this.isPast = false,
  });

  final List<VendorAppointment> appointments;
  final String barnId;
  final String emptyMessage;
  final IconData emptyIcon;
  final bool isPast;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (appointments.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(emptyIcon, size: 64, color: GLColors.neutral300),
            GLSpaces.px16,
            Text(emptyMessage),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 16),
      itemCount: appointments.length,
      itemBuilder: (context, index) {
        final appointment = appointments[index];
        final user = ref.read(accountProvider).currentUser;

        return AppointmentCard(
          appointment: appointment,
          onConfirm: isPast || appointment.status != AppointmentStatus.requested
              ? null
              : () {
                  ref.read(fetchAppointmentsProvider.notifier).updateAppointment(
                        UpdateAppointmentPayload(
                          appointmentId: appointment.id,
                          status: AppointmentStatus.confirmed,
                          updatedBy: user.id,
                        ),
                      );
                },
          onCancel: isPast ||
                  appointment.status == AppointmentStatus.cancelled ||
                  appointment.status == AppointmentStatus.completed
              ? null
              : () {
                  ref.read(fetchAppointmentsProvider.notifier).cancelAppointment(
                        appointmentId: appointment.id,
                        barnId: barnId,
                        cancelledBy: user.id,
                      );
                },
        );
      },
    );
  }
}
