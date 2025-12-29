import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'document_template.freezed.dart';
part 'document_template.g.dart';

/// Types of document templates available
enum DocumentTemplateType {
  liabilityWaiver,
  boardingAgreement,
  leaseAgreement,
  lessonContract,
  saleContract,
  traineeAgreement,
  coOwnershipAgreement,
  breedingContract,
  custom,
}

/// Status of a generated document
enum GeneratedDocumentStatus {
  draft,
  pendingSignature,
  partiallySigned,
  fullySigned,
  expired,
  cancelled,
}

/// A document template for generating legal/business documents.
@freezed
sealed class DocumentTemplate with _$DocumentTemplate {
  const factory DocumentTemplate({
    required String id,
    required String barnId,
    required String name,
    required DocumentTemplateType type,

    /// Template content with placeholders like {{client_name}}, {{horse_name}}
    required String content,

    /// Description of the template
    String? description,

    /// Available placeholder fields
    @Default(<TemplatePlaceholder>[]) List<TemplatePlaceholder> placeholders,

    /// Whether this is a system-provided template
    @Default(false) bool isSystemTemplate,

    /// Whether the template is active
    @Default(true) bool isActive,

    /// Version tracking
    @Default(1) int version,

    /// Created/updated info
    required String createdBy,
    @TimestampConverter() required DateTime createdAt,
    @NullableTimestampConverter() DateTime? updatedAt,
  }) = _DocumentTemplate;

  factory DocumentTemplate.fromJson(Map<String, dynamic> json) =>
      _$DocumentTemplateFromJson(json);
}

/// A placeholder field in a document template
@freezed
sealed class TemplatePlaceholder with _$TemplatePlaceholder {
  const factory TemplatePlaceholder({
    /// The placeholder key (e.g., 'client_name')
    required String key,

    /// Display label (e.g., 'Client Name')
    required String label,

    /// Type of value expected
    @Default(PlaceholderType.text) PlaceholderType type,

    /// Whether this field is required
    @Default(true) bool isRequired,

    /// Default value if not provided
    String? defaultValue,

    /// For dropdown/select types
    @Default(<String>[]) List<String> options,

    /// Auto-fill source (e.g., 'client.name', 'horse.name', 'barn.name')
    String? autoFillSource,
  }) = _TemplatePlaceholder;

  factory TemplatePlaceholder.fromJson(Map<String, dynamic> json) =>
      _$TemplatePlaceholderFromJson(json);
}

enum PlaceholderType {
  text,
  date,
  number,
  currency,
  select,
  signature,
  checkbox,
}

/// A document generated from a template
@freezed
sealed class GeneratedDocument with _$GeneratedDocument {
  const factory GeneratedDocument({
    required String id,
    required String barnId,
    required String templateId,
    required String templateName,
    required DocumentTemplateType templateType,

    /// The rendered document content
    required String renderedContent,

    /// Values used to fill placeholders
    @Default(<String, dynamic>{}) Map<String, dynamic> filledValues,

    /// Related entities
    String? clientId,
    String? clientName,
    String? horseId,
    String? horseName,

    /// Status and signatures
    @Default(GeneratedDocumentStatus.draft) GeneratedDocumentStatus status,
    @Default(<DocumentSignature>[]) List<DocumentSignature> signatures,

    /// PDF URL when generated
    String? pdfUrl,

    /// Created/updated info
    required String createdBy,
    @TimestampConverter() required DateTime createdAt,
    @NullableTimestampConverter() DateTime? sentAt,
    @NullableTimestampConverter() DateTime? completedAt,
    @NullableTimestampConverter() DateTime? expiresAt,
  }) = _GeneratedDocument;

  factory GeneratedDocument.fromJson(Map<String, dynamic> json) =>
      _$GeneratedDocumentFromJson(json);
}

/// A signature on a generated document
@freezed
sealed class DocumentSignature with _$DocumentSignature {
  const factory DocumentSignature({
    required String signerId,
    required String signerName,
    required String signerEmail,
    required String role, // 'client', 'owner', 'manager', 'witness'
    @Default(false) bool isSigned,
    String? signatureImageUrl,
    String? ipAddress,
    @NullableTimestampConverter() DateTime? signedAt,
  }) = _DocumentSignature;

  factory DocumentSignature.fromJson(Map<String, dynamic> json) =>
      _$DocumentSignatureFromJson(json);
}

/// AI-generated custom document request
@freezed
sealed class AiDocumentRequest with _$AiDocumentRequest {
  const factory AiDocumentRequest({
    required String id,
    required String barnId,
    required String requestedBy,

    /// User's description of what they need
    required String userPrompt,

    /// AI-generated document content
    String? generatedContent,

    /// Whether the user approved the generation
    @Default(false) bool isApproved,

    /// Processing status
    @Default(AiRequestStatus.pending) AiRequestStatus status,
    String? errorMessage,

    /// If approved, the template created from this
    String? createdTemplateId,

    @TimestampConverter() required DateTime createdAt,
    @NullableTimestampConverter() DateTime? processedAt,
  }) = _AiDocumentRequest;

  factory AiDocumentRequest.fromJson(Map<String, dynamic> json) =>
      _$AiDocumentRequestFromJson(json);
}

enum AiRequestStatus {
  pending,
  processing,
  completed,
  failed,
  approved,
  rejected,
}
