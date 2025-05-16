import { atomWithStorage } from "jotai/utils";

export const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "JP", name: "Japan" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "IN", name: "India" },
  { code: "CN", name: "China" },
  { code: "AU", name: "Australia" },
  { code: "CA", name: "Canada" },
  { code: "TW", name: "Taiwan" },
];

export const weatherDefaultCountryAtom = atomWithStorage<string>(
  "weatherDefaultCountry",
  "US"
); 