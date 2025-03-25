import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private storageKey = 'app-theme';
  private themeSubject = new BehaviorSubject<Theme>(this.getInitialTheme());

  theme$ = this.themeSubject.asObservable();

  constructor() {
    this.initTheme();
    this.watchSystemThemeChanges();
  }

  setTheme(theme: Theme): void {
    localStorage.setItem(this.storageKey, theme);
    this.themeSubject.next(theme);
    this.applyTheme(theme);
  }

  private getInitialTheme(): Theme {
    const savedTheme = localStorage.getItem(this.storageKey) as Theme;
    return savedTheme || 'system';
  }

  private initTheme(): void {
    this.applyTheme(this.themeSubject.value);
  }

  private applyTheme(theme: Theme): void {
    // Remove existing theme classes
    document.body.classList.remove('light-theme', 'dark-theme');

    // Apply the appropriate theme
    if (theme === 'system') {
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      document.body.classList.add(prefersDark ? 'dark-theme' : 'light-theme');
    } else {
      document.body.classList.add(`${theme}-theme`);
    }
  }

  private watchSystemThemeChanges(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Initial check
    if (this.themeSubject.value === 'system') {
      this.applyTheme('system');
    }

    // Watch for changes
    mediaQuery.addEventListener('change', () => {
      if (this.themeSubject.value === 'system') {
        this.applyTheme('system');
      }
    });
  }
}
