import React, { createContext, useContext, useEffect, useState } from 'react';

// 型定義
interface ThemeContextType {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ initialTheme?: 'light' | 'dark'; children: React.ReactNode }> = ({ initialTheme = 'light', children }) => {
  const [theme, setThemeState] = useState<'light' | 'dark'>(initialTheme);

  // <html>タグにクラスを付与
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // 外部からもsetThemeできるように
  const setTheme = (t: 'light' | 'dark') => {
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}; 