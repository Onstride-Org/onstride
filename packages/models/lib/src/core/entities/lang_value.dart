import 'package:freezed_annotation/freezed_annotation.dart';

part 'lang_value.freezed.dart';
part 'lang_value.g.dart';

@freezed
sealed class LangValue with _$LangValue {
  const factory LangValue({
    required String code,
    required Map<String, String> values,
  }) = _LangValue;

  factory LangValue.fromJson(Map<String, dynamic> json) =>
      _$LangValueFromJson(json);
}

/// Lang helpers for localized display and safety.
extension LangValueX on LangValue {
  /// Returns the localized label for the given localeCode ('en', 'es', ...),
  /// falling back to English, then to the first available value, then to code.
  String label(String localeCode) {
    if (values.isEmpty) return code;
    return values[localeCode] ?? values['en'] ?? values.values.first;
  }
}

/// Catalog utils to search by code safely.
LangValue? findByCode(Iterable<LangValue> list, String code) {
  return list.firstWhere(
    (e) => e.code == code,
    orElse: () => const LangValue(code: '', values: {}),
  );
}

// Sex Status catalog
const List<LangValue> kHorseSexStatusCatalog = [
  LangValue(
    code: 'gelding',
    values: {'en': 'Gelding', 'es': 'Castrado'},
  ),
  LangValue(
    code: 'stallion',
    values: {'en': 'Stallion', 'es': 'Semental'},
  ),
  LangValue(
    code: 'mare',
    values: {'en': 'Mare', 'es': 'Yegua'},
  ),
  LangValue(
    code: 'foal',
    values: {'en': 'Foal', 'es': 'Potro/a'},
  ),
  LangValue(
    code: 'colt',
    values: {'en': 'Colt', 'es': 'Potro (macho joven)'},
  ),

  LangValue(
    code: 'filly',
    values: {'en': 'Filly', 'es': 'Potra (hembra joven)'},
  ),
];

// Horse breeds catalog
const List<LangValue> kHorseBreedCatalog = [
  LangValue(code: 'arabian', values: {'en': 'Arabian', 'es': 'Árabe'}),
  LangValue(
    code: 'thoroughbred',
    values: {'en': 'Thoroughbred', 'es': 'Pura Sangre Inglés'},
  ),
  LangValue(
    code: 'american_quarter_horse',
    values: {'en': 'American Quarter Horse', 'es': 'Cuarto de Milla Americano'},
  ),
  LangValue(
    code: 'american_paint_horse',
    values: {'en': 'American Paint Horse', 'es': 'Caballo Pinto Americano'},
  ),
  LangValue(code: 'appaloosa', values: {'en': 'Appaloosa', 'es': 'Appaloosa'}),
  LangValue(code: 'morgan', values: {'en': 'Morgan', 'es': 'Morgan'}),
  LangValue(
    code: 'andalusian_pre',
    values: {'en': 'Andalusian (PRE)', 'es': 'Andaluz (PRE)'},
  ),
  LangValue(code: 'lusitano', values: {'en': 'Lusitano', 'es': 'Lusitano'}),
  LangValue(
    code: 'warmblood_general',
    values: {'en': 'Warmblood (General)', 'es': 'Sangre Caliente (General)'},
  ),
  LangValue(
    code: 'dutch_warmblood_kwpn',
    values: {'en': 'Dutch Warmblood (KWPN)', 'es': 'Warmblood Holandés (KWPN)'},
  ),
  LangValue(
    code: 'hanoverian',
    values: {'en': 'Hanoverian', 'es': 'Hanoveriano'},
  ),
  LangValue(
    code: 'holsteiner',
    values: {'en': 'Holsteiner', 'es': 'Holsteiner'},
  ),
  LangValue(
    code: 'oldenburg',
    values: {'en': 'Oldenburg', 'es': 'Oldemburgués'},
  ),
  LangValue(code: 'trakehner', values: {'en': 'Trakehner', 'es': 'Trakehner'}),
  LangValue(
    code: 'westphalian',
    values: {'en': 'Westphalian', 'es': 'Westfaliano'},
  ),
  LangValue(
    code: 'swedish_warmblood',
    values: {'en': 'Swedish Warmblood', 'es': 'Warmblood Sueco'},
  ),
  LangValue(
    code: 'belgian_warmblood',
    values: {'en': 'Belgian Warmblood', 'es': 'Warmblood Belga'},
  ),
  LangValue(
    code: 'irish_sport_horse',
    values: {'en': 'Irish Sport Horse', 'es': 'Caballo Deportivo Irlandés'},
  ),
  LangValue(
    code: 'selle_francais',
    values: {'en': 'Selle Français', 'es': 'Selle Français'},
  ),
  LangValue(
    code: 'tennessee_walking_horse',
    values: {
      'en': 'Tennessee Walking Horse',
      'es': 'Caballo de Paso de Tennessee',
    },
  ),
  LangValue(
    code: 'missouri_fox_trotter',
    values: {'en': 'Missouri Fox Trotter', 'es': 'Missouri Fox Trotter'},
  ),
  LangValue(code: 'paso_fino', values: {'en': 'Paso Fino', 'es': 'Paso Fino'}),
  LangValue(
    code: 'peruvian_paso',
    values: {'en': 'Peruvian Paso', 'es': 'Paso Peruano'},
  ),
  LangValue(
    code: 'rocky_mountain_horse',
    values: {
      'en': 'Rocky Mountain Horse',
      'es': 'Caballo de las Montañas Rocosas',
    },
  ),
  LangValue(
    code: 'racking_horse',
    values: {'en': 'Racking Horse', 'es': 'Racking Horse'},
  ),
  LangValue(
    code: 'clydesdale',
    values: {'en': 'Clydesdale', 'es': 'Clydesdale'},
  ),
  LangValue(code: 'percheron', values: {'en': 'Percheron', 'es': 'Percherón'}),
  LangValue(
    code: 'belgian_draft',
    values: {'en': 'Belgian Draft', 'es': 'Caballo de Tiro Belga'},
  ),
  LangValue(code: 'shire', values: {'en': 'Shire', 'es': 'Shire'}),
  LangValue(
    code: 'suffolk_punch',
    values: {'en': 'Suffolk Punch', 'es': 'Suffolk Punch'},
  ),
  LangValue(code: 'friesian', values: {'en': 'Friesian', 'es': 'Frisón'}),
  LangValue(
    code: 'connemara_pony',
    values: {'en': 'Connemara Pony', 'es': 'Poni Connemara'},
  ),
  LangValue(
    code: 'welsh_pony_cob',
    values: {'en': 'Welsh Pony / Cob', 'es': 'Poni / Cob Galés'},
  ),
  LangValue(
    code: 'shetland_pony',
    values: {'en': 'Shetland Pony', 'es': 'Poni Shetland'},
  ),
  LangValue(
    code: 'dartmoor_pony',
    values: {'en': 'Dartmoor Pony', 'es': 'Poni Dartmoor'},
  ),
  LangValue(
    code: 'exmoor_pony',
    values: {'en': 'Exmoor Pony', 'es': 'Poni Exmoor'},
  ),
  LangValue(
    code: 'hackney_pony',
    values: {'en': 'Hackney Pony', 'es': 'Poni Hackney'},
  ),
  LangValue(code: 'mustang', values: {'en': 'Mustang', 'es': 'Mustang'}),
  LangValue(
    code: 'american_saddlebred',
    values: {'en': 'American Saddlebred', 'es': 'Silla Americana'},
  ),
  LangValue(
    code: 'standardbred',
    values: {'en': 'Standardbred', 'es': 'Standardbred'},
  ),
  LangValue(code: 'azteca', values: {'en': 'Azteca', 'es': 'Azteca'}),
  LangValue(code: 'criollo', values: {'en': 'Criollo', 'es': 'Criollo'}),
  LangValue(
    code: 'australian_stock_horse',
    values: {
      'en': 'Australian Stock Horse',
      'es': 'Caballo de Trabajo Australiano',
    },
  ),
  LangValue(code: 'pinto', values: {'en': 'Pinto', 'es': 'Pinto'}),
  LangValue(code: 'palomino', values: {'en': 'Palomino', 'es': 'Palomino'}),
  LangValue(code: 'buckskin', values: {'en': 'Buckskin', 'es': 'Bayo'}),
  LangValue(
    code: 'paint_cross',
    values: {'en': 'Paint Cross', 'es': 'Cruza Paint'},
  ),
  LangValue(
    code: 'warmblood_cross',
    values: {'en': 'Warmblood Cross', 'es': 'Cruza Warmblood'},
  ),
];
// Horse colors catalog
const List<LangValue> kHorseColorsCatalog = [
  LangValue(
    code: 'bay',
    values: {'en': 'Bay', 'es': 'Castaño'},
  ),
  LangValue(
    code: 'chestnut',
    values: {'en': 'Chestnut', 'es': 'Alazán'},
  ),
  LangValue(
    code: 'black',
    values: {'en': 'Black', 'es': 'Negro'},
  ),
  LangValue(
    code: 'gray',
    values: {'en': 'Gray', 'es': 'Tordillo'},
  ),
  LangValue(
    code: 'palomino',
    values: {'en': 'Palomino', 'es': 'Palomino'},
  ),
  LangValue(
    code: 'roan',
    values: {'en': 'Roan', 'es': 'Ruano'},
  ),
  LangValue(
    code: 'dun',
    values: {'en': 'Dun', 'es': 'Gateado'},
  ),
];
