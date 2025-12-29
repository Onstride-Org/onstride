import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';

/// A tile widget for picking brand colors.
class ColorPickerTile extends StatelessWidget {
  const ColorPickerTile({
    required this.label,
    required this.color,
    required this.onColorChanged,
    super.key,
  });

  final String label;
  final Color? color;
  final ValueChanged<Color> onColorChanged;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(label),
      trailing: GestureDetector(
        onTap: () => _showColorPicker(context),
        child: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: color ?? GLColors.brand600,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: GLColors.neutral300),
          ),
          child: color == null
              ? const Icon(Icons.add, color: Colors.white, size: 20)
              : null,
        ),
      ),
    );
  }

  Future<void> _showColorPicker(BuildContext context) async {
    final selectedColor = await showDialog<Color>(
      context: context,
      builder: (context) => _ColorPickerDialog(initialColor: color),
    );

    if (selectedColor != null) {
      onColorChanged(selectedColor);
    }
  }
}

class _ColorPickerDialog extends StatefulWidget {
  const _ColorPickerDialog({this.initialColor});

  final Color? initialColor;

  @override
  State<_ColorPickerDialog> createState() => _ColorPickerDialogState();
}

class _ColorPickerDialogState extends State<_ColorPickerDialog> {
  late Color _selectedColor;

  static const List<Color> _presetColors = [
    Color(0xFF1E40AF), // Blue
    Color(0xFF047857), // Green
    Color(0xFFDC2626), // Red
    Color(0xFFD97706), // Amber
    Color(0xFF7C3AED), // Purple
    Color(0xFFDB2777), // Pink
    Color(0xFF0891B2), // Cyan
    Color(0xFF4B5563), // Gray
    Color(0xFF111827), // Black
    Color(0xFF78350F), // Brown
    Color(0xFF065F46), // Teal
    Color(0xFF1E3A8A), // Navy
  ];

  @override
  void initState() {
    super.initState();
    _selectedColor = widget.initialColor ?? GLColors.brand600;
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Choose Color'),
      content: SizedBox(
        width: 280,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              height: 60,
              width: double.infinity,
              decoration: BoxDecoration(
                color: _selectedColor,
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            GLSpaces.px16,
            GridView.builder(
              shrinkWrap: true,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 4,
                mainAxisSpacing: 8,
                crossAxisSpacing: 8,
              ),
              itemCount: _presetColors.length,
              itemBuilder: (context, index) {
                final color = _presetColors[index];
                final isSelected = color.value == _selectedColor.value;
                return GestureDetector(
                  onTap: () => setState(() => _selectedColor = color),
                  child: Container(
                    decoration: BoxDecoration(
                      color: color,
                      borderRadius: BorderRadius.circular(8),
                      border: isSelected
                          ? Border.all(color: Colors.white, width: 3)
                          : null,
                      boxShadow: isSelected
                          ? [
                              BoxShadow(
                                color: color.withOpacity(0.5),
                                blurRadius: 8,
                                spreadRadius: 2,
                              ),
                            ]
                          : null,
                    ),
                    child: isSelected
                        ? const Icon(Icons.check, color: Colors.white, size: 20)
                        : null,
                  ),
                );
              },
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () => Navigator.of(context).pop(_selectedColor),
          child: const Text('Select'),
        ),
      ],
    );
  }
}
