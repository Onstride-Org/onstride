import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:table_calendar/table_calendar.dart';

/// Calendar section
class TaskCalendarWidget extends StatelessWidget {
  const TaskCalendarWidget({
    required this.focusedDate,
    required this.selectedDate,
    required this.primary,
    required this.onDaySelected,
    this.taskDates = const [],
    super.key,
  });

  final DateTime focusedDate;
  final DateTime selectedDate;
  final Color primary;
  final void Function(DateTime, DateTime) onDaySelected;
  final List<DateTime> taskDates;

  @override
  Widget build(BuildContext context) {
    return TableCalendar<DateTime>(
      rowHeight: 45,
      availableGestures: AvailableGestures.none,
      firstDay: DateTime.utc(2000),
      lastDay: DateTime.utc(2100, 12, 31),
      focusedDay: focusedDate,
      selectedDayPredicate: (day) => isSameDay(selectedDate, day),
      onDaySelected: onDaySelected,
      headerVisible: false,
      daysOfWeekHeight: 50,
      calendarBuilders: CalendarBuilders(
        defaultBuilder: (context, day, focusedDay) {
          return _buildDayWithDot(context, day, false, false);
        },
        todayBuilder: (context, day, focusedDay) {
          return _buildDayWithDot(context, day, true, false);
        },
        selectedBuilder: (context, day, focusedDay) {
          return _buildDayWithDot(context, day, false, true);
        },
        outsideBuilder: (context, day, focusedDay) {
          return _buildDayWithDot(context, day, false, false);
        },
      ),
      calendarStyle: CalendarStyle(
        todayTextStyle: TextStyle(color: primary),
        selectedDecoration: BoxDecoration(
          color: primary,
          shape: BoxShape.circle,
        ),
        todayDecoration: BoxDecoration(
          border: Border.all(color: primary),
          shape: BoxShape.circle,
        ),
        outsideDaysVisible: false,
      ),
    );
  }

  Widget _buildDayWithDot(
    BuildContext context,
    DateTime day,
    bool isToday,
    bool isSelected,
  ) {
    final hasTasks = taskDates.any((taskDate) => isSameDay(taskDate, day));
    final now = DateTime.now();
    final isTodayActual = isSameDay(day, now);

    return Container(
      decoration: BoxDecoration(
        color: isSelected ? primary : null,
        border: isTodayActual && !isSelected
            ? Border.all(color: primary)
            : null,
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '${day.day}',
              style: TextStyle(
                color: isSelected
                    ? Colors.white
                    : (isTodayActual ? primary : null),
                fontSize: 16,
              ),
            ),
            if (hasTasks)
              Transform.translate(
                offset: const Offset(0, -2.5),
                child: Container(
                  width: 6,
                  height: 6,
                  margin: const EdgeInsets.only(top: 2),
                  decoration: BoxDecoration(
                    color: isSelected ? Colors.white : primary,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Month dropdown + arrows
class MonthSelector extends StatelessWidget {
  const MonthSelector({
    required this.monthNames,
    required this.focusedDate,
    required this.onChanged,
    required this.onPrev,
    required this.onNext,
    super.key,
  });

  final List<String> monthNames;
  final DateTime focusedDate;
  final ValueChanged<String> onChanged;
  final VoidCallback onPrev;
  final VoidCallback onNext;

  @override
  Widget build(BuildContext context) {
    final selectedLabel = monthNames[focusedDate.month - 1];

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        SizedBox(
          width: 190.w,
          child: GLDropdown<String>(
            items: monthNames,
            selectedValue: selectedLabel,
            hintLabel: 'Select month',
            itemBuilder: Text.new,
            selectedItemBuilder: (m) => Align(
              alignment: Alignment.centerLeft,
              child: Text('$m ${focusedDate.year}'),
            ),
            onChanged: onChanged,
            hasBorder: false,
            buttonPadding: EdgeInsets.zero,
          ),
        ),
        Row(
          children: [
            IconButton(
              icon: const Icon(GLIcons.chevron_left),
              onPressed: onPrev,
            ),
            IconButton(
              icon: const Icon(GLIcons.chevronrighg),
              onPressed: onNext,
            ),
          ],
        ),
      ],
    );
  }
}
