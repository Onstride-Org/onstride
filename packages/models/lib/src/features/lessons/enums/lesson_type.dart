/// Type of lesson being scheduled.
enum LessonType {
  privateSingle,
  privatePackage,
  groupLesson,
  training,
  assessment,
  other,
}

extension LessonTypeX on LessonType {
  String get displayName {
    switch (this) {
      case LessonType.privateSingle:
        return 'Private Lesson';
      case LessonType.privatePackage:
        return 'Private Package';
      case LessonType.groupLesson:
        return 'Group Lesson';
      case LessonType.training:
        return 'Training Session';
      case LessonType.assessment:
        return 'Assessment';
      case LessonType.other:
        return 'Other';
    }
  }
}
