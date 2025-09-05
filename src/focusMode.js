import { 
  appElement,
  focusModeOverlay,
  focusModeBtn,
  focusExitBtn
} from './elements.js';

import {
  getIsFocusMode,
  setIsFocusMode
} from './state.js';

import { updateStats } from './ui.js';

// Enter focus mode
export function enterFocusMode() {
  setIsFocusMode(true);
  document.body.classList.add('focus-mode');
  focusModeOverlay.classList.add('active');
  
  // Request fullscreen
  if (appElement && appElement.requestFullscreen) {
    appElement.requestFullscreen().catch(err => {
      console.log('Fullscreen request failed:', err);
    });
  }
  
  updateStats(); // Update focus mode stats
}

// Exit focus mode
export function exitFocusMode() {
  setIsFocusMode(false);
  document.body.classList.remove('focus-mode');
  focusModeOverlay.classList.remove('active');
  
  // Exit fullscreen
  if (document.exitFullscreen) {
    document.exitFullscreen().catch(err => {
      console.log('Exit fullscreen failed:', err);
    });
  }
}

// Initialize focus mode event listeners
export function initializeFocusMode() {
  if (focusModeBtn) {
    focusModeBtn.addEventListener('click', () => {
      if (getIsFocusMode()) {
        exitFocusMode();
      } else {
        enterFocusMode();
      }
    });
  }
  
  if (focusExitBtn) {
    focusExitBtn.addEventListener('click', exitFocusMode);
  }
  
  // Handle fullscreen change
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && getIsFocusMode()) {
      exitFocusMode();
    }
  });
}