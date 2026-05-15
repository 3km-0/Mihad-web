/**
 * United Arab Emirates district / community normalizer.
 *
 * Dubai listings emit a variety of spellings for the same community
 * (e.g. "Dubai Marina", "DXB Marina", "marina"). This map collapses common
 * variants to a canonical English form that the market observations table
 * mirrors. Extend as new communities are seeded into
 * `acquisition_market_observations` with `country_code = 'AE'`.
 */

export const DISTRICT_EN_TO_AR = Object.freeze({
  "dubai marina": "Dubai Marina",
  "marina": "Dubai Marina",
  "dxb marina": "Dubai Marina",
  "downtown dubai": "Downtown Dubai",
  "downtown": "Downtown Dubai",
  "burj khalifa area": "Downtown Dubai",
  "palm jumeirah": "Palm Jumeirah",
  "the palm": "Palm Jumeirah",
  "business bay": "Business Bay",
  "dubai hills": "Dubai Hills Estate",
  "dubai hills estate": "Dubai Hills Estate",
  "jbr": "Jumeirah Beach Residence",
  "jumeirah beach residence": "Jumeirah Beach Residence",
  "jvc": "Jumeirah Village Circle",
  "jumeirah village circle": "Jumeirah Village Circle",
  "jvt": "Jumeirah Village Triangle",
  "jumeirah village triangle": "Jumeirah Village Triangle",
  "arabian ranches": "Arabian Ranches",
  "mirdif": "Mirdif",
  "creek harbour": "Dubai Creek Harbour",
  "dubai creek harbour": "Dubai Creek Harbour",
  "the meadows": "The Meadows",
  "the springs": "The Springs",
  "emirates hills": "Emirates Hills",
  "al barsha": "Al Barsha",
  "barsha": "Al Barsha",
  "abu dhabi corniche": "Abu Dhabi Corniche",
  "saadiyat island": "Saadiyat Island",
  "yas island": "Yas Island",
  "al reem": "Al Reem Island",
  "al reem island": "Al Reem Island",
});
