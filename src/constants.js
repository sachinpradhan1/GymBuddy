// Demo videos for each exercise
export const demoVideos = {
  curl: "https://www.youtube.com/embed/ykJmrZ5v0Oo",
  squat: "https://www.youtube.com/embed/aclHkVaku9U",
  pushup: "https://www.youtube.com/embed/IODxDxX7oi4",
  shoulderpress: "https://www.youtube.com/embed/qEwKCR5JCog"
};

// Exercise data with calories and form thresholds
export const exerciseData = {
  curl: { 
    name: "bicep curls", 
    calories: 0.5,
    formThresholds: {
      minAngle: 30,
      maxAngle: 160,
      optimalMinAngle: 40,
      optimalMaxAngle: 150,
      speedThreshold: 2000 // ms between reps for optimal speed
    }
  },
  squat: { 
    name: "squats", 
    calories: 0.8,
    formThresholds: {
      minAngle: 90,
      maxAngle: 170,
      optimalMinAngle: 100,
      optimalMaxAngle: 160,
      speedThreshold: 3000
    }
  },
  pushup: { 
    name: "push up", 
    calories: 0.7,
    formThresholds: {
      minAngle: 90,
      maxAngle: 160,
      optimalMinAngle: 100,
      optimalMaxAngle: 150,
      speedThreshold: 2500
    }
  },
  shoulderpress: { 
    name: "shoulder press", 
    calories: 0.6,
    formThresholds: {
      minAngle: 80,
      maxAngle: 160,
      optimalMinAngle: 90,
      optimalMaxAngle: 150,
      speedThreshold: 2500
    }
  }
};

// Smoothing configuration
export const HISTORY_SIZE = 5;

// Default settings
export const DEFAULT_TARGET_REPS = 20;
export const DEFAULT_CALORIE_GOAL = 50;

// Form feedback messages
export const formFeedback = {
  excellent: ["Perfect form!", "Excellent technique!", "Outstanding!", "Flawless execution!"],
  good: ["Good form!", "Nice work!", "Keep it up!", "Well done!"],
  needsWork: ["Focus on form", "Slow down", "Full range of motion", "Control the movement"],
  tooFast: ["Slow down!", "Control the speed", "Quality over speed"],
  tooSlow: ["Pick up the pace", "Maintain momentum", "Keep moving"],
  rangeOfMotion: ["Go deeper!", "Full extension", "Complete the movement", "Wider range"]
};