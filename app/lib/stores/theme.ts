import { atom } from 'nanostores';
import { logStore } from './logs';

export type Theme = 'dark' | 'light';

export const kTheme = 'bolt_theme';

/**
 * Always return light theme
 */
function initStore(): Theme {
  // Force light theme always
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", "light");
    localStorage.setItem(kTheme, "light");
  }
  return "light";
}

export const themeStore = atom<Theme>(initStore());

export function themeIsDark() {
  return false; // Always false because theme is always light
}

/**
 * toggleTheme no longer toggles — it forces light theme
 */
export function toggleTheme() {
  const newTheme: Theme = "light";

  // update store
  themeStore.set(newTheme);

  // save for consistency
  localStorage.setItem(kTheme, newTheme);

  // update HTML <html data-theme="light">
  document.documentElement.setAttribute("data-theme", newTheme);

  // update user profile if stored
  try {
    const userProfile = localStorage.getItem('bolt_user_profile');
    if (userProfile) {
      const profile = JSON.parse(userProfile);
      profile.theme = newTheme;
      localStorage.setItem('bolt_user_profile', JSON.stringify(profile));
    }
  } catch (error) {
    console.error('Error updating user profile theme:', error);
  }

  logStore.logSystem(`Theme forced to ${newTheme} mode`);
}
