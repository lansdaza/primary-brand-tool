// @ts-nocheck
// The Aurelius World Graph tool, compiled from its own source (the Lovable project) rather than rebuilt:
// the globe, landmark cities, place search, rails, exporter and particle studio are the tool's code.
// The brand tool supplies the frame around them and the brand's tones.
export { default as Globe, PALETTES } from '@/components/Globe';
export { default as DesignScene } from '@/components/DesignScene';
export { searchPlaces, placeLabel } from '@/lib/places';
export { CITIES, cityNear } from '@/lib/cities';
export { FLOW_TYPES, seedRails, createRail } from '@/lib/rails';
export { distanceKm } from '@/lib/geo';
export { renderView, slug } from '@/lib/exporter';
export { DEFAULT_SETTINGS, DENSITY_MIN, DENSITY_MAX, SHAPES, STARTER_PRESETS } from '@/lib/designShapes';
