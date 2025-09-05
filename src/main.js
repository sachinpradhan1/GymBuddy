// Main entry point for FitTracker AI
import { initializePose } from './camera.js';
import { initializeEventListeners } from './eventListeners.js';
import { initializeTheme, initializeMuteState, initializeStats } from './ui.js';
import { initializeSettings } from './settings.js';
import { resetSession } from './workoutFlow.js';
import { updateFeedback } from './ui.js';
import { speak } from './utils.js';

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log("🚀 Initializing Enhanced FitTracker AI...");
    
    // Initialize UI and settings
    initializeTheme();
    initializeMuteState();
    await initializeStats();
    initializeSettings();
    
    // Initialize MediaPipe Pose
    const pose = initializePose();
    window.poseInstance = pose; // Make available globally for camera
    
    // Initialize workout session
    resetSession();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Welcome message
    updateFeedback("Welcome to FitTracker AI", "Choose an exercise and start your journey!", "fas fa-rocket");
    speak("Welcome to FitTracker AI! Your enhanced personal trainer is ready to help you achieve your fitness goals! Choose an exercise and let's get started!");
    
    console.log("✅ Enhanced FitTracker AI loaded and ready!");
    
  } catch (error) {
    console.error("❌ Failed to initialize FitTracker AI:", error);
    updateFeedback("Initialization Error", "Please refresh the page to try again.", "fas fa-exclamation-triangle");
  }
});