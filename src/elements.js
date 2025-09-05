// Video and canvas elements
export const video = document.getElementById("video");
export const canvas = document.getElementById("canvas");
export const ctx = canvas.getContext("2d");

// Stats elements
export const currentRepsElement = document.getElementById("current-reps");
export const currentCaloriesElement = document.getElementById("current-calories");
export const totalRepsElement = document.getElementById("total-reps");
export const totalCaloriesElement = document.getElementById("total-calories");
export const formScoreElement = document.getElementById("form-score");

// Progress elements
export const progressFillElement = document.getElementById("progress-fill");
export const progressTextElement = document.getElementById("progress-text");

// Feedback elements
export const feedbackTitleElement = document.getElementById("feedback-title");
export const feedbackMessageElement = document.getElementById("feedback-message");
export const feedbackIconElement = document.getElementById("feedback-icon");

// Control buttons
export const startButton = document.getElementById("start-btn");
export const stopButton = document.getElementById("stop-btn");
export const resetButton = document.getElementById("reset-reps-btn");

// Exercise selection
export const exerciseCards = document.querySelectorAll('.exercise-card');

// Modal elements
export const demoModal = document.getElementById("demo-modal");
export const demoVideo = document.getElementById("demo-video");
export const demoTitle = document.getElementById("demo-title");
export const closeDemoBtn = document.getElementById("close-demo");
export const startAfterDemoBtn = document.getElementById("start-after-demo");
export const skipDemoBtn = document.getElementById("skip-demo");

// Pose indicator
export const poseIndicator = document.getElementById("pose-indicator");

// Focus mode elements
export const focusModeBtn = document.getElementById("focus-mode-btn");
export const focusExitBtn = document.getElementById("focus-exit-btn");
export const focusModeOverlay = document.getElementById("focus-mode-overlay");
export const focusCurrentReps = document.getElementById("focus-current-reps");
export const focusCurrentCalories = document.getElementById("focus-current-calories");
export const focusFormScore = document.getElementById("focus-form-score");
export const focusProgressFill = document.getElementById("focus-progress-fill");
export const focusProgressText = document.getElementById("focus-progress-text");
export const focusFeedbackTitle = document.getElementById("focus-feedback-title");
export const focusFeedbackMessage = document.getElementById("focus-feedback-message");

// Theme and settings
export const themeToggleBtn = document.getElementById("theme-toggle-btn");
export const muteBtn = document.getElementById("mute-btn");
export const appElement = document.querySelector('.app');

// Settings elements (we'll add these to HTML)
export const settingsBtn = document.getElementById("settings-btn");
export const settingsModal = document.getElementById("settings-modal");
export const closeSettingsBtn = document.getElementById("close-settings");
export const repsPerSetInput = document.getElementById("reps-per-set-input");
export const numberOfSetsInput = document.getElementById("number-of-sets-input");
export const saveSettingsBtn = document.getElementById("save-settings");