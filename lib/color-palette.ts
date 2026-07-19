import type { CSSProperties } from 'react';

export type ColorFinish =
  | 'standard'
  | 'metallic'
  | 'neon'
  | 'fluorescent'
  | 'reflective';

export const COLOR_FINISHES: ColorFinish[] = [
  'standard',
  'metallic',
  'neon',
  'fluorescent',
  'reflective',
];

export interface ColorPreset {
  name: string;
  hex: string;
  finish: ColorFinish;
}

// Quick-pick presets covering the common streetwear range plus the finish
// categories (metallic/neon/fluorescent/reflective) explicitly. This isn't
// meant to be exhaustive - admins can always type a custom name and pick any
// hex via the native color input, which covers the full RGB spectrum. This
// list just makes the common cases one click instead of a hex lookup.
export const COLOR_PRESETS: ColorPreset[] = [
  // Neutrals
  { name: 'Obsidian Black', hex: '#0B0B0C', finish: 'standard' },
  { name: 'Jet Black', hex: '#111111', finish: 'standard' },
  { name: 'Charcoal Grey', hex: '#36454F', finish: 'standard' },
  { name: 'Slate Grey', hex: '#708090', finish: 'standard' },
  { name: 'Ash Grey', hex: '#B2BEB5', finish: 'standard' },
  { name: 'Pure White', hex: '#FFFFFF', finish: 'standard' },
  { name: 'Ivory', hex: '#FFFFF0', finish: 'standard' },
  { name: 'Bone', hex: '#E3DAC9', finish: 'standard' },
  { name: 'Sand', hex: '#C2B280', finish: 'standard' },
  { name: 'Taupe', hex: '#8B8589', finish: 'standard' },

  // Blues
  { name: 'Azure Blue', hex: '#007FFF', finish: 'standard' },
  { name: 'Cobalt Blue', hex: '#0047AB', finish: 'standard' },
  { name: 'Navy Blue', hex: '#000080', finish: 'standard' },
  { name: 'Royal Blue', hex: '#4169E1', finish: 'standard' },
  { name: 'Sky Blue', hex: '#87CEEB', finish: 'standard' },
  { name: 'Powder Blue', hex: '#B0E0E6', finish: 'standard' },
  { name: 'Steel Blue', hex: '#4682B4', finish: 'standard' },
  { name: 'Teal', hex: '#008080', finish: 'standard' },

  // Greens
  { name: 'Forest Green', hex: '#228B22', finish: 'standard' },
  { name: 'Olive Green', hex: '#556B2F', finish: 'standard' },
  { name: 'Emerald Green', hex: '#50C878', finish: 'standard' },
  { name: 'Sage Green', hex: '#9CAF88', finish: 'standard' },
  { name: 'Hunter Green', hex: '#355E3B', finish: 'standard' },

  // Reds
  { name: 'Crimson Red', hex: '#DC143C', finish: 'standard' },
  { name: 'Burgundy', hex: '#800020', finish: 'standard' },
  { name: 'Brick Red', hex: '#B22222', finish: 'standard' },
  { name: 'Maroon', hex: '#800000', finish: 'standard' },
  { name: 'Wine Red', hex: '#722F37', finish: 'standard' },

  // Oranges / Yellows / Browns
  { name: 'Burnt Orange', hex: '#CC5500', finish: 'standard' },
  { name: 'Rust', hex: '#B7410E', finish: 'standard' },
  { name: 'Mustard Yellow', hex: '#FFDB58', finish: 'standard' },
  { name: 'Camel', hex: '#C19A6B', finish: 'standard' },
  { name: 'Chocolate Brown', hex: '#7B3F00', finish: 'standard' },
  { name: 'Espresso', hex: '#4B3621', finish: 'standard' },

  // Purples / Pinks
  { name: 'Lavender', hex: '#B57EDC', finish: 'standard' },
  { name: 'Plum', hex: '#8E4585', finish: 'standard' },
  { name: 'Magenta', hex: '#FF00FF', finish: 'standard' },
  { name: 'Blush Pink', hex: '#FFB6C1', finish: 'standard' },
  { name: 'Hot Pink', hex: '#FF69B4', finish: 'standard' },

  // Metallics
  { name: 'Gold', hex: '#D4AF37', finish: 'metallic' },
  { name: 'Rose Gold', hex: '#B76E79', finish: 'metallic' },
  { name: 'Silver', hex: '#C0C0C0', finish: 'metallic' },
  { name: 'Gunmetal', hex: '#2A3439', finish: 'metallic' },
  { name: 'Bronze', hex: '#CD7F32', finish: 'metallic' },
  { name: 'Copper', hex: '#B87333', finish: 'metallic' },
  { name: 'Chrome', hex: '#DBE2E9', finish: 'metallic' },

  // Neons
  { name: 'Neon Green', hex: '#39FF14', finish: 'neon' },
  { name: 'Neon Pink', hex: '#FF6EC7', finish: 'neon' },
  { name: 'Neon Blue', hex: '#1F51FF', finish: 'neon' },
  { name: 'Neon Orange', hex: '#FF5F1F', finish: 'neon' },
  { name: 'Neon Yellow', hex: '#DFFF00', finish: 'neon' },
  { name: 'Neon Purple', hex: '#BC13FE', finish: 'neon' },

  // Fluorescents
  { name: 'Fluorescent Lime', hex: '#CCFF00', finish: 'fluorescent' },
  { name: 'Fluorescent Orange', hex: '#FFA500', finish: 'fluorescent' },
  { name: 'Fluorescent Pink', hex: '#FF1493', finish: 'fluorescent' },
  { name: 'Fluorescent Yellow', hex: '#FFFF33', finish: 'fluorescent' },

  // Reflective
  { name: 'Reflective Silver', hex: '#D9D9D9', finish: 'reflective' },
  { name: 'Reflective Grey', hex: '#A9A9A9', finish: 'reflective' },
  { name: 'Reflective Black', hex: '#1C1C1C', finish: 'reflective' },
];

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function isValidHex(value: string | undefined | null): value is string {
  return !!value && HEX_RE.test(value);
}

// Best-effort fallback for old data that only has a free-text `color` name
// and no color_hex (predates this field). Matches the CSS behavior that was
// already implicitly relied on, so existing correctly-named variants (e.g.
// "Blue", "Red") keep rendering the way they always did.
export function guessHexFromName(name: string | undefined | null): string {
  if (!name) return '#CCCCCC';
  const preset = COLOR_PRESETS.find(
    (p) => p.name.toLowerCase() === name.trim().toLowerCase(),
  );
  if (preset) return preset.hex;
  return name; // may or may not be a valid CSS color keyword - caller should validate
}

// Swatch style for a given hex + finish. Metallic/reflective get a diagonal
// sheen gradient, neon/fluorescent get a soft glow - approximations of the
// real material since a flat swatch can't show shimmer or backlighting, but
// enough to visually distinguish the finish at a glance.
export function finishSwatchStyle(
  hex: string,
  finish: ColorFinish | undefined | null,
): CSSProperties {
  const safeHex = isValidHex(hex) ? hex : '#CCCCCC';
  switch (finish) {
    case 'metallic':
      return {
        backgroundImage: `linear-gradient(135deg, ${safeHex} 0%, #ffffffaa 50%, ${safeHex} 100%)`,
      };
    case 'reflective':
      return {
        backgroundImage: `linear-gradient(135deg, ${safeHex} 0%, #ffffff 45%, ${safeHex} 100%)`,
        border: '1px solid #ffffff80',
      };
    case 'neon':
    case 'fluorescent':
      return {
        backgroundColor: safeHex,
        boxShadow: `0 0 6px 1px ${safeHex}`,
      };
    default:
      return { backgroundColor: safeHex };
  }
}
