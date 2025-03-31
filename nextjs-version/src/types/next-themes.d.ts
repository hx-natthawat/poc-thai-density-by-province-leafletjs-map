declare module 'next-themes/dist/types' {
  export type Attribute = 'class' | 'data-theme' | 'data-mode';

  export interface ThemeProviderProps {
    children: React.ReactNode;
    attribute?: Attribute | Attribute[];
    defaultTheme?: string;
    enableSystem?: boolean;
    disableTransitionOnChange?: boolean;
    storageKey?: string;
    themes?: string[];
    forcedTheme?: string;
  }

  export interface UseThemeProps {
    themes?: string[];
    forcedTheme?: string;
    enableSystem?: boolean;
    disableTransitionOnChange?: boolean;
    defaultTheme?: string;
    attribute?: Attribute | Attribute[];
    storageKey?: string;
  }

  export interface ThemeProviderState {
    theme: string;
    resolvedTheme: string;
    setTheme: (theme: string) => void;
    themes: string[];
    systemTheme?: string;
  }
}
