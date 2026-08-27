import type { ThemePreference } from './types';

export const THEME_PREFERENCES: Array<{ id: ThemePreference; label: string; description: string }> = [
  { id: 'classic', label: 'Clássico', description: 'Visual atual do sistema' },
  { id: 'nautilus_dark', label: 'Nautilus Noturno', description: 'Azul-marinho, ciano e painéis operacionais' },
];

export const normalizeThemePreference = (value: unknown): ThemePreference =>
  value === 'nautilus_dark' ? 'nautilus_dark' : 'classic';

export const isThemePreference = (value: unknown): value is ThemePreference =>
  value === 'classic' || value === 'nautilus_dark';

export const applyThemePreference = (value: unknown) => {
  const theme = normalizeThemePreference(value);
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme === 'nautilus_dark' ? 'dark' : 'light';
  return theme;
};
