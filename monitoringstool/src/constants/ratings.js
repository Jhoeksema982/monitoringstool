export const smileys = [
  { key: "rood", label: "Helemaal niet leuk" },
  { key: "beige", label: "Niet leuk" },
  { key: "geel", label: "Gewoon" },
  { key: "lichtgroen", label: "Leuk" },
  { key: "groen", label: "Heel leuk" },
];

export const numbers = [
  { key: 1, label: "1 - Slecht" },
  { key: 2, label: "2" },
  { key: 3, label: "3 - Gemiddeld" },
  { key: 4, label: "4" },
  { key: 5, label: "5 - Goed" },
];

export const scale = [
  { key: 1, label: "1" }, { key: 2, label: "2" }, { key: 3, label: "3" },
  { key: 4, label: "4" }, { key: 5, label: "5" }, { key: 6, label: "6" },
  { key: 7, label: "7" }, { key: 8, label: "8" }, { key: 9, label: "9" },
  { key: 10, label: "10" },
];

export const booleanOptions = [
  { key: "yes", label: "Ja" },
  { key: "no", label: "Nee" },
];

export const RATING_LABELS = Object.fromEntries(smileys.map(s => [s.key, s.label]));

export const QUESTION_TYPES = [
  { value: "smiley", label: "Smileys", description: "Kies een smiley" },
  { value: "number", label: "Cijfers (1-5)", description: "Kies een cijfer" },
  { value: "scale", label: "Schaal (1-10)", description: "Kies een getal op een schaal" },
  { value: "boolean", label: "Ja/Nee", description: "Kies ja of nee" },
  { value: "open", label: "Open vraag", description: "Vrije tekst invoer" },
  { value: "multiple_choice", label: "Meerkeuze", description: "Kies uit meerdere opties" },
];