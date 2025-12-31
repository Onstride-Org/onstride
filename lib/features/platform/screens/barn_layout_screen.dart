import 'package:flutter/material.dart';
import 'package:models/models.dart';

import '../services/services.dart';
import '../widgets/widgets.dart';

/// Barn layout builder screen
class BarnLayoutScreen extends StatefulWidget {
  const BarnLayoutScreen({
    required this.barnId,
    this.existingLayout,
    super.key,
  });

  final String barnId;
  final BarnLayout? existingLayout;

  @override
  State<BarnLayoutScreen> createState() => _BarnLayoutScreenState();
}

class _BarnLayoutScreenState extends State<BarnLayoutScreen> {
  late BarnLayout _layout;
  String? _selectedElementId;
  bool _isEditing = true;
  bool _showPalette = true;

  @override
  void initState() {
    super.initState();
    _layout = widget.existingLayout ??
        BarnLayout(
          id: 'layout_${DateTime.now().millisecondsSinceEpoch}',
          barnId: widget.barnId,
          name: 'New Layout',
          width: 800,
          height: 600,
          elements: [],
          assignments: [],
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final layout = ResponsiveService.getLayoutInfo(context);
    final selectedElement = _selectedElementId != null
        ? _layout.elements
            .cast<LayoutElement?>()
            .firstWhere((e) => e?.id == _selectedElementId, orElse: () => null)
        : null;

    return Scaffold(
      appBar: AppBar(
        title: Text(_layout.name),
        actions: [
          IconButton(
            icon: Icon(_isEditing ? Icons.visibility : Icons.edit),
            tooltip: _isEditing ? 'Preview' : 'Edit',
            onPressed: () {
              setState(() {
                _isEditing = !_isEditing;
                if (!_isEditing) _selectedElementId = null;
              });
            },
          ),
          IconButton(
            icon: const Icon(Icons.save),
            tooltip: 'Save',
            onPressed: _saveLayout,
          ),
          PopupMenuButton<String>(
            onSelected: _handleMenuAction,
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'rename',
                child: Text('Rename Layout'),
              ),
              const PopupMenuItem(
                value: 'resize',
                child: Text('Resize Canvas'),
              ),
              const PopupMenuItem(
                value: 'clear',
                child: Text('Clear All'),
              ),
            ],
          ),
        ],
      ),
      body: layout.isDesktop
          ? Row(
              children: [
                // Canvas
                Expanded(
                  flex: 3,
                  child: _buildCanvas(),
                ),
                // Side panel
                if (_isEditing)
                  SizedBox(
                    width: 300,
                    child: Column(
                      children: [
                        // Element palette
                        if (_showPalette)
                          Padding(
                            padding: const EdgeInsets.all(8),
                            child: LayoutElementPalette(
                              onElementSelected: _addElement,
                            ),
                          ),
                        const Divider(),
                        // Properties panel
                        if (selectedElement != null)
                          Expanded(
                            child: SingleChildScrollView(
                              padding: const EdgeInsets.all(8),
                              child: ElementPropertiesPanel(
                                element: selectedElement,
                                assignment: _getAssignment(selectedElement.id),
                                onUpdate: (updated) {
                                  setState(() {
                                    final index = _layout.elements
                                        .indexWhere((e) => e.id == updated.id);
                                    if (index != -1) {
                                      final elements =
                                          List<LayoutElement>.from(_layout.elements);
                                      elements[index] = updated;
                                      _layout = _layout.copyWith(elements: elements);
                                    }
                                  });
                                },
                                onDelete: () => _deleteElement(selectedElement.id),
                                onAssignHorse: () =>
                                    _showAssignHorseDialog(selectedElement.id),
                              ),
                            ),
                          )
                        else
                          const Expanded(
                            child: Center(
                              child: Text('Select an element to edit'),
                            ),
                          ),
                      ],
                    ),
                  ),
              ],
            )
          : Column(
              children: [
                // Canvas
                Expanded(child: _buildCanvas()),
                // Bottom sheet for mobile
                if (_isEditing && _showPalette)
                  Container(
                    height: 100,
                    decoration: BoxDecoration(
                      color: theme.colorScheme.surface,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          blurRadius: 8,
                          offset: const Offset(0, -2),
                        ),
                      ],
                    ),
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.all(8),
                      child: Row(
                        children: LayoutElementType.values.map((type) {
                          return Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: _buildPaletteButton(type),
                          );
                        }).toList(),
                      ),
                    ),
                  ),
              ],
            ),
      floatingActionButton: _isEditing
          ? FloatingActionButton(
              onPressed: () {
                setState(() => _showPalette = !_showPalette);
              },
              child: Icon(_showPalette ? Icons.close : Icons.add),
            )
          : null,
      bottomSheet: selectedElement != null && layout.isMobile
          ? BottomSheet(
              onClosing: () {},
              builder: (context) => Container(
                padding: const EdgeInsets.all(16),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      children: [
                        Text(
                          selectedElement.label ?? selectedElement.type.name,
                          style: theme.textTheme.titleMedium,
                        ),
                        const Spacer(),
                        IconButton(
                          icon: const Icon(Icons.delete),
                          onPressed: () => _deleteElement(selectedElement.id),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: () {
                            setState(() => _selectedElementId = null);
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            )
          : null,
    );
  }

  Widget _buildCanvas() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: BarnLayoutCanvas(
        layout: _layout,
        selectedElementId: _selectedElementId,
        isEditing: _isEditing,
        onElementSelected: (id) {
          setState(() => _selectedElementId = id);
        },
        onElementMoved: (id, x, y) {
          setState(() {
            final index = _layout.elements.indexWhere((e) => e.id == id);
            if (index != -1) {
              final elements = List<LayoutElement>.from(_layout.elements);
              elements[index] = elements[index].copyWith(
                x: x.clamp(0, _layout.width - elements[index].width),
                y: y.clamp(0, _layout.height - elements[index].height),
              );
              _layout = _layout.copyWith(elements: elements);
            }
          });
        },
        onElementResized: (id, width, height) {
          setState(() {
            final index = _layout.elements.indexWhere((e) => e.id == id);
            if (index != -1) {
              final elements = List<LayoutElement>.from(_layout.elements);
              elements[index] = elements[index].copyWith(
                width: width,
                height: height,
              );
              _layout = _layout.copyWith(elements: elements);
            }
          });
        },
      ),
    );
  }

  Widget _buildPaletteButton(LayoutElementType type) {
    return Tooltip(
      message: type.name,
      child: InkWell(
        onTap: () => _addElement(type),
        borderRadius: BorderRadius.circular(8),
        child: Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            color: _getTypeColor(type).withOpacity(0.2),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: _getTypeColor(type)),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(_getTypeIcon(type), color: _getTypeColor(type), size: 24),
              Text(
                type.name,
                style: TextStyle(
                  fontSize: 8,
                  color: _getTypeColor(type),
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _addElement(LayoutElementType type) {
    final template = LayoutElementTemplate.defaultTemplates
        .cast<LayoutElementTemplate?>()
        .firstWhere((t) => t?.type == type, orElse: () => null);

    final newElement = LayoutElement(
      id: 'elem_${DateTime.now().millisecondsSinceEpoch}',
      type: type,
      x: _layout.width / 2 - (template?.defaultWidth ?? 80) / 2,
      y: _layout.height / 2 - (template?.defaultHeight ?? 60) / 2,
      width: template?.defaultWidth ?? 80,
      height: template?.defaultHeight ?? 60,
      rotation: 0,
      properties: {},
    );

    setState(() {
      _layout = _layout.copyWith(
        elements: [..._layout.elements, newElement],
      );
      _selectedElementId = newElement.id;
    });
  }

  void _deleteElement(String elementId) {
    setState(() {
      _layout = _layout.copyWith(
        elements: _layout.elements.where((e) => e.id != elementId).toList(),
        assignments: _layout.assignments
            .where((a) => a.elementId != elementId)
            .toList(),
      );
      _selectedElementId = null;
    });
  }

  StallAssignment? _getAssignment(String elementId) {
    return _layout.assignments.cast<StallAssignment?>().firstWhere(
          (a) => a?.elementId == elementId,
          orElse: () => null,
        );
  }

  void _showAssignHorseDialog(String elementId) {
    // Show horse selection dialog
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Assign Horse'),
        content: const Text('Horse selection would appear here'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }

  void _handleMenuAction(String action) {
    switch (action) {
      case 'rename':
        _showRenameDialog();
        break;
      case 'resize':
        _showResizeDialog();
        break;
      case 'clear':
        _showClearConfirmation();
        break;
    }
  }

  void _showRenameDialog() {
    final controller = TextEditingController(text: _layout.name);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Rename Layout'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(
            labelText: 'Layout Name',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              setState(() {
                _layout = _layout.copyWith(name: controller.text);
              });
              Navigator.of(context).pop();
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _showResizeDialog() {
    final widthController =
        TextEditingController(text: _layout.width.toStringAsFixed(0));
    final heightController =
        TextEditingController(text: _layout.height.toStringAsFixed(0));

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Resize Canvas'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: widthController,
              decoration: const InputDecoration(
                labelText: 'Width',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: heightController,
              decoration: const InputDecoration(
                labelText: 'Height',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              final width = double.tryParse(widthController.text);
              final height = double.tryParse(heightController.text);
              if (width != null && height != null) {
                setState(() {
                  _layout = _layout.copyWith(width: width, height: height);
                });
              }
              Navigator.of(context).pop();
            },
            child: const Text('Apply'),
          ),
        ],
      ),
    );
  }

  void _showClearConfirmation() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear All Elements'),
        content: const Text(
          'Are you sure you want to remove all elements from the layout? '
          'This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              setState(() {
                _layout = _layout.copyWith(elements: [], assignments: []);
                _selectedElementId = null;
              });
              Navigator.of(context).pop();
            },
            style: TextButton.styleFrom(
              foregroundColor: Theme.of(context).colorScheme.error,
            ),
            child: const Text('Clear All'),
          ),
        ],
      ),
    );
  }

  void _saveLayout() {
    // Save layout to database
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Layout saved')),
    );
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
