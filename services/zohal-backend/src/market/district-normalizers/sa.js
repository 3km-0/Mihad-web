/**
 * Saudi Arabia district normalizer.
 *
 * Listing sources (Bayut, Aqar) may emit district names as:
 *   - Clean Arabic ("العارض")
 *   - Noisy Arabic ("العارض 87715769 - بيوت شاهد الفيديو")
 *   - English transliterations ("Al Arid", "Alarid", "Al-Arid")
 *
 * Market observations use clean Arabic. The lookup pipeline strips noise,
 * normalizes Arabic orthography, maps common English names to Arabic, then
 * tries an ILIKE in the DB. Extend this table as new districts are observed.
 */

export const DISTRICT_EN_TO_AR = Object.freeze({
  "al arid": "العارض",
  "alarid": "العارض",
  "al-arid": "العارض",
  "al aarid": "العارض",
  "al aared": "العارض",
  "al'arid": "العارض",
  "alaared": "العارض",
  "narjis": "النرجس",
  "al narjis": "النرجس",
  "narjes": "النرجس",
  "malqa": "الملقا",
  "al malqa": "الملقا",
  "almalqa": "الملقا",
  "hittin": "حطين",
  "hitteen": "حطين",
  "hatin": "حطين",
  "hattin": "حطين",
  "yasmin": "الياسمين",
  "al yasmin": "الياسمين",
  "yasmeen": "الياسمين",
  "al yasmeen": "الياسمين",
  "qirowaan": "القيروان",
  "al qirowaan": "القيروان",
  "qeerawan": "القيروان",
  "hamra": "الحمراء",
  "al hamra": "الحمراء",
  "al hamraa": "الحمراء",
  "nakheel": "النخيل",
  "al nakheel": "النخيل",
  "sahafa": "الصحافة",
  "al sahafa": "الصحافة",
  "rimal": "الرمال",
  "al rimal": "الرمال",
  "hazm": "الحزم",
  "al hazm": "الحزم",
  "rawdah": "الروضة",
  "al rawdah": "الروضة",
  "rowdah": "الروضة",
  "rahmaniya": "الرحمانية",
  "al rahmaniya": "الرحمانية",
  "al rabi": "الربيع",
  "al rabee": "الربيع",
  "sulaymaniya": "السليمانية",
  "al sulaymaniya": "السليمانية",
  "al shohada": "الشهداء",
  "shohada": "الشهداء",
  "izdihar": "الإزدهار",
  "al izdihar": "الإزدهار",
  "al salam": "السلام",
  "salam": "السلام",
  "al rabwa": "الربوة",
  "rabwa": "الربوة",
  "al jaradiya": "الجرادية",
  "jaradiya": "الجرادية",
  "jundaria": "الجنادرية",
  "al jundaria": "الجنادرية",
  "janadriyah": "الجنادرية",
});
