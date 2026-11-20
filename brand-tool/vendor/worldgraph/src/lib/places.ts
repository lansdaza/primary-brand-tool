import { geoCentroid } from "d3-geo";
import { feature } from "topojson-client";
import countriesTopo from "world-atlas/countries-110m.json";

export type Place = { name: string; kind: "country" | "state" | "city"; parent?: string; lat: number; lng: number };

// Centroids of multi-part countries land in odd spots; pin these to their mainland.
const COUNTRY_FIX: Record<string, [number, number]> = {
  France: [46.6, 2.4], "United States of America": [39.8, -98.6], Norway: [61.5, 9.0], Russia: [61.5, 99.0],
  Canada: [56.1, -106.3], Chile: [-33.5, -70.7], Indonesia: [-2.5, 117.5], Japan: [36.2, 138.3],
  "New Zealand": [-41.3, 174.0], Fiji: [-17.8, 178.0], Malaysia: [3.5, 102.0], Denmark: [56.0, 9.5],
  Netherlands: [52.2, 5.3], "United Kingdom": [53.0, -1.8], Greece: [39.3, 22.0], Italy: [42.8, 12.6],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const feats = (feature(countriesTopo as any, (countriesTopo as any).objects.countries) as any).features as any[];
const countries: Place[] = feats.map((f) => {
  const name = String(f.properties?.name ?? "");
  const fix = COUNTRY_FIX[name];
  const [lng, lat] = fix ? [fix[1], fix[0]] : geoCentroid(f);
  return { name, kind: "country" as const, lat, lng };
}).filter((p) => p.name);
const usa = countries.find((c) => c.name === "United States of America");
if (usa) countries.push({ ...usa, name: "United States" }, { ...usa, name: "USA" });

const S = (parent: string, rows: [string, number, number][]): Place[] =>
  rows.map(([name, lat, lng]) => ({ name, kind: "state", parent, lat, lng }));
const states: Place[] = [
  ...S("United States", [
    ["Alabama", 32.8, -86.8], ["Alaska", 64.2, -150.0], ["Arizona", 34.2, -111.7], ["Arkansas", 34.9, -92.4],
    ["California", 37.2, -119.5], ["Colorado", 39.0, -105.5], ["Connecticut", 41.6, -72.7], ["Delaware", 39.0, -75.5],
    ["Florida", 28.6, -82.4], ["Georgia (US)", 32.7, -83.4], ["Hawaii", 20.8, -156.3], ["Idaho", 44.4, -114.6],
    ["Illinois", 40.0, -89.2], ["Indiana", 39.9, -86.3], ["Iowa", 42.1, -93.5], ["Kansas", 38.5, -98.4],
    ["Kentucky", 37.5, -85.3], ["Louisiana", 31.1, -92.0], ["Maine", 45.4, -69.2], ["Maryland", 39.0, -76.8],
    ["Massachusetts", 42.3, -71.8], ["Michigan", 44.3, -85.4], ["Minnesota", 46.3, -94.3], ["Mississippi", 32.7, -89.7],
    ["Missouri", 38.4, -92.5], ["Montana", 47.0, -109.6], ["Nebraska", 41.5, -99.8], ["Nevada", 39.3, -116.6],
    ["New Hampshire", 43.7, -71.6], ["New Jersey", 40.2, -74.7], ["New Mexico", 34.4, -106.1], ["New York State", 42.9, -75.5],
    ["North Carolina", 35.6, -79.4], ["North Dakota", 47.5, -100.5], ["Ohio", 40.3, -82.8], ["Oklahoma", 35.6, -97.5],
    ["Oregon", 43.9, -120.6], ["Pennsylvania", 40.9, -77.8], ["Rhode Island", 41.7, -71.5], ["South Carolina", 33.9, -80.9],
    ["South Dakota", 44.4, -100.2], ["Tennessee", 35.9, -86.4], ["Texas", 31.5, -99.3], ["Utah", 39.3, -111.7],
    ["Vermont", 44.1, -72.7], ["Virginia", 37.5, -78.9], ["Washington State", 47.4, -120.5], ["West Virginia", 38.6, -80.6],
    ["Wisconsin", 44.6, -89.9], ["Wyoming", 43.0, -107.6],
  ]),
  ...S("Canada", [
    ["Alberta", 54.5, -115.0], ["British Columbia", 53.7, -125.6], ["Manitoba", 55.0, -97.0], ["New Brunswick", 46.5, -66.2],
    ["Newfoundland and Labrador", 53.1, -57.7], ["Nova Scotia", 45.0, -63.0], ["Ontario", 50.0, -85.3],
    ["Prince Edward Island", 46.3, -63.2], ["Quebec", 52.9, -73.5], ["Saskatchewan", 54.0, -106.0],
  ]),
  ...S("Australia", [
    ["New South Wales", -32.2, 147.0], ["Queensland", -22.6, 144.1], ["South Australia", -30.0, 135.8],
    ["Tasmania", -42.0, 146.6], ["Victoria", -36.9, 144.3], ["Western Australia", -25.0, 121.6], ["Northern Territory", -19.5, 133.4],
  ]),
];

const C = (rows: [string, string, number, number][]): Place[] =>
  rows.map(([name, parent, lat, lng]) => ({ name, kind: "city", parent, lat, lng }));
const cities: Place[] = C([
  ["New York", "United States", 40.71, -74.01], ["Washington, D.C.", "United States", 38.9, -77.04], ["Los Angeles", "United States", 34.05, -118.24],
  ["San Francisco", "United States", 37.77, -122.42], ["Chicago", "United States", 41.88, -87.63], ["Houston", "United States", 29.76, -95.37],
  ["Miami", "United States", 25.76, -80.19], ["Boston", "United States", 42.36, -71.06], ["Seattle", "United States", 47.61, -122.33],
  ["Atlanta", "United States", 33.75, -84.39], ["Dallas", "United States", 32.78, -96.8], ["Denver", "United States", 39.74, -104.99],
  ["Toronto", "Canada", 43.65, -79.38], ["Ottawa", "Canada", 45.42, -75.69], ["Montreal", "Canada", 45.5, -73.57], ["Vancouver", "Canada", 49.28, -123.12],
  ["Mexico City", "Mexico", 19.43, -99.13], ["Havana", "Cuba", 23.11, -82.37], ["Bogotá", "Colombia", 4.71, -74.07], ["Lima", "Peru", -12.05, -77.04],
  ["Santiago", "Chile", -33.45, -70.67], ["Buenos Aires", "Argentina", -34.6, -58.38], ["São Paulo", "Brazil", -23.55, -46.63],
  ["Rio de Janeiro", "Brazil", -22.91, -43.17], ["Brasília", "Brazil", -15.79, -47.88], ["Caracas", "Venezuela", 10.48, -66.9],
  ["London", "United Kingdom", 51.51, -0.13], ["Edinburgh", "United Kingdom", 55.95, -3.19], ["Dublin", "Ireland", 53.35, -6.26],
  ["Paris", "France", 48.86, 2.35], ["Brussels", "Belgium", 50.85, 4.35], ["Amsterdam", "Netherlands", 52.37, 4.9], ["Berlin", "Germany", 52.52, 13.4],
  ["Frankfurt", "Germany", 50.11, 8.68], ["Munich", "Germany", 48.14, 11.58], ["Geneva", "Switzerland", 46.2, 6.14], ["Zurich", "Switzerland", 47.38, 8.54],
  ["Vienna", "Austria", 48.21, 16.37], ["Rome", "Italy", 41.9, 12.5], ["Milan", "Italy", 45.46, 9.19], ["Madrid", "Spain", 40.42, -3.7],
  ["Barcelona", "Spain", 41.39, 2.17], ["Lisbon", "Portugal", 38.72, -9.14], ["Oslo", "Norway", 59.91, 10.75], ["Stockholm", "Sweden", 59.33, 18.07],
  ["Copenhagen", "Denmark", 55.68, 12.57], ["Helsinki", "Finland", 60.17, 24.94], ["Warsaw", "Poland", 52.23, 21.01], ["Prague", "Czechia", 50.08, 14.44],
  ["Budapest", "Hungary", 47.5, 19.04], ["Athens", "Greece", 37.98, 23.73], ["Kyiv", "Ukraine", 50.45, 30.52], ["Moscow", "Russia", 55.76, 37.62],
  ["Istanbul", "Turkey", 41.01, 28.98], ["Ankara", "Turkey", 39.93, 32.86], ["Cairo", "Egypt", 30.04, 31.24], ["Lagos", "Nigeria", 6.52, 3.38],
  ["Abuja", "Nigeria", 9.08, 7.4], ["Nairobi", "Kenya", -1.29, 36.82], ["Addis Ababa", "Ethiopia", 9.03, 38.74], ["Johannesburg", "South Africa", -26.2, 28.05],
  ["Cape Town", "South Africa", -33.92, 18.42], ["Casablanca", "Morocco", 33.57, -7.59], ["Accra", "Ghana", 5.6, -0.19],
  ["Dubai", "United Arab Emirates", 25.2, 55.27], ["Abu Dhabi", "United Arab Emirates", 24.45, 54.38], ["Riyadh", "Saudi Arabia", 24.71, 46.68],
  ["Doha", "Qatar", 25.29, 51.53], ["Tel Aviv", "Israel", 32.09, 34.78], ["Jerusalem", "Israel", 31.77, 35.21], ["Tehran", "Iran", 35.69, 51.39],
  ["Karachi", "Pakistan", 24.86, 67.0], ["Islamabad", "Pakistan", 33.68, 73.05], ["New Delhi", "India", 28.61, 77.21], ["Mumbai", "India", 19.08, 72.88],
  ["Bengaluru", "India", 12.97, 77.59], ["Dhaka", "Bangladesh", 23.81, 90.41], ["Bangkok", "Thailand", 13.76, 100.5], ["Hanoi", "Vietnam", 21.03, 105.85],
  ["Ho Chi Minh City", "Vietnam", 10.82, 106.63], ["Kuala Lumpur", "Malaysia", 3.14, 101.69], ["Singapore", "Singapore", 1.35, 103.82],
  ["Jakarta", "Indonesia", -6.21, 106.85], ["Manila", "Philippines", 14.6, 120.98], ["Hong Kong", "China", 22.32, 114.17], ["Beijing", "China", 39.9, 116.4],
  ["Shanghai", "China", 31.23, 121.47], ["Shenzhen", "China", 22.54, 114.06], ["Taipei", "Taiwan", 25.03, 121.57], ["Seoul", "South Korea", 37.57, 126.98],
  ["Tokyo", "Japan", 35.68, 139.69], ["Osaka", "Japan", 34.69, 135.5], ["Sydney", "Australia", -33.87, 151.21], ["Melbourne", "Australia", -37.81, 144.96],
  ["Canberra", "Australia", -35.28, 149.13], ["Perth", "Australia", -31.95, 115.86], ["Auckland", "New Zealand", -36.85, 174.76], ["Wellington", "New Zealand", -41.29, 174.78],
]);

export const PLACES: Place[] = [...countries, ...states, ...cities];

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const indexed = PLACES.map((p) => ({ p, key: norm(p.name) }));

export function placeLabel(p: Place): string {
  return p.parent && p.parent !== p.name ? `${p.name}, ${p.parent}` : p.name;
}

export function searchPlaces(query: string, limit = 8): Place[] {
  const q = norm(query);
  if (!q) return [];
  const prefix = indexed.filter((e) => e.key.startsWith(q));
  const words = indexed.filter((e) => !e.key.startsWith(q) && e.key.split(/[\s,()-]+/).some((w) => w.startsWith(q)));
  const sub = indexed.filter((e) => !e.key.startsWith(q) && !words.includes(e) && e.key.includes(q));
  const rank = { country: 0, state: 1, city: 2 };
  const sort = (a: typeof indexed) => a.sort((x, y) => x.key.length - y.key.length || rank[x.p.kind] - rank[y.p.kind]);
  return [...sort(prefix), ...sort(words), ...sort(sub)].slice(0, limit).map((e) => e.p);
}
