import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:models/models.dart';

part 'scanned_document.freezed.dart';
part 'scanned_document.g.dart';

/// Type of equine document detected by OCR
enum ScannedDocumentType {
  coggins,
  healthCertificate,
  registration,
  vaccinationRecord,
  veterinaryReport,
  insurance,
  billOfSale,
  other,
}

/// Processing status of a scanned document
enum DocumentProcessingStatus {
  pending,
  processing,
  completed,
  failed,
  needsReview,
}

/// A document scanned and processed by OCR/AI.
@freezed
sealed class ScannedDocument with _$ScannedDocument {
  const factory ScannedDocument({
    required String id,
    required String barnId,
    required String uploadedBy,

    /// Original image/PDF URL
    required String originalFileUrl,

    /// Processing status
    @Default(DocumentProcessingStatus.pending)
    DocumentProcessingStatus status,

    /// AI-detected document type
    ScannedDocumentType? detectedType,
    @Default(0.0) double typeConfidence,

    /// Extracted text from OCR
    String? extractedText,

    /// Extracted fields
    String? extractedHorseName,
    String? extractedOwnerName,
    @NullableTimestampConverter() DateTime? extractedDate,
    @NullableTimestampConverter() DateTime? extractedExpirationDate,
    String? extractedVetName,
    String? extractedLabName,
    String? extractedTestResult,
    String? extractedRegistrationNumber,

    /// AI-suggested horse match
    String? suggestedHorseId,
    String? suggestedHorseName,
    @Default(0.0) double horseMatchConfidence,

    /// User-confirmed assignments
    String? confirmedHorseId,
    bool? userConfirmedType,
    bool? userConfirmedHorse,

    /// Final document created from this scan
    String? createdDocumentId,

    /// Error message if processing failed
    String? errorMessage,

    /// Timestamps
    @TimestampConverter() required DateTime createdAt,
    @NullableTimestampConverter() DateTime? processedAt,
    @NullableTimestampConverter() DateTime? confirmedAt,
  }) = _ScannedDocument;

  factory ScannedDocument.fromJson(Map<String, dynamic> json) =>
      _$ScannedDocumentFromJson(json);
}

/// Extracted data from a Coggins test specifically
@freezed
sealed class CogginsExtraction with _$CogginsExtraction {
  const factory CogginsExtraction({
    String? horseName,
    String? ownerName,
    String? ownerAddress,
    String? veterinarianName,
    String? veterinarianLicense,
    String? laboratoryName,
    String? accessionNumber,
    @NullableTimestampConverter() DateTime? testDate,
    @NullableTimestampConverter() DateTime? expirationDate,
    String? result, // 'Negative', 'Positive'
    String? horseDescription,
    String? horseAge,
    String? horseSex,
    String? horseColor,
    String? horseBreed,
    @Default(0.0) double overallConfidence,
  }) = _CogginsExtraction;

  factory CogginsExtraction.fromJson(Map<String, dynamic> json) =>
      _$CogginsExtractionFromJson(json);
}

/// Extracted data from a health certificate
@freezed
sealed class HealthCertExtraction with _$HealthCertExtraction {
  const factory HealthCertExtraction({
    String? horseName,
    String? ownerName,
    String? veterinarianName,
    String? veterinarianLicense,
    String? certificateNumber,
    @NullableTimestampConverter() DateTime? issueDate,
    @NullableTimestampConverter() DateTime? expirationDate,
    String? originState,
    String? destinationState,
    String? purposeOfMovement,
    @Default(<String>[]) List<String> vaccinationsListed,
    @Default(0.0) double overallConfidence,
  }) = _HealthCertExtraction;

  factory HealthCertExtraction.fromJson(Map<String, dynamic> json) =>
      _$HealthCertExtractionFromJson(json);
}
