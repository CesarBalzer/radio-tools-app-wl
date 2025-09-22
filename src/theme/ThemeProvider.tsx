// src/theme/ThemeProvider.tsx
import React, {createContext, useContext, useMemo} from 'react';
import {DefaultTheme as NavLight, DarkTheme as NavDark, Theme as NavTheme} from '@react-navigation/native';
import {useRemoteConfig} from '../config/RemoteConfigProvider';

export type Theme = {
  colors: {
    primary: string;
    background: string;
    text: string;
    muted: string;
    border: string;
    card: string;
  };
  assets: {
    logoUrl?: string;
    bgImageUrl?: string;
  };
  statusBarStyle: 'light' | 'dark';
  navigationTheme: NavTheme;
};

const DEFAULTS = {
  primary: '#ACF44E',
  background: '#212121',
  text: '#FFFFFF',
  mutedDark: '#A0A0A0',
  mutedLight: '#4A4A4A',
  borderDark: 'rgba(255,255,255,0.12)',
  borderLight: 'rgba(0,0,0,0.12)',
  cardDark: '#111111',
  cardLight: '#FFFFFF',
} as const;

const ThemeContext = createContext<Theme>({
  colors: {
    primary: DEFAULTS.primary,
    background: DEFAULTS.background,
    text: DEFAULTS.text,
    muted: DEFAULTS.mutedDark,
    border: DEFAULTS.borderDark,
    card: DEFAULTS.cardDark,
  },
  assets: {},
  statusBarStyle: 'light',
  navigationTheme: NavDark,
});

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const cfg = useRemoteConfig();
  const b = cfg?.branding ?? {};

  const primary = b.primary ?? DEFAULTS.primary;
  const background = b.background ?? DEFAULTS.background;
  const text = b.text ?? DEFAULTS.text;
  const logoUrl = b.logoUrl;
  const bgImageUrl = b.bgImageUrl;

  // Cliente manda nesses dois (com defaults seguros)
  const statusBarStyle: 'light' | 'dark' = (b as any)?.statusBarStyle === 'dark' ? 'dark' : 'light';
  const navigationMode: 'dark' | 'light' = (b as any)?.navigationMode === 'light' ? 'light' : 'dark';

  const value = useMemo<Theme>(() => {
    const isDark = navigationMode === 'dark';

    const card = isDark ? DEFAULTS.cardDark : DEFAULTS.cardLight;
    const border = isDark ? DEFAULTS.borderDark : DEFAULTS.borderLight;
    const muted = isDark ? DEFAULTS.mutedDark : DEFAULTS.mutedLight;

    const navigationTheme: NavTheme = {
      ...(isDark ? NavDark : NavLight),
      colors: {
        ...(isDark ? NavDark.colors : NavLight.colors),
        primary,
        background,
        card,
        text,
        border,
        notification: primary,
      },
    };

    return {
      colors: { primary, background, text, muted, border, card },
      assets: { logoUrl, bgImageUrl },
      statusBarStyle,
      navigationTheme,
    };
  }, [primary, background, text, logoUrl, bgImageUrl, statusBarStyle, navigationMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
