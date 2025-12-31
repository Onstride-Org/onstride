import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'admin_dashboard.freezed.dart';
part 'admin_dashboard.g.dart';

/// Platform-wide analytics for admin dashboard
@freezed
sealed class PlatformAnalytics with _$PlatformAnalytics {
  const factory PlatformAnalytics({
    required String id,
    required String periodId, // YYYY-MM or YYYY-MM-DD

    /// User metrics
    @Default(0) int totalUsers,
    @Default(0) int activeUsersDaily,
    @Default(0) int activeUsersWeekly,
    @Default(0) int activeUsersMonthly,
    @Default(0) int newUsersThisPeriod,
    @Default(0.0) double userChurnRate,

    /// Barn metrics
    @Default(0) int totalBarns,
    @Default(0) int activeBarns,
    @Default(0) int newBarnsThisPeriod,

    /// Horse metrics
    @Default(0) int totalHorses,
    @Default(0) int newHorsesThisPeriod,

    /// Subscription metrics
    @Default(0) int freeSubscriptions,
    @Default(0) int basicSubscriptions,
    @Default(0) int proSubscriptions,
    @Default(0) int enterpriseSubscriptions,
    @Default(0) int trialSubscriptions,

    /// Revenue metrics (cents)
    @Default(0) int mrrCents,
    @Default(0) int arrCents,
    @Default(0) int revenueThisPeriodCents,

    /// Feature usage
    @Default(0) int lessonsCreated,
    @Default(0) int invoicesGenerated,
    @Default(0) int tasksCompleted,
    @Default(0) int rideLogsRecorded,
    @Default(0) int documentsUploaded,
    @Default(0) int aiFeatureUsage,

    @TimestampConverter() required DateTime calculatedAt,
  }) = _PlatformAnalytics;

  factory PlatformAnalytics.fromJson(Map<String, dynamic> json) =>
      _$PlatformAnalyticsFromJson(json);
}

/// Admin user with elevated permissions
@freezed
sealed class AdminUser with _$AdminUser {
  const factory AdminUser({
    required String id,
    required String email,
    required String name,
    required AdminRole role,
    @Default(true) bool isActive,

    /// Permissions
    @Default(<AdminPermission>[]) List<AdminPermission> permissions,

    /// Activity tracking
    @NullableTimestampConverter() DateTime? lastLoginAt,
    @Default(0) int loginCount,

    @TimestampConverter() required DateTime createdAt,
    @NullableTimestampConverter() DateTime? updatedAt,
  }) = _AdminUser;

  factory AdminUser.fromJson(Map<String, dynamic> json) =>
      _$AdminUserFromJson(json);
}

enum AdminRole {
  superAdmin,
  admin,
  support,
  analyst,
}

enum AdminPermission {
  viewAnalytics,
  viewUsers,
  manageUsers,
  viewBarns,
  manageBarns,
  viewSubscriptions,
  manageSubscriptions,
  impersonateUsers,
  manageFeatureFlags,
  sendAnnouncements,
  viewAuditLogs,
  manageAdmins,
}

/// Audit log entry for admin actions
@freezed
sealed class AdminAuditLog with _$AdminAuditLog {
  const factory AdminAuditLog({
    required String id,
    required String adminId,
    required String adminEmail,
    required AdminAction action,
    required String description,

    /// Target of the action
    String? targetType, // 'user', 'barn', 'subscription'
    String? targetId,
    String? targetName,

    /// Additional context
    @Default(<String, dynamic>{}) Map<String, dynamic> metadata,

    /// Request info
    String? ipAddress,
    String? userAgent,

    @TimestampConverter() required DateTime createdAt,
  }) = _AdminAuditLog;

  factory AdminAuditLog.fromJson(Map<String, dynamic> json) =>
      _$AdminAuditLogFromJson(json);
}

enum AdminAction {
  login,
  logout,
  viewUser,
  updateUser,
  deleteUser,
  impersonateUser,
  viewBarn,
  updateBarn,
  deleteBarn,
  updateSubscription,
  cancelSubscription,
  refundPayment,
  toggleFeatureFlag,
  sendAnnouncement,
  exportData,
  createAdmin,
  updateAdmin,
  deleteAdmin,
}

/// System announcement
@freezed
sealed class SystemAnnouncement with _$SystemAnnouncement {
  const factory SystemAnnouncement({
    required String id,
    required String title,
    required String message,
    required AnnouncementType type,
    required AnnouncementTarget target,

    /// Specific targets (if target is 'specific')
    @Default(<String>[]) List<String> targetBarnIds,
    @Default(<SubscriptionTier>[]) List<SubscriptionTier> targetTiers,

    /// Display settings
    @Default(true) bool isActive,
    @Default(false) bool isDismissible,
    String? actionUrl,
    String? actionLabel,

    /// Scheduling
    @TimestampConverter() required DateTime startsAt,
    @NullableTimestampConverter() DateTime? endsAt,

    /// Tracking
    @Default(0) int viewCount,
    @Default(0) int dismissCount,
    @Default(0) int actionClickCount,

    required String createdBy,
    @TimestampConverter() required DateTime createdAt,
    @NullableTimestampConverter() DateTime? updatedAt,
  }) = _SystemAnnouncement;

  factory SystemAnnouncement.fromJson(Map<String, dynamic> json) =>
      _$SystemAnnouncementFromJson(json);
}

enum AnnouncementType {
  info,
  warning,
  maintenance,
  newFeature,
  promotion,
}

enum AnnouncementTarget {
  all,
  freeUsers,
  paidUsers,
  trialUsers,
  specific,
}

/// Feature flag for gradual rollouts
@freezed
sealed class FeatureFlag with _$FeatureFlag {
  const factory FeatureFlag({
    required String id,
    required String key,
    required String name,
    String? description,
    @Default(false) bool isEnabled,

    /// Rollout settings
    @Default(100) int rolloutPercentage,
    @Default(<SubscriptionTier>[]) List<SubscriptionTier> enabledTiers,
    @Default(<String>[]) List<String> enabledBarnIds,
    @Default(<String>[]) List<String> enabledUserIds,

    required String createdBy,
    @TimestampConverter() required DateTime createdAt,
    @NullableTimestampConverter() DateTime? updatedAt,
  }) = _FeatureFlag;

  factory FeatureFlag.fromJson(Map<String, dynamic> json) =>
      _$FeatureFlagFromJson(json);
}

/// Support ticket from users
@freezed
sealed class SupportTicket with _$SupportTicket {
  const factory SupportTicket({
    required String id,
    required String barnId,
    required String userId,
    required String userEmail,
    required String subject,
    required String description,
    required TicketCategory category,
    required TicketPriority priority,
    required TicketStatus status,

    /// Assignment
    String? assignedToAdminId,
    String? assignedToAdminName,

    /// Resolution
    String? resolution,
    @NullableTimestampConverter() DateTime? resolvedAt,

    /// Metadata
    String? appVersion,
    String? platform,
    @Default(<String>[]) List<String> attachmentUrls,

    @TimestampConverter() required DateTime createdAt,
    @NullableTimestampConverter() DateTime? updatedAt,
    @NullableTimestampConverter() DateTime? firstResponseAt,
  }) = _SupportTicket;

  factory SupportTicket.fromJson(Map<String, dynamic> json) =>
      _$SupportTicketFromJson(json);
}

enum TicketCategory {
  bug,
  featureRequest,
  billing,
  account,
  howTo,
  other,
}

enum TicketPriority {
  low,
  medium,
  high,
  urgent,
}

enum TicketStatus {
  open,
  inProgress,
  waitingOnCustomer,
  resolved,
  closed,
}
