import {
  settingsBtn,
  settingsModal,
  closeSettingsBtn,
  repsPerSetInput,
  numberOfSetsInput,
  saveSettingsBtn
} from './elements.js';

import {
  getRepsPerSet,
  getNumberOfSets,
  setRepsPerSet,
  setNumberOfSets
} from './state.js';

import { updateStats, saveStats } from './ui.js';
import { speak } from './utils.js';

// Show settings modal
export function showSettingsModal() {
  if (settingsModal) {
    settingsModal.classList.add('active');
    loadCurrentSettings();
  }
}

// Hide settings modal
export function hideSettingsModal() {
  if (settingsModal) {
    settingsModal.classList.remove('active');
  }
}

// Load current settings into form
function loadCurrentSettings() {
  if (repsPerSetInput) {
    repsPerSetInput.value = getRepsPerSet();
  }
  if (numberOfSetsInput) {
    numberOfSetsInput.value = getNumberOfSets();
  }
}

// Save settings
export function saveSettings() {
  let updated = false;
  
  if (repsPerSetInput) {
    const newRepsPerSet = parseInt(repsPerSetInput.value);
    if (newRepsPerSet > 0 && newRepsPerSet !== getRepsPerSet()) {
      setRepsPerSet(newRepsPerSet);
      updated = true;
    }
  }
  
  if (numberOfSetsInput) {
    const newNumberOfSets = parseInt(numberOfSetsInput.value);
    if (newNumberOfSets > 0 && newNumberOfSets !== getNumberOfSets()) {
      setNumberOfSets(newNumberOfSets);
      updated = true;
    }
  }
  
  if (updated) {
    // Save to localStorage
    const settings = {
      repsPerSet: getRepsPerSet(),
      numberOfSets: getNumberOfSets()
    };
    localStorage.setItem('fittracker-settings', JSON.stringify(settings));
    
    updateStats();
    saveStats();
    speak("Settings updated successfully!");
  }
  
  hideSettingsModal();
}

// Initialize settings from localStorage
export function initializeSettings() {
  const savedSettings = localStorage.getItem('fittracker-settings');
  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings);
      if (settings.repsPerSet) setRepsPerSet(settings.repsPerSet);
      if (settings.numberOfSets) setNumberOfSets(settings.numberOfSets);
    } catch (error) {
      console.warn('Failed to parse saved settings:', error);
    }
  }
}

// Initialize settings event listeners
export function initializeSettingsListeners() {
  if (settingsBtn) {
    settingsBtn.addEventListener('click', showSettingsModal);
  }
  
  if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener('click', hideSettingsModal);
  }
  
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', saveSettings);
  }
  
  // Close modal when clicking outside
  if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) {
        hideSettingsModal();
      }
    });
  }
}