import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:models/models.dart';
import 'package:share_plus/share_plus.dart';

/// Service for exporting horse profile data.
///
/// Currently provides a shareable text format.
/// PDF generation can be added when the pdf package is included.
class HorseExportService {
  /// Generate shareable text content for a horse profile.
  static String generateShareableText({
    required HorseModel horse,
    String? boarderName,
    String? stallName,
    List<RideLogModel>? recentRideLogs,
    RideLogSummary? rideLogSummary,
    String localeCode = 'en',
  }) {
    final buffer = StringBuffer();
    final dateFormat = DateFormat('MMMM dd, yyyy');

    buffer.writeln('═══════════════════════════════════');
    buffer.writeln('       HORSE PROFILE');
    buffer.writeln('═══════════════════════════════════');
    buffer.writeln();

    // Basic info
    buffer.writeln('📍 ${horse.name}');
    buffer.writeln('───────────────────────────────────');
    buffer.writeln('Breed: ${horse.breed.label(localeCode)}');
    buffer.writeln('Sex: ${horse.sexStatus.label(localeCode)}');
    if (horse.color != null && horse.color!.isNotEmpty) {
      buffer.writeln('Color: ${horse.color}');
    }
    buffer.writeln('Birthday: ${dateFormat.format(horse.birthday)}');
    buffer.writeln('Age: ${horse.age} years');
    buffer.writeln();

    // Status and location
    buffer.writeln('📊 Status');
    buffer.writeln('───────────────────────────────────');
    buffer.writeln('Status: ${horse.status == HorseStatus.active ? "Active" : "Inactive"}');
    if (stallName != null && stallName.isNotEmpty) {
      buffer.writeln('Stall: $stallName');
    }
    if (boarderName != null && boarderName.isNotEmpty) {
      buffer.writeln('Owner/Boarder: $boarderName');
    }
    buffer.writeln();

    // Ride log summary
    if (rideLogSummary != null) {
      buffer.writeln('🏇 Ride Statistics');
      buffer.writeln('───────────────────────────────────');
      buffer.writeln('Total Rides: ${rideLogSummary.totalRides}');
      buffer.writeln('Total Time: ${_formatDuration(rideLogSummary.totalMinutes)}');
      buffer.writeln('This Month: ${rideLogSummary.ridesThisMonth} rides (${_formatDuration(rideLogSummary.minutesThisMonth)})');
      buffer.writeln();
    }

    // Recent ride logs
    if (recentRideLogs != null && recentRideLogs.isNotEmpty) {
      buffer.writeln('📅 Recent Rides');
      buffer.writeln('───────────────────────────────────');
      for (final log in recentRideLogs.take(5)) {
        final logDate = DateFormat('MMM dd').format(log.date);
        buffer.writeln('• $logDate - ${log.type.displayName} (${log.durationFormatted})');
        if (log.riderName != null && log.riderName!.isNotEmpty) {
          buffer.writeln('  Rider: ${log.riderName}');
        }
      }
      buffer.writeln();
    }

    // Documents
    if (horse.documents.isNotEmpty) {
      buffer.writeln('📄 Documents');
      buffer.writeln('───────────────────────────────────');
      for (final doc in horse.documents) {
        buffer.writeln('• ${doc.name}');
      }
      buffer.writeln();
    }

    buffer.writeln('───────────────────────────────────');
    buffer.writeln('Shared from OnStride');
    buffer.writeln('Generated: ${DateFormat('MMM dd, yyyy HH:mm').format(DateTime.now())}');

    return buffer.toString();
  }

  /// Share horse profile using the platform share sheet.
  static Future<void> shareHorseProfile({
    required BuildContext context,
    required HorseModel horse,
    String? boarderName,
    String? stallName,
    List<RideLogModel>? recentRideLogs,
    RideLogSummary? rideLogSummary,
    String localeCode = 'en',
  }) async {
    final text = generateShareableText(
      horse: horse,
      boarderName: boarderName,
      stallName: stallName,
      recentRideLogs: recentRideLogs,
      rideLogSummary: rideLogSummary,
      localeCode: localeCode,
    );

    // Get render box for share position (iPad requires this)
    final box = context.findRenderObject() as RenderBox?;

    await Share.share(
      text,
      subject: '${horse.name} - Horse Profile',
      sharePositionOrigin: box != null
          ? box.localToGlobal(Offset.zero) & box.size
          : null,
    );
  }

  /// Copy horse profile to clipboard.
  static String getClipboardContent({
    required HorseModel horse,
    String? boarderName,
    String? stallName,
    List<RideLogModel>? recentRideLogs,
    RideLogSummary? rideLogSummary,
    String localeCode = 'en',
  }) {
    return generateShareableText(
      horse: horse,
      boarderName: boarderName,
      stallName: stallName,
      recentRideLogs: recentRideLogs,
      rideLogSummary: rideLogSummary,
      localeCode: localeCode,
    );
  }

  static String _formatDuration(int minutes) {
    final hours = minutes ~/ 60;
    final mins = minutes % 60;
    if (hours > 0) {
      return '${hours}h ${mins}m';
    }
    return '${mins}m';
  }
}
