/**
 * Greece district / area normalizer.
 *
 * Listings emit Greek names with Latin transliterations and occasional Greek
 * script. Market observations are stored as canonical English/Latin labels.
 * Extend as additional areas are seeded into acquisition_market_observations
 * with `country_code = 'GR'`.
 */

export const DISTRICT_EN_TO_AR = Object.freeze({
  "athens": "Athens",
  "athina": "Athens",
  "αθηνα": "Athens",
  "αθήνα": "Athens",
  "glyfada": "Glyfada",
  "γλυφαδα": "Glyfada",
  "kifissia": "Kifissia",
  "κηφισια": "Kifissia",
  "vouliagmeni": "Vouliagmeni",
  "voula": "Voula",
  "marousi": "Marousi",
  "maroussi": "Marousi",
  "psychiko": "Psychiko",
  "psychico": "Psychiko",
  "ekali": "Ekali",
  "kolonaki": "Kolonaki",
  "thessaloniki": "Thessaloniki",
  "θεσσαλονικη": "Thessaloniki",
  "santorini": "Santorini",
  "σαντορινη": "Santorini",
  "mykonos": "Mykonos",
  "μυκονος": "Mykonos",
  "crete": "Crete",
  "kriti": "Crete",
  "chania": "Chania",
  "rethymno": "Rethymno",
  "rhodes": "Rhodes",
  "rodos": "Rhodes",
  "paros": "Paros",
  "corfu": "Corfu",
  "kerkyra": "Corfu",
});
