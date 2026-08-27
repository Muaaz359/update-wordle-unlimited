/**
 * Wordle Unlimited - Universal Global Theme Controller
 * Synchronizes Dark/Light mode instantly across ALL pages via localStorage.
 * Updates Sun/Moon icons dynamically and broadcasts 'themechange' events.
 */

const THEME_KEY = 'wordle_unlimited_theme';

const MOON_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
const SUN_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';

function isDarkMode() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved !== null) {
    return saved === 'dark';
  }
  return false;
}

function updateThemeUI(isDark) {
  if (isDark) {
    document.documentElement.classList.add('dark-mode');
    if (document.body) document.body.classList.add('dark-mode');
  } else {
    document.documentElement.classList.remove('dark-mode');
    if (document.body) document.body.classList.remove('dark-mode');
  }

  // Update all theme toggle buttons on the page
  document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
    btn.innerHTML = isDark ? SUN_ICON : MOON_ICON;
    btn.setAttribute('title', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
    btn.setAttribute('aria-label', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
  });
}

// Immediate execution before DOM render to prevent white flash
(function() {
  const isDark = isDarkMode();
  if (isDark) {
    document.documentElement.classList.add('dark-mode');
  }
  document.addEventListener('DOMContentLoaded', () => {
    updateThemeUI(isDarkMode());
  });
})();

window.toggleGlobalTheme = function() {
  const currentDark = document.documentElement.classList.contains('dark-mode') || (document.body && document.body.classList.contains('dark-mode'));
  const newDark = !currentDark;

  localStorage.setItem(THEME_KEY, newDark ? 'dark' : 'light');
  updateThemeUI(newDark);

  // Dispatch global event for game.js or other components
  window.dispatchEvent(new CustomEvent('themechange', { detail: { isDark: newDark } }));

  if (typeof showToast === 'function') {
    showToast(`Theme: ${newDark ? 'Dark Mode' : 'Light Mode'}`, 1500);
  }
};
