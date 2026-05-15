/**
 * Türkiye district / neighbourhood normalizer.
 *
 * Turkish listings emit Turkish names with mixed casing and occasional English
 * transliterations ("besiktas" vs "Beşiktaş"). The market observations table
 * mirrors canonical Latin-letter labels (no Turkish diacritics) for join
 * stability; lookup terms here normalize to the same casing.
 */

export const DISTRICT_EN_TO_AR = Object.freeze({
  "besiktas": "Besiktas",
  "beşiktaş": "Besiktas",
  "kadikoy": "Kadikoy",
  "kadıköy": "Kadikoy",
  "sariyer": "Sariyer",
  "sarıyer": "Sariyer",
  "uskudar": "Uskudar",
  "üsküdar": "Uskudar",
  "sisli": "Sisli",
  "şişli": "Sisli",
  "fatih": "Fatih",
  "beyoglu": "Beyoglu",
  "beyoğlu": "Beyoglu",
  "bakirkoy": "Bakirkoy",
  "bakırköy": "Bakirkoy",
  "atasehir": "Atasehir",
  "ataşehir": "Atasehir",
  "maltepe": "Maltepe",
  "buyukcekmece": "Buyukcekmece",
  "büyükçekmece": "Buyukcekmece",
  "konyaalti": "Konyaalti",
  "konyaaltı": "Konyaalti",
  "muratpasa": "Muratpasa",
  "muratpaşa": "Muratpasa",
  "alanya": "Alanya",
  "bodrum": "Bodrum",
  "cesme": "Cesme",
  "çeşme": "Cesme",
  "fethiye": "Fethiye",
  "izmir": "Izmir",
  "izmir-bornova": "Bornova",
  "bornova": "Bornova",
  "konak": "Konak",
});
