import 'package:models/models.dart';

/// Service for processing scanned documents with OCR and AI.
///
/// This service handles document type detection, text extraction,
/// and entity recognition for equine documents.
class DocumentScanningService {
  /// Detects the type of document from extracted text.
  ScannedDocumentType detectDocumentType(String extractedText) {
    final lowerText = extractedText.toLowerCase();

    // Coggins test indicators
    if (lowerText.contains('coggins') ||
        lowerText.contains('equine infectious anemia') ||
        lowerText.contains('eia') ||
        lowerText.contains('agar gel immunodiffusion')) {
      return ScannedDocumentType.coggins;
    }

    // Health certificate indicators
    if (lowerText.contains('health certificate') ||
        lowerText.contains('certificate of veterinary inspection') ||
        lowerText.contains('cvi') ||
        lowerText.contains('interstate movement')) {
      return ScannedDocumentType.healthCertificate;
    }

    // Registration indicators
    if (lowerText.contains('registration') ||
        lowerText.contains('registered name') ||
        lowerText.contains('certificate of registration') ||
        lowerText.contains('breed registry')) {
      return ScannedDocumentType.registration;
    }

    // Vaccination record indicators
    if (lowerText.contains('vaccination') ||
        lowerText.contains('vaccine') ||
        lowerText.contains('immunization') ||
        lowerText.contains('rabies') ||
        lowerText.contains('west nile') ||
        lowerText.contains('tetanus')) {
      return ScannedDocumentType.vaccinationRecord;
    }

    // Veterinary report indicators
    if (lowerText.contains('veterinary') ||
        lowerText.contains('examination') ||
        lowerText.contains('diagnosis') ||
        lowerText.contains('treatment plan')) {
      return ScannedDocumentType.veterinaryReport;
    }

    // Insurance indicators
    if (lowerText.contains('insurance') ||
        lowerText.contains('policy') ||
        lowerText.contains('coverage') ||
        lowerText.contains('premium')) {
      return ScannedDocumentType.insurance;
    }

    // Bill of sale indicators
    if (lowerText.contains('bill of sale') ||
        lowerText.contains('purchase agreement') ||
        lowerText.contains('seller') && lowerText.contains('buyer')) {
      return ScannedDocumentType.billOfSale;
    }

    return ScannedDocumentType.other;
  }

  /// Calculates confidence score for document type detection.
  double calculateTypeConfidence(String extractedText, ScannedDocumentType type) {
    final lowerText = extractedText.toLowerCase();
    var matchCount = 0;
    var totalKeywords = 0;

    final keywords = _getKeywordsForType(type);
    totalKeywords = keywords.length;

    for (final keyword in keywords) {
      if (lowerText.contains(keyword)) {
        matchCount++;
      }
    }

    if (totalKeywords == 0) return 0.0;
    return (matchCount / totalKeywords).clamp(0.0, 1.0);
  }

  List<String> _getKeywordsForType(ScannedDocumentType type) {
    switch (type) {
      case ScannedDocumentType.coggins:
        return [
          'coggins',
          'eia',
          'negative',
          'laboratory',
          'accession',
          'test date',
          'veterinarian'
        ];
      case ScannedDocumentType.healthCertificate:
        return [
          'health certificate',
          'cvi',
          'origin',
          'destination',
          'inspection',
          'veterinarian'
        ];
      case ScannedDocumentType.registration:
        return [
          'registration',
          'breed',
          'sire',
          'dam',
          'foal date',
          'registry'
        ];
      case ScannedDocumentType.vaccinationRecord:
        return [
          'vaccine',
          'dose',
          'date administered',
          'next due',
          'lot number'
        ];
      case ScannedDocumentType.veterinaryReport:
        return [
          'examination',
          'findings',
          'diagnosis',
          'treatment',
          'veterinarian'
        ];
      case ScannedDocumentType.insurance:
        return [
          'policy',
          'coverage',
          'premium',
          'insured value',
          'effective date'
        ];
      case ScannedDocumentType.billOfSale:
        return [
          'seller',
          'buyer',
          'purchase price',
          'date of sale',
          'consideration'
        ];
      case ScannedDocumentType.other:
        return [];
    }
  }

  /// Extracts Coggins-specific data from text.
  CogginsExtraction extractCogginsData(String extractedText) {
    final lines = extractedText.split('\n');

    return CogginsExtraction(
      horseName: _extractField(lines, ['horse name', 'animal name', 'name of horse']),
      ownerName: _extractField(lines, ['owner', 'owner name', 'owner/agent']),
      ownerAddress: _extractField(lines, ['address', 'owner address']),
      veterinarianName: _extractField(lines, ['veterinarian', 'vet', 'attending vet']),
      veterinarianLicense: _extractField(lines, ['license', 'vet license', 'license no']),
      laboratoryName: _extractField(lines, ['laboratory', 'lab', 'testing lab']),
      accessionNumber: _extractField(lines, ['accession', 'lab number', 'sample id']),
      testDate: _extractDate(lines, ['test date', 'date tested', 'date of test']),
      expirationDate: _extractDate(lines, ['expiration', 'expires', 'valid until']),
      result: _extractResult(extractedText),
      horseDescription: _extractField(lines, ['description', 'markings']),
      horseAge: _extractField(lines, ['age', 'years']),
      horseSex: _extractField(lines, ['sex', 'gender']),
      horseColor: _extractField(lines, ['color', 'coat color']),
      horseBreed: _extractField(lines, ['breed']),
      overallConfidence: 0.7, // Would be calculated based on matches
    );
  }

  /// Extracts health certificate data from text.
  HealthCertExtraction extractHealthCertData(String extractedText) {
    final lines = extractedText.split('\n');

    return HealthCertExtraction(
      horseName: _extractField(lines, ['horse name', 'animal', 'name']),
      ownerName: _extractField(lines, ['owner', 'consignor']),
      veterinarianName: _extractField(lines, ['veterinarian', 'accredited vet']),
      veterinarianLicense: _extractField(lines, ['license', 'accreditation']),
      certificateNumber: _extractField(lines, ['certificate number', 'cert no', 'cvi number']),
      issueDate: _extractDate(lines, ['issue date', 'date issued', 'date']),
      expirationDate: _extractDate(lines, ['expiration', 'valid until', 'expires']),
      originState: _extractField(lines, ['origin', 'state of origin', 'from']),
      destinationState: _extractField(lines, ['destination', 'to', 'consigned to']),
      purposeOfMovement: _extractField(lines, ['purpose', 'reason']),
      vaccinationsListed: _extractVaccinations(extractedText),
      overallConfidence: 0.7,
    );
  }

  /// Matches extracted horse name to existing horses.
  (String? horseId, String? horseName, double confidence) matchHorse(
    String? extractedName,
    List<HorseModel> horses,
  ) {
    if (extractedName == null || extractedName.isEmpty) {
      return (null, null, 0.0);
    }

    final normalizedExtracted = extractedName.toLowerCase().trim();
    HorseModel? bestMatch;
    var bestScore = 0.0;

    for (final horse in horses) {
      // Check barn name
      var score = _calculateSimilarity(normalizedExtracted, horse.name.toLowerCase());

      // Check registered name if available
      if (horse.registeredName != null) {
        final regScore = _calculateSimilarity(
          normalizedExtracted,
          horse.registeredName!.toLowerCase(),
        );
        if (regScore > score) score = regScore;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = horse;
      }
    }

    if (bestMatch != null && bestScore >= 0.6) {
      return (bestMatch.id, bestMatch.name, bestScore);
    }

    return (null, null, 0.0);
  }

  String? _extractField(List<String> lines, List<String> fieldNames) {
    for (final line in lines) {
      final lowerLine = line.toLowerCase();
      for (final field in fieldNames) {
        if (lowerLine.contains(field)) {
          // Try to extract value after colon or field name
          final colonIndex = line.indexOf(':');
          if (colonIndex != -1 && colonIndex < line.length - 1) {
            return line.substring(colonIndex + 1).trim();
          }
          // Try to extract value after field name
          final fieldIndex = lowerLine.indexOf(field);
          if (fieldIndex != -1) {
            final afterField = line.substring(fieldIndex + field.length).trim();
            if (afterField.isNotEmpty) {
              return afterField.replaceFirst(RegExp(r'^[:\s]+'), '');
            }
          }
        }
      }
    }
    return null;
  }

  DateTime? _extractDate(List<String> lines, List<String> fieldNames) {
    final dateStr = _extractField(lines, fieldNames);
    if (dateStr == null) return null;

    // Try various date formats
    final patterns = [
      RegExp(r'(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})'),
      RegExp(r'(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})'),
    ];

    for (final pattern in patterns) {
      final match = pattern.firstMatch(dateStr);
      if (match != null) {
        try {
          // Assume MM/DD/YYYY or YYYY/MM/DD
          if (match.group(1)!.length == 4) {
            return DateTime(
              int.parse(match.group(1)!),
              int.parse(match.group(2)!),
              int.parse(match.group(3)!),
            );
          } else {
            return DateTime(
              int.parse(match.group(3)!),
              int.parse(match.group(1)!),
              int.parse(match.group(2)!),
            );
          }
        } catch (_) {
          continue;
        }
      }
    }
    return null;
  }

  String? _extractResult(String text) {
    final lowerText = text.toLowerCase();
    if (lowerText.contains('negative')) return 'Negative';
    if (lowerText.contains('positive')) return 'Positive';
    return null;
  }

  List<String> _extractVaccinations(String text) {
    final vaccines = <String>[];
    final commonVaccines = [
      'rabies',
      'west nile',
      'eastern equine encephalomyelitis',
      'eee',
      'western equine encephalomyelitis',
      'wee',
      'tetanus',
      'influenza',
      'rhinopneumonitis',
      'strangles',
      'potomac horse fever',
      'botulism',
    ];

    final lowerText = text.toLowerCase();
    for (final vaccine in commonVaccines) {
      if (lowerText.contains(vaccine)) {
        vaccines.add(vaccine[0].toUpperCase() + vaccine.substring(1));
      }
    }

    return vaccines;
  }

  double _calculateSimilarity(String a, String b) {
    if (a == b) return 1.0;
    if (a.isEmpty || b.isEmpty) return 0.0;

    // Simple word overlap similarity
    final wordsA = a.split(RegExp(r'\s+'));
    final wordsB = b.split(RegExp(r'\s+'));

    var matches = 0;
    for (final wordA in wordsA) {
      for (final wordB in wordsB) {
        if (wordA == wordB || wordA.contains(wordB) || wordB.contains(wordA)) {
          matches++;
          break;
        }
      }
    }

    return matches / wordsA.length.clamp(1, 100);
  }
}
