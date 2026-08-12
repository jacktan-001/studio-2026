import type { ThemeKey } from './projects'

export type EntranceStyle = 'rise' | 'blur' | 'split' | 'scale'
export type CursorStyle = 'ring' | 'dot' | 'orbit'
export type TextureStyle = 'grid' | 'noise' | 'waves' | 'paper'

export interface ThemeConfig {
  key: ThemeKey
  name: string
  /** primary accent (single point of color) */
  accent: string
  accentRgb: string
  /** secondary accent for gradients/hover depth */
  accent2: string
  accent2Rgb: string
  /** text color on this theme */
  neutral: string
  /** soft glow shadow string, uses accent */
  glow: string
  /** motion personality */
  entrance: EntranceStyle
  cursor: CursorStyle
  texture: TextureStyle
}

export const THEMES: Record<ThemeKey, ThemeConfig> = {
  violet: {
    key: 'violet',
    name: 'Violet',
    accent: '#7c3aed',
    accentRgb: '124, 58, 237',
    accent2: '#a78bfa',
    accent2Rgb: '167, 139, 250',
    neutral: '#f5f5f7',
    glow: '0 0 40px rgba(124, 58, 237, 0.35)',
    entrance: 'rise',
    cursor: 'ring',
    texture: 'grid',
  },
  pink: {
    key: 'pink',
    name: 'Pink',
    accent: '#ec4899',
    accentRgb: '236, 72, 153',
    accent2: '#f9a8d4',
    accent2Rgb: '249, 168, 212',
    neutral: '#fdf2f8',
    glow: '0 0 40px rgba(236, 72, 153, 0.32)',
    entrance: 'blur',
    cursor: 'dot',
    texture: 'noise',
  },
  cyan: {
    key: 'cyan',
    name: 'Cyan',
    accent: '#06b6d4',
    accentRgb: '6, 182, 212',
    accent2: '#67e8f9',
    accent2Rgb: '103, 232, 249',
    neutral: '#ecfeff',
    glow: '0 0 40px rgba(6, 182, 212, 0.32)',
    entrance: 'scale',
    cursor: 'orbit',
    texture: 'waves',
  },
  orange: {
    key: 'orange',
    name: 'Amber',
    accent: '#f97316',
    accentRgb: '249, 115, 22',
    accent2: '#fdba74',
    accent2Rgb: '253, 186, 116',
    neutral: '#fff7ed',
    glow: '0 0 40px rgba(249, 115, 22, 0.30)',
    entrance: 'split',
    cursor: 'ring',
    texture: 'grid',
  },
  purple: {
    key: 'purple',
    name: 'Purple',
    accent: '#8b5cf6',
    accentRgb: '139, 92, 246',
    accent2: '#c4b5fd',
    accent2Rgb: '196, 181, 253',
    neutral: '#f5f3ff',
    glow: '0 0 40px rgba(139, 92, 246, 0.32)',
    entrance: 'rise',
    cursor: 'dot',
    texture: 'paper',
  },
  emerald: {
    key: 'emerald',
    name: 'Emerald',
    accent: '#10b981',
    accentRgb: '16, 185, 129',
    accent2: '#34d399',
    accent2Rgb: '52, 211, 153',
    neutral: '#ecfdf5',
    glow: '0 0 40px rgba(16, 185, 129, 0.32)',
    entrance: 'rise',
    cursor: 'dot',
    texture: 'paper',
  },
}

export function getTheme(key: ThemeKey): ThemeConfig {
  return THEMES[key] ?? THEMES.violet
}
