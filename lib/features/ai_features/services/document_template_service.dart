import 'package:models/models.dart';

/// Service for managing and rendering document templates.
class DocumentTemplateService {
  /// Gets the default system templates.
  List<DocumentTemplate> getSystemTemplates(String barnId) {
    final now = DateTime.now();
    return [
      DocumentTemplate(
        id: 'sys_liability_waiver',
        barnId: barnId,
        name: 'Liability Waiver',
        type: DocumentTemplateType.liabilityWaiver,
        description: 'Standard liability waiver for riding activities',
        content: _liabilityWaiverTemplate,
        placeholders: _liabilityWaiverPlaceholders,
        isSystemTemplate: true,
        createdBy: 'system',
        createdAt: now,
      ),
      DocumentTemplate(
        id: 'sys_boarding_agreement',
        barnId: barnId,
        name: 'Boarding Agreement',
        type: DocumentTemplateType.boardingAgreement,
        description: 'Horse boarding contract with terms and conditions',
        content: _boardingAgreementTemplate,
        placeholders: _boardingAgreementPlaceholders,
        isSystemTemplate: true,
        createdBy: 'system',
        createdAt: now,
      ),
      DocumentTemplate(
        id: 'sys_lease_agreement',
        barnId: barnId,
        name: 'Horse Lease Agreement',
        type: DocumentTemplateType.leaseAgreement,
        description: 'Agreement for leasing a horse',
        content: _leaseAgreementTemplate,
        placeholders: _leaseAgreementPlaceholders,
        isSystemTemplate: true,
        createdBy: 'system',
        createdAt: now,
      ),
      DocumentTemplate(
        id: 'sys_lesson_contract',
        barnId: barnId,
        name: 'Lesson Contract',
        type: DocumentTemplateType.lessonContract,
        description: 'Contract for riding lessons',
        content: _lessonContractTemplate,
        placeholders: _lessonContractPlaceholders,
        isSystemTemplate: true,
        createdBy: 'system',
        createdAt: now,
      ),
    ];
  }

  /// Renders a template with the provided values.
  String renderTemplate(
    DocumentTemplate template,
    Map<String, dynamic> values,
  ) {
    var content = template.content;

    for (final placeholder in template.placeholders) {
      final value = values[placeholder.key] ?? placeholder.defaultValue ?? '';
      final formattedValue = _formatValue(value, placeholder.type);
      content = content.replaceAll('{{${placeholder.key}}}', formattedValue);
    }

    return content;
  }

  /// Gets placeholder values from related entities.
  Map<String, dynamic> getAutoFillValues({
    BarnModel? barn,
    GLUser? client,
    HorseModel? horse,
  }) {
    final values = <String, dynamic>{};

    if (barn != null) {
      values['barn_name'] = barn.name;
      values['barn_address'] = barn.address ?? '';
      values['barn_phone'] = barn.phoneNumber ?? '';
      values['barn_email'] = barn.email ?? '';
    }

    if (client != null) {
      values['client_name'] = client.name ?? '';
      values['client_email'] = client.email ?? '';
      values['client_phone'] = client.phoneNumber ?? '';
      values['client_address'] = client.address ?? '';
    }

    if (horse != null) {
      values['horse_name'] = horse.name;
      values['horse_breed'] = horse.breed.langValue;
      values['horse_color'] = horse.color ?? '';
      values['horse_age'] = horse.age.toString();
      values['horse_registration'] = horse.usefNumber ?? horse.feiNumber ?? '';
    }

    values['current_date'] = DateTime.now();

    return values;
  }

  String _formatValue(dynamic value, PlaceholderType type) {
    switch (type) {
      case PlaceholderType.date:
        if (value is DateTime) {
          return '${value.month}/${value.day}/${value.year}';
        }
        return value.toString();
      case PlaceholderType.currency:
        if (value is num) {
          return '\$${value.toStringAsFixed(2)}';
        }
        return value.toString();
      case PlaceholderType.checkbox:
        return value == true ? '☑' : '☐';
      default:
        return value.toString();
    }
  }

  // Template content and placeholders
  static const _liabilityWaiverTemplate = '''
RELEASE AND WAIVER OF LIABILITY

This Release and Waiver of Liability ("Release") is executed on {{current_date}}
by {{client_name}} ("Participant") in favor of {{barn_name}} ("Stable"), its owners,
employees, agents, and representatives.

ASSUMPTION OF RISK
I understand and acknowledge that horseback riding and related equestrian activities
involve inherent risks, dangers, and hazards which may result in serious injury or
death to participants and spectators.

I VOLUNTARILY ASSUME ALL RISKS of injury or death that may occur as a result of my
participation in any horseback riding or related equestrian activities at {{barn_name}}.

RELEASE OF LIABILITY
In consideration for being allowed to participate in equestrian activities at {{barn_name}},
I hereby RELEASE, WAIVE, DISCHARGE, AND COVENANT NOT TO SUE {{barn_name}}, its owners,
officers, employees, agents, and representatives from any and all liability, claims,
demands, actions, or causes of action arising out of my participation.

EMERGENCY CONTACT
Name: {{emergency_contact_name}}
Phone: {{emergency_contact_phone}}

PARTICIPANT SIGNATURE
Signature: _________________________ Date: {{current_date}}
Printed Name: {{client_name}}

{{#if_minor}}
PARENT/GUARDIAN SIGNATURE (if participant is under 18)
Signature: _________________________ Date: {{current_date}}
Printed Name: {{guardian_name}}
{{/if_minor}}
''';

  static const _liabilityWaiverPlaceholders = <TemplatePlaceholder>[
    TemplatePlaceholder(
      key: 'client_name',
      label: 'Participant Name',
      autoFillSource: 'client.name',
    ),
    TemplatePlaceholder(
      key: 'barn_name',
      label: 'Stable Name',
      autoFillSource: 'barn.name',
    ),
    TemplatePlaceholder(
      key: 'current_date',
      label: 'Date',
      type: PlaceholderType.date,
    ),
    TemplatePlaceholder(
      key: 'emergency_contact_name',
      label: 'Emergency Contact Name',
    ),
    TemplatePlaceholder(
      key: 'emergency_contact_phone',
      label: 'Emergency Contact Phone',
    ),
    TemplatePlaceholder(
      key: 'guardian_name',
      label: 'Parent/Guardian Name',
      isRequired: false,
    ),
  ];

  static const _boardingAgreementTemplate = '''
HORSE BOARDING AGREEMENT

This Agreement is made on {{current_date}} between:

STABLE: {{barn_name}}
Address: {{barn_address}}

OWNER: {{client_name}}
Address: {{client_address}}
Phone: {{client_phone}}
Email: {{client_email}}

HORSE INFORMATION:
Name: {{horse_name}}
Breed: {{horse_breed}}
Color: {{horse_color}}
Age: {{horse_age}}

BOARDING TERMS:
Board Type: {{board_type}}
Monthly Rate: {{monthly_rate}}
Payment Due: {{payment_due_day}} of each month

SERVICES INCLUDED:
{{services_included}}

ADDITIONAL TERMS:
1. Owner agrees to keep current Coggins test and health certificates on file.
2. Owner agrees to maintain adequate insurance on the horse.
3. Either party may terminate this agreement with {{notice_days}} days written notice.

SIGNATURES:
Stable Representative: _________________________ Date: {{current_date}}
Owner: _________________________ Date: {{current_date}}
''';

  static const _boardingAgreementPlaceholders = <TemplatePlaceholder>[
    TemplatePlaceholder(
      key: 'barn_name',
      label: 'Stable Name',
      autoFillSource: 'barn.name',
    ),
    TemplatePlaceholder(
      key: 'barn_address',
      label: 'Stable Address',
      autoFillSource: 'barn.address',
    ),
    TemplatePlaceholder(
      key: 'client_name',
      label: 'Owner Name',
      autoFillSource: 'client.name',
    ),
    TemplatePlaceholder(
      key: 'client_address',
      label: 'Owner Address',
      autoFillSource: 'client.address',
    ),
    TemplatePlaceholder(
      key: 'client_phone',
      label: 'Owner Phone',
      autoFillSource: 'client.phone',
    ),
    TemplatePlaceholder(
      key: 'client_email',
      label: 'Owner Email',
      autoFillSource: 'client.email',
    ),
    TemplatePlaceholder(
      key: 'horse_name',
      label: 'Horse Name',
      autoFillSource: 'horse.name',
    ),
    TemplatePlaceholder(
      key: 'horse_breed',
      label: 'Horse Breed',
      autoFillSource: 'horse.breed',
    ),
    TemplatePlaceholder(
      key: 'horse_color',
      label: 'Horse Color',
      autoFillSource: 'horse.color',
    ),
    TemplatePlaceholder(
      key: 'horse_age',
      label: 'Horse Age',
      autoFillSource: 'horse.age',
    ),
    TemplatePlaceholder(
      key: 'board_type',
      label: 'Board Type',
      type: PlaceholderType.select,
      options: ['Full Board', 'Partial Board', 'Pasture Board', 'Training Board'],
    ),
    TemplatePlaceholder(
      key: 'monthly_rate',
      label: 'Monthly Rate',
      type: PlaceholderType.currency,
    ),
    TemplatePlaceholder(
      key: 'payment_due_day',
      label: 'Payment Due Day',
      defaultValue: '1st',
    ),
    TemplatePlaceholder(
      key: 'services_included',
      label: 'Services Included',
    ),
    TemplatePlaceholder(
      key: 'notice_days',
      label: 'Notice Period (days)',
      type: PlaceholderType.number,
      defaultValue: '30',
    ),
    TemplatePlaceholder(
      key: 'current_date',
      label: 'Date',
      type: PlaceholderType.date,
    ),
  ];

  static const _leaseAgreementTemplate = '''
HORSE LEASE AGREEMENT

This Lease Agreement is made on {{current_date}} between:

OWNER (Lessor): {{owner_name}}
LESSEE: {{client_name}}

HORSE INFORMATION:
Name: {{horse_name}}
Breed: {{horse_breed}}
Registration: {{horse_registration}}

LEASE TERMS:
Lease Type: {{lease_type}}
Start Date: {{start_date}}
End Date: {{end_date}}
Monthly Lease Fee: {{lease_fee}}

PERMITTED ACTIVITIES:
{{permitted_activities}}

RESPONSIBILITIES:
The Lessee agrees to:
1. Provide proper care and feeding for the horse
2. Maintain required insurance
3. Not sublease the horse without written permission
4. Return the horse in the same condition (normal wear excepted)

SIGNATURES:
Owner: _________________________ Date: {{current_date}}
Lessee: _________________________ Date: {{current_date}}
''';

  static const _leaseAgreementPlaceholders = <TemplatePlaceholder>[
    TemplatePlaceholder(key: 'owner_name', label: 'Owner Name'),
    TemplatePlaceholder(
      key: 'client_name',
      label: 'Lessee Name',
      autoFillSource: 'client.name',
    ),
    TemplatePlaceholder(
      key: 'horse_name',
      label: 'Horse Name',
      autoFillSource: 'horse.name',
    ),
    TemplatePlaceholder(
      key: 'horse_breed',
      label: 'Horse Breed',
      autoFillSource: 'horse.breed',
    ),
    TemplatePlaceholder(
      key: 'horse_registration',
      label: 'Registration Number',
      autoFillSource: 'horse.registration',
      isRequired: false,
    ),
    TemplatePlaceholder(
      key: 'lease_type',
      label: 'Lease Type',
      type: PlaceholderType.select,
      options: ['Full Lease', 'Half Lease', 'Partial Lease'],
    ),
    TemplatePlaceholder(
      key: 'start_date',
      label: 'Start Date',
      type: PlaceholderType.date,
    ),
    TemplatePlaceholder(
      key: 'end_date',
      label: 'End Date',
      type: PlaceholderType.date,
    ),
    TemplatePlaceholder(
      key: 'lease_fee',
      label: 'Monthly Lease Fee',
      type: PlaceholderType.currency,
    ),
    TemplatePlaceholder(
      key: 'permitted_activities',
      label: 'Permitted Activities',
    ),
    TemplatePlaceholder(
      key: 'current_date',
      label: 'Date',
      type: PlaceholderType.date,
    ),
  ];

  static const _lessonContractTemplate = '''
RIDING LESSON CONTRACT

This Contract is made on {{current_date}} between:

STABLE: {{barn_name}}
STUDENT: {{client_name}}

LESSON DETAILS:
Lesson Type: {{lesson_type}}
Instructor: {{instructor_name}}
Schedule: {{lesson_schedule}}
Rate: {{lesson_rate}} per lesson

TERMS AND CONDITIONS:
1. Cancellation Policy: {{cancellation_policy}}
2. Student must arrive {{arrival_time}} minutes before scheduled lesson
3. Appropriate riding attire is required
4. Student agrees to follow all safety instructions

PAYMENT TERMS:
{{payment_terms}}

SIGNATURES:
Stable Representative: _________________________ Date: {{current_date}}
Student/Guardian: _________________________ Date: {{current_date}}
''';

  static const _lessonContractPlaceholders = <TemplatePlaceholder>[
    TemplatePlaceholder(
      key: 'barn_name',
      label: 'Stable Name',
      autoFillSource: 'barn.name',
    ),
    TemplatePlaceholder(
      key: 'client_name',
      label: 'Student Name',
      autoFillSource: 'client.name',
    ),
    TemplatePlaceholder(
      key: 'lesson_type',
      label: 'Lesson Type',
      type: PlaceholderType.select,
      options: ['Private', 'Semi-Private', 'Group'],
    ),
    TemplatePlaceholder(key: 'instructor_name', label: 'Instructor Name'),
    TemplatePlaceholder(key: 'lesson_schedule', label: 'Lesson Schedule'),
    TemplatePlaceholder(
      key: 'lesson_rate',
      label: 'Lesson Rate',
      type: PlaceholderType.currency,
    ),
    TemplatePlaceholder(
      key: 'cancellation_policy',
      label: 'Cancellation Policy',
      defaultValue: '24 hours notice required for cancellation',
    ),
    TemplatePlaceholder(
      key: 'arrival_time',
      label: 'Arrival Time (minutes before)',
      type: PlaceholderType.number,
      defaultValue: '15',
    ),
    TemplatePlaceholder(key: 'payment_terms', label: 'Payment Terms'),
    TemplatePlaceholder(
      key: 'current_date',
      label: 'Date',
      type: PlaceholderType.date,
    ),
  ];
}
