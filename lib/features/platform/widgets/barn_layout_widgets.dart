import 'package:flutter/material.dart';
import 'package:models/models.dart';

/// Canvas widget for barn layout builder
class BarnLayoutCanvas extends StatefulWidget {
  const BarnLayoutCanvas({
    required this.layout,
    this.selectedElementId,
    this.onElementSelected,
    this.onElementMoved,
    this.onElementResized,
    this.isEditing = false,
    super.key,
  });

  final BarnLayout layout;
  final String? selectedElementId;
  final ValueChanged<String?>? onElementSelected;
  final void Function(String elementId, double x, double y)? onElementMoved;
  final void Function(String elementId, double width, double height)? onElementResized;
  final bool isEditing;

  @override
  State<BarnLayoutCanvas> createState() => _BarnLayoutCanvasState();
}

class _BarnLayoutCanvasState extends State<BarnLayoutCanvas> {
  Offset? _dragStart;
  Offset? _elementStart;
  String? _draggingElementId;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final scale = _calculateScale(constraints);

        return GestureDetector(
          onTap: () => widget.onElementSelected?.call(null),
          child: Container(
            width: constraints.maxWidth,
            height: constraints.maxHeight,
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              border: Border.all(color: Colors.grey.shade300),
            ),
            child: Stack(
              children: [
                // Grid background
                CustomPaint(
                  size: Size(constraints.maxWidth, constraints.maxHeight),
                  painter: _GridPainter(gridSize: 20 * scale),
                ),
                // Layout elements
                ...widget.layout.elements.map((element) => _buildElement(
                      element,
                      scale,
                      widget.selectedElementId == element.id,
                    )),
              ],
            ),
          ),
        );
      },
    );
  }

  double _calculateScale(BoxConstraints constraints) {
    final scaleX = constraints.maxWidth / widget.layout.width;
    final scaleY = constraints.maxHeight / widget.layout.height;
    return scaleX < scaleY ? scaleX : scaleY;
  }

  Widget _buildElement(LayoutElement element, double scale, bool isSelected) {
    final color = _getElementColor(element.type);

    return Positioned(
      left: element.x * scale,
      top: element.y * scale,
      child: GestureDetector(
        onTap: () => widget.onElementSelected?.call(element.id),
        onPanStart: widget.isEditing
            ? (details) {
                _dragStart = details.globalPosition;
                _elementStart = Offset(element.x, element.y);
                _draggingElementId = element.id;
              }
            : null,
        onPanUpdate: widget.isEditing
            ? (details) {
                if (_draggingElementId == element.id && _elementStart != null) {
                  final delta = details.globalPosition - _dragStart!;
                  final newX = _elementStart!.dx + delta.dx / scale;
                  final newY = _elementStart!.dy + delta.dy / scale;
                  widget.onElementMoved?.call(element.id, newX, newY);
                }
              }
            : null,
        onPanEnd: (_) {
          _dragStart = null;
          _elementStart = null;
          _draggingElementId = null;
        },
        child: Container(
          width: element.width * scale,
          height: element.height * scale,
          decoration: BoxDecoration(
            color: color.withOpacity(0.3),
            border: Border.all(
              color: isSelected ? Colors.blue : color,
              width: isSelected ? 3 : 1,
            ),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Stack(
            children: [
              Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      _getElementIcon(element.type),
                      size: 16 * scale,
                      color: color,
                    ),
                    if (element.label != null && scale > 0.5)
                      Text(
                        element.label!,
                        style: TextStyle(
                          fontSize: 10 * scale,
                          color: color,
                        ),
                        textAlign: TextAlign.center,
                        overflow: TextOverflow.ellipsis,
                      ),
                  ],
                ),
              ),
              if (isSelected && widget.isEditing)
                Positioned(
                  right: 0,
                  bottom: 0,
                  child: GestureDetector(
                    onPanUpdate: (details) {
                      final newWidth = element.width + details.delta.dx / scale;
                      final newHeight = element.height + details.delta.dy / scale;
                      widget.onElementResized?.call(
                        element.id,
                        newWidth.clamp(20, 500),
                        newHeight.clamp(20, 500),
                      );
                    },
                    child: Container(
                      width: 16,
                      height: 16,
                      decoration: BoxDecoration(
                        color: Colors.blue,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Icon(
                        Icons.open_in_full,
                        size: 10,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getElementColor(LayoutElementType type) {
    switch (type) {
      case LayoutElementType.stall:
        return Colors.brown;
      case LayoutElementType.paddock:
        return Colors.green;
      case LayoutElementType.arena:
        return Colors.orange;
      case LayoutElementType.roundPen:
        return Colors.deepOrange;
      case LayoutElementType.washRack:
        return Colors.blue;
      case LayoutElementType.tackRoom:
        return Colors.purple;
      case LayoutElementType.feedRoom:
        return Colors.amber;
      case LayoutElementType.office:
        return Colors.grey;
      case LayoutElementType.bathroom:
        return Colors.lightBlue;
      case LayoutElementType.parking:
        return Colors.blueGrey;
      case LayoutElementType.gate:
        return Colors.red;
      case LayoutElementType.fence:
        return Colors.brown.shade300;
      case LayoutElementType.path:
        return Colors.grey.shade400;
      case LayoutElementType.water:
        return Colors.cyan;
      case LayoutElementType.custom:
        return Colors.teal;
    }
  }

  IconData _getElementIcon(LayoutElementType type) {
    switch (type) {
      case LayoutElementType.stall:
        return Icons.door_front_door;
      case LayoutElementType.paddock:
        return Icons.grass;
      case LayoutElementType.arena:
        return Icons.sports;
      case LayoutElementType.roundPen:
        return Icons.radio_button_unchecked;
      case LayoutElementType.washRack:
        return Icons.shower;
      case LayoutElementType.tackRoom:
        return Icons.inventory_2;
      case LayoutElementType.feedRoom:
        return Icons.restaurant;
      case LayoutElementType.office:
        return Icons.business;
      case LayoutElementType.bathroom:
        return Icons.wc;
      case LayoutElementType.parking:
        return Icons.local_parking;
      case LayoutElementType.gate:
        return Icons.door_sliding;
      case LayoutElementType.fence:
        return Icons.fence;
      case LayoutElementType.path:
        return Icons.timeline;
      case LayoutElementType.water:
        return Icons.water_drop;
      case LayoutElementType.custom:
        return Icons.extension;
    }
  }
}

class _GridPainter extends CustomPainter {
  _GridPainter({required this.gridSize});

  final double gridSize;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.grey.shade300
      ..strokeWidth = 0.5;

    for (double x = 0; x <= size.width; x += gridSize) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }

    for (double y = 0; y <= size.height; y += gridSize) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant _GridPainter oldDelegate) {
    return oldDelegate.gridSize != gridSize;
  }
}

/// Element palette for adding new elements
class LayoutElementPalette extends StatelessWidget {
  const LayoutElementPalette({
    required this.onElementSelected,
    super.key,
  });

  final ValueChanged<LayoutElementType> onElementSelected;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Wrap(
          spacing: 8,
          runSpacing: 8,
          children: LayoutElementType.values.map((type) {
            return _PaletteItem(
              type: type,
              onTap: () => onElementSelected(type),
            );
          }).toList(),
        ),
      ),
    );
  }
}

class _PaletteItem extends StatelessWidget {
  const _PaletteItem({
    required this.type,
    required this.onTap,
  });

  final LayoutElementType type;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: _getTypeName(type),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: _getTypeColor(type).withOpacity(0.2),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: _getTypeColor(type)),
          ),
          child: Icon(
            _getTypeIcon(type),
            color: _getTypeColor(type),
          ),
        ),
      ),
    );
  }

  String _getTypeName(LayoutElementType type) {
    switch (type) {
      case LayoutElementType.stall:
        return 'Stall';
      case LayoutElementType.paddock:
        return 'Paddock';
      case LayoutElementType.arena:
        return 'Arena';
      case LayoutElementType.roundPen:
        return 'Round Pen';
      case LayoutElementType.washRack:
        return 'Wash Rack';
      case LayoutElementType.tackRoom:
        return 'Tack Room';
      case LayoutElementType.feedRoom:
        return 'Feed Room';
      case LayoutElementType.office:
        return 'Office';
      case LayoutElementType.bathroom:
        return 'Bathroom';
      case LayoutElementType.parking:
        return 'Parking';
      case LayoutElementType.gate:
        return 'Gate';
      case LayoutElementType.fence:
        return 'Fence';
      case LayoutElementType.path:
        return 'Path';
      case LayoutElementType.water:
        return 'Water';
      case LayoutElementType.custom:
        return 'Custom';
    }
  }

  Color _getTypeColor(LayoutElementType type) {
    switch (type) {
      case LayoutElementType.stall:
        return Colors.brown;
      case LayoutElementType.paddock:
        return Colors.green;
      case LayoutElementType.arena:
        return Colors.orange;
      case LayoutElementType.roundPen:
        return Colors.deepOrange;
      case LayoutElementType.washRack:
        return Colors.blue;
      case LayoutElementType.tackRoom:
        return Colors.purple;
      case LayoutElementType.feedRoom:
        return Colors.amber;
      case LayoutElementType.office:
        return Colors.grey;
      case LayoutElementType.bathroom:
        return Colors.lightBlue;
      case LayoutElementType.parking:
        return Colors.blueGrey;
      case LayoutElementType.gate:
        return Colors.red;
      case LayoutElementType.fence:
        return Colors.brown.shade300;
      case LayoutElementType.path:
        return Colors.grey.shade400;
      case LayoutElementType.water:
        return Colors.cyan;
      case LayoutElementType.custom:
        return Colors.teal;
    }
  }

  IconData _getTypeIcon(LayoutElementType type) {
    switch (type) {
      case LayoutElementType.stall:
        return Icons.door_front_door;
      case LayoutElementType.paddock:
        return Icons.grass;
      case LayoutElementType.arena:
        return Icons.sports;
      case LayoutElementType.roundPen:
        return Icons.radio_button_unchecked;
      case LayoutElementType.washRack:
        return Icons.shower;
      case LayoutElementType.tackRoom:
        return Icons.inventory_2;
      case LayoutElementType.feedRoom:
        return Icons.restaurant;
      case LayoutElementType.office:
        return Icons.business;
      case LayoutElementType.bathroom:
        return Icons.wc;
      case LayoutElementType.parking:
        return Icons.local_parking;
      case LayoutElementType.gate:
        return Icons.door_sliding;
      case LayoutElementType.fence:
        return Icons.fence;
      case LayoutElementType.path:
        return Icons.timeline;
      case LayoutElementType.water:
        return Icons.water_drop;
      case LayoutElementType.custom:
        return Icons.extension;
    }
  }
}

/// Properties panel for selected element
class ElementPropertiesPanel extends StatelessWidget {
  const ElementPropertiesPanel({
    required this.element,
    this.assignment,
    this.onUpdate,
    this.onDelete,
    this.onAssignHorse,
    super.key,
  });

  final LayoutElement element;
  final StallAssignment? assignment;
  final ValueChanged<LayoutElement>? onUpdate;
  final VoidCallback? onDelete;
  final VoidCallback? onAssignHorse;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Text(
                  'Properties',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                if (onDelete != null)
                  IconButton(
                    icon: const Icon(Icons.delete, color: Colors.red),
                    onPressed: onDelete,
                  ),
              ],
            ),
            const Divider(),
            const SizedBox(height: 8),
            Text('Type: ${element.type.name}'),
            const SizedBox(height: 8),
            TextFormField(
              initialValue: element.label,
              decoration: const InputDecoration(
                labelText: 'Label',
                border: OutlineInputBorder(),
                isDense: true,
              ),
              onChanged: (value) {
                onUpdate?.call(element.copyWith(label: value));
              },
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    initialValue: element.width.toStringAsFixed(0),
                    decoration: const InputDecoration(
                      labelText: 'Width',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    keyboardType: TextInputType.number,
                    onChanged: (value) {
                      final width = double.tryParse(value);
                      if (width != null) {
                        onUpdate?.call(element.copyWith(width: width));
                      }
                    },
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextFormField(
                    initialValue: element.height.toStringAsFixed(0),
                    decoration: const InputDecoration(
                      labelText: 'Height',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    keyboardType: TextInputType.number,
                    onChanged: (value) {
                      final height = double.tryParse(value);
                      if (height != null) {
                        onUpdate?.call(element.copyWith(height: height));
                      }
                    },
                  ),
                ),
              ],
            ),
            if (element.type == LayoutElementType.stall) ...[
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 8),
              Text(
                'Assignment',
                style: theme.textTheme.titleSmall,
              ),
              const SizedBox(height: 8),
              if (assignment != null)
                ListTile(
                  leading: const Icon(Icons.pets),
                  title: Text(assignment!.horseName ?? 'Horse'),
                  subtitle: Text('Since ${_formatDate(assignment!.assignedAt)}'),
                  trailing: IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () {
                      // Clear assignment
                    },
                  ),
                  contentPadding: EdgeInsets.zero,
                )
              else
                OutlinedButton.icon(
                  onPressed: onAssignHorse,
                  icon: const Icon(Icons.add),
                  label: const Text('Assign Horse'),
                ),
            ],
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime dt) {
    return '${dt.month}/${dt.day}/${dt.year}';
  }
}

/// Stall card showing horse assignment
class StallAssignmentCard extends StatelessWidget {
  const StallAssignmentCard({
    required this.element,
    this.assignment,
    this.onTap,
    super.key,
  });

  final LayoutElement element;
  final StallAssignment? assignment;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final hasAssignment = assignment != null;

    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: hasAssignment
                      ? Colors.green.withOpacity(0.2)
                      : Colors.grey.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  hasAssignment ? Icons.pets : Icons.door_front_door,
                  color: hasAssignment ? Colors.green : Colors.grey,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      element.label ?? 'Stall ${element.id.substring(0, 6)}',
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      hasAssignment
                          ? assignment!.horseName ?? 'Assigned'
                          : 'Available',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: hasAssignment ? Colors.green : Colors.grey,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right,
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
