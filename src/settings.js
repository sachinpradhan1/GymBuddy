import {
  settingsBtn,
  settingsModal,
  closeSettingsBtn,
  targetRepsInput,
  calorieGoalInput,
  saveSettingsBtn
} from './elements.js';

import {
  getTargetReps,
  getCalorieGoal,
  setTargetReps,
  setCalorieGoal
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
  if (targetRepsInput) {
    targetRepsInput.value = getTargetReps();
  }
  if (calorieGoalInput) {
    calorieGoalInput.value = getCalorieGoal();
  }
}

// Save settings
export function saveSettings() {
  let updated = false;
  
  if (targetRepsInput) {
    const newTargetReps = parseInt(targetRepsInput.value);
    if (newTargetReps > 0 && newTargetReps !== getTargetReps()) {
      setTargetReps(newTargetReps);
      updated = true;
    }
  }
  
  if (calorieGoalInput) {
    const newCalorieGoal = parseFloat(calorieGoalInput.value);
    if (newCalorieGoal > 0 && newCalorieGoal !== getCalorieGoal()) {
      setCalorieGoal(newCalorieGoal);
      updated = true;
    }
  }
  
  if (updated) {
    // Save to localStorage
    const settings = {
      targetReps: getTargetReps(),
      calorieGoal: getCalorieGoal()
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
      if (settings.targetReps) setTargetReps(settings.targetReps);
      if (settings.calorieGoal) setCalorieGoal(settings.calorieGoal);
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