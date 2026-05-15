/**
 * Spain district / barrio normalizer.
 *
 * Spanish listings emit a mix of Spanish names and English transliterations
 * (eg. "Marbella", "marbella oeste"). Market observations use canonical
 * Spanish labels; lookups normalize casing and strip diacritics.
 */

export const DISTRICT_EN_TO_AR = Object.freeze({
  "madrid": "Madrid",
  "madrid centro": "Madrid Centro",
  "salamanca": "Salamanca",
  "chamberi": "Chamberi",
  "chamberí": "Chamberi",
  "retiro": "Retiro",
  "chamartin": "Chamartin",
  "chamartín": "Chamartin",
  "barcelona": "Barcelona",
  "eixample": "Eixample",
  "gracia": "Gracia",
  "gràcia": "Gracia",
  "sarria": "Sarria",
  "sarrià": "Sarria",
  "sant gervasi": "Sant Gervasi",
  "ciutat vella": "Ciutat Vella",
  "valencia": "Valencia",
  "valència": "Valencia",
  "ruzafa": "Ruzafa",
  "ruzafa russafa": "Ruzafa",
  "russafa": "Ruzafa",
  "el cabanyal": "El Cabanyal",
  "marbella": "Marbella",
  "puerto banus": "Puerto Banus",
  "puerto banús": "Puerto Banus",
  "estepona": "Estepona",
  "mijas": "Mijas",
  "fuengirola": "Fuengirola",
  "benalmadena": "Benalmadena",
  "benalmádena": "Benalmadena",
  "malaga": "Malaga",
  "málaga": "Malaga",
  "ibiza": "Ibiza",
  "eivissa": "Ibiza",
  "palma": "Palma de Mallorca",
  "palma de mallorca": "Palma de Mallorca",
  "mallorca": "Palma de Mallorca",
  "sevilla": "Sevilla",
  "seville": "Sevilla",
  "alicante": "Alicante",
  "javea": "Javea",
  "jávea": "Javea",
  "altea": "Altea",
});
