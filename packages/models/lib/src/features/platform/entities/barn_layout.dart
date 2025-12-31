import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'barn_layout.freezed.dart';
part 'barn_layout.g.dart';

/// Types of elements in a barn layout
enum LayoutElementType {
  stall,
  arena,
  roundPen,
  paddock,
  pasture,
  washRack,
  tackRoom,
  feedRoom,
  office,
  bathroom,
  parking,
  barn, // Main building outline
  fence,
  gate,
  water,
  custom,
}

/// A barn's complete layout
@freezed
sealed class BarnLayout with _$BarnLayout {
  const factory BarnLayout({
    required String id,
    required String barnId,
    required String name,

    /// Canvas dimensions
    @Default(1000) int canvasWidth,
    @Default(800) int canvasHeight,

    /// Layout elements
    @Default(<LayoutElement>[]) List<LayoutElement> elements,

    /// Display settings
    @Default(1.0) double defaultZoom,
    @Default(true) bool showLabels,
    @Default(true) bool showHorseNames,
    @Default('#f5f5f5') String backgroundColor,

    /// Metadata
    @Default(1) int version,
    required String createdBy,
    @TimestampConverter() required DateTime createdAt,
    @NullableTimestampConverter() DateTime? updatedAt,
  }) = _BarnLayout;

  factory BarnLayout.fromJson(Map<String, dynamic> json) =>
      _$BarnLayoutFromJson(json);
}

/// A single element in the barn layout
@freezed
sealed class LayoutElement with _$LayoutElement {
  const factory LayoutElement({
    required String id,
    required LayoutElementType type,
    required String label,

    /// Position (top-left corner)
    required double x,
    required double y,

    /// Size
    required double width,
    required double height,

    /// Rotation in degrees
    @Default(0) double rotation,

    /// Styling
    String? fillColor,
    String? borderColor,
    @Default(2) double borderWidth,
    @Default(0) double cornerRadius,

    /// For stalls - assigned horse
    String? assignedHorseId,
    String? assignedHorseName,

    /// For areas - capacity info
    int? capacity,
    int? currentOccupancy,

    /// Z-index for layering
    @Default(0) int zIndex,

    /// Custom properties
    @Default(<String, dynamic>{}) Map<String, dynamic> properties,
  }) = _LayoutElement;

  factory LayoutElement.fromJson(Map<String, dynamic> json) =>
      _$LayoutElementFromJson(json);
}

/// Stall assignment history
@freezed
sealed class StallAssignment with _$StallAssignment {
  const factory StallAssignment({
    required String id,
    required String barnId,
    required String layoutId,
    required String stallElementId,
    required String horseId,
    required String horseName,

    @TimestampConverter() required DateTime assignedAt,
    @NullableTimestampConverter() DateTime? unassignedAt,

    String? assignedBy,
    String? unassignedBy,
    String? notes,
  }) = _StallAssignment;

  factory StallAssignment.fromJson(Map<String, dynamic> json) =>
      _$StallAssignmentFromJson(json);
}

/// Preset element templates for quick adding
@freezed
sealed class LayoutElementTemplate with _$LayoutElementTemplate {
  const factory LayoutElementTemplate({
    required String id,
    required LayoutElementType type,
    required String name,
    required double defaultWidth,
    required double defaultHeight,
    String? defaultFillColor,
    String? defaultBorderColor,
    String? iconName,
    @Default(false) bool isSystemTemplate,
  }) = _LayoutElementTemplate;

  factory LayoutElementTemplate.fromJson(Map<String, dynamic> json) =>
      _$LayoutElementTemplateFromJson(json);

  static List<LayoutElementTemplate> get defaultTemplates => [
        const LayoutElementTemplate(
          id: 'stall_standard',
          type: LayoutElementType.stall,
          name: 'Standard Stall',
          defaultWidth: 40,
          defaultHeight: 40,
          defaultFillColor: '#e8f5e9',
          defaultBorderColor: '#4caf50',
          iconName: 'grid_view',
          isSystemTemplate: true,
        ),
        const LayoutElementTemplate(
          id: 'stall_large',
          type: LayoutElementType.stall,
          name: 'Large Stall',
          defaultWidth: 50,
          defaultHeight: 50,
          defaultFillColor: '#e8f5e9',
          defaultBorderColor: '#4caf50',
          iconName: 'grid_view',
          isSystemTemplate: true,
        ),
        const LayoutElementTemplate(
          id: 'arena_small',
          type: LayoutElementType.arena,
          name: 'Small Arena',
          defaultWidth: 200,
          defaultHeight: 100,
          defaultFillColor: '#fff3e0',
          defaultBorderColor: '#ff9800',
          iconName: 'stadium',
          isSystemTemplate: true,
        ),
        const LayoutElementTemplate(
          id: 'arena_standard',
          type: LayoutElementType.arena,
          name: 'Standard Arena (20x40m)',
          defaultWidth: 300,
          defaultHeight: 150,
          defaultFillColor: '#fff3e0',
          defaultBorderColor: '#ff9800',
          iconName: 'stadium',
          isSystemTemplate: true,
        ),
        const LayoutElementTemplate(
          id: 'round_pen',
          type: LayoutElementType.roundPen,
          name: 'Round Pen',
          defaultWidth: 80,
          defaultHeight: 80,
          defaultFillColor: '#fce4ec',
          defaultBorderColor: '#e91e63',
          iconName: 'radio_button_unchecked',
          isSystemTemplate: true,
        ),
        const LayoutElementTemplate(
          id: 'paddock',
          type: LayoutElementType.paddock,
          name: 'Paddock',
          defaultWidth: 120,
          defaultHeight: 80,
          defaultFillColor: '#e3f2fd',
          defaultBorderColor: '#2196f3',
          iconName: 'crop_square',
          isSystemTemplate: true,
        ),
        const LayoutElementTemplate(
          id: 'pasture',
          type: LayoutElementType.pasture,
          name: 'Pasture',
          defaultWidth: 200,
          defaultHeight: 150,
          defaultFillColor: '#c8e6c9',
          defaultBorderColor: '#388e3c',
          iconName: 'grass',
          isSystemTemplate: true,
        ),
        const LayoutElementTemplate(
          id: 'wash_rack',
          type: LayoutElementType.washRack,
          name: 'Wash Rack',
          defaultWidth: 30,
          defaultHeight: 40,
          defaultFillColor: '#e1f5fe',
          defaultBorderColor: '#03a9f4',
          iconName: 'water_drop',
          isSystemTemplate: true,
        ),
        const LayoutElementTemplate(
          id: 'tack_room',
          type: LayoutElementType.tackRoom,
          name: 'Tack Room',
          defaultWidth: 50,
          defaultHeight: 40,
          defaultFillColor: '#f3e5f5',
          defaultBorderColor: '#9c27b0',
          iconName: 'inventory_2',
          isSystemTemplate: true,
        ),
        const LayoutElementTemplate(
          id: 'feed_room',
          type: LayoutElementType.feedRoom,
          name: 'Feed Room',
          defaultWidth: 40,
          defaultHeight: 40,
          defaultFillColor: '#fff8e1',
          defaultBorderColor: '#ffc107',
          iconName: 'restaurant',
          isSystemTemplate: true,
        ),
        const LayoutElementTemplate(
          id: 'barn_building',
          type: LayoutElementType.barn,
          name: 'Barn Building',
          defaultWidth: 300,
          defaultHeight: 100,
          defaultFillColor: '#efebe9',
          defaultBorderColor: '#795548',
          iconName: 'home',
          isSystemTemplate: true,
        ),
      ];
}
