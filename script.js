/**
 * Hydra - Water Reminder App Logic
 */

const app = {
    // State
    state: {
        currentIntake: 0,
        dailyGoal: 2500,
        streak: 0,
        lastLogDate: null,
        history: [] // Optional: for future expansion
    },

    // UI Elements
    elements: {
        currentIntake: document.getElementById('current-intake'),
        goalDisplay: document.getElementById('goal-display'),
        remaining: document.getElementById('remaining-intake'),
        streak: document.getElementById('streak-count'),
        percentageText: document.getElementById('percentage-text'),
        message: document.getElementById('motivational-message'),
        date: document.getElementById('current-date'),
        progressCircle: document.querySelector('.progress-ring__circle'),
        settingsModal: document.getElementById('settings-modal'),
        goalInput: document.getElementById('goal-input')
    },

    // Constants
    CONSTANTS: {
        CIRCLE_RADIUS: 110,
        CIRCLE_CIRCUMFERENCE: 2 * Math.PI * 110
    },

    // Initialization
    init() {
        this.setupCircle();
        this.loadData();
        this.checkDateReset();
        this.updateDate();
        this.updateUI();
        this.setupEventListeners();
    },

    setupCircle() {
        const { progressCircle } = this.elements;
        const { CIRCLE_CIRCUMFERENCE } = this.CONSTANTS;
        
        progressCircle.style.strokeDasharray = `${CIRCLE_CIRCUMFERENCE} ${CIRCLE_CIRCUMFERENCE}`;
        progressCircle.style.strokeDashoffset = CIRCLE_CIRCUMFERENCE;
    },

    loadData() {
        const savedData = localStorage.getItem('hydraData');
        if (savedData) {
            this.state = { ...this.state, ...JSON.parse(savedData) };
        }
    },

    saveData() {
        localStorage.setItem('hydraData', JSON.stringify(this.state));
    },

    updateDate() {
        const options = { weekday: 'long', month: 'short', day: 'numeric' };
        this.elements.date.textContent = new Date().toLocaleDateString('en-US', options);
    },

    checkDateReset() {
        const today = new Date().toDateString();
        
        if (this.state.lastLogDate !== today) {
            // It's a new day
            // Check streak: if last log was yesterday, keep streak, else reset
            if (this.state.lastLogDate) {
                const lastDate = new Date(this.state.lastLogDate);
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                
                // If last log wasn't yesterday (and wasn't today), streak breaks
                if (lastDate.toDateString() !== yesterday.toDateString()) {
                    // Only reset streak if they missed a day completely.
                    // For simplicity in this version, we might just keep it simple:
                    // logic: if missed a day, reset streak.
                    // Implementation: diff in days > 1 -> reset streak.
                } 
                
                // If they reached goal yesterday, increment streak? 
                // Usually streaks increment when you HIT the goal.
                // For now, let's just reset daily intake.
            }

            this.state.currentIntake = 0;
            this.state.lastLogDate = today;
            this.saveData();
        }
    },

    // Core Actions
    addWater(amount) {
        // Update state
        this.state.currentIntake += amount;
        
        // Update last log date to today if not set
        this.state.lastLogDate = new Date().toDateString();

        // Check if goal reached for the first time today to update streak logic (optional expansion)
        // For now, straightforward streak logic:
        if (this.state.currentIntake >= this.state.dailyGoal && (this.state.currentIntake - amount) < this.state.dailyGoal) {
             this.state.streak += 1;
             this.triggerConfetti(); // Optional polish
        }

        this.saveData();
        this.updateUI();
        this.animateMessage("Great job! 💧");
    },

    undoLast() {
        // Simple undo: remove 250ml or reset? settings. 
        // For this version, let's just allow removing small amounts if needed or reset.
        // Implementing a simple "undo last click" requires a history stack, 
        // let's do a simple subtraction for now if > 0.
        if (this.state.currentIntake > 0) {
            this.state.currentIntake = Math.max(0, this.state.currentIntake - 250);
            this.saveData();
            this.updateUI();
        }
    },

    resetDay() {
        if(confirm("Reset today's progress?")) {
            this.state.currentIntake = 0;
            this.saveData();
            this.updateUI();
        }
    },

    setGoal(amount) {
        this.state.dailyGoal = parseInt(amount);
        this.saveData();
        this.updateUI();
        // Update input value
        this.elements.goalInput.value = amount;
    },

    // UI Updates
    updateUI() {
        const { currentIntake, dailyGoal, streak } = this.state;
        const percentage = Math.min(100, Math.round((currentIntake / dailyGoal) * 100));
        
        // Update Text
        this.elements.currentIntake.textContent = currentIntake;
        this.elements.goalDisplay.textContent = dailyGoal;
        this.elements.remaining.textContent = Math.max(0, dailyGoal - currentIntake) + ' ml';
        this.elements.streak.textContent = `${streak} Days`;
        this.elements.percentageText.textContent = `${percentage}%`;

        // Update Circle
        this.setProgress(percentage);

        // Update Message
        this.updateMessage(percentage);
    },

    setProgress(percent) {
        const { CIRCLE_CIRCUMFERENCE } = this.CONSTANTS;
        const offset = CIRCLE_CIRCUMFERENCE - (percent / 100) * CIRCLE_CIRCUMFERENCE;
        this.elements.progressCircle.style.strokeDashoffset = offset;
    },

    updateMessage(percent) {
        let msg = "Stay hydrated!";
        if (percent >= 100) msg = "Goal reached! Amazing work! 🎉";
        else if (percent >= 75) msg = "Almost there! Keep it up!";
        else if (percent >= 50) msg = "Halfway through!";
        else if (percent >= 25) msg = "Off to a good start!";
        
        this.elements.message.textContent = msg;
    },

    animateMessage(text) {
        // Used for temporary feedback
        const original = this.elements.message.textContent;
        this.elements.message.textContent = text;
        this.elements.message.style.animation = 'none';
        this.elements.message.offsetHeight; /* trigger reflow */
        this.elements.message.style.animation = 'fadeIn 0.5s';
        
        setTimeout(() => {
            this.updateUI(); // Revert to status message
        }, 2000);
    },

    triggerConfetti() {
        // Placeholder for potential celebration animation
        console.log("Confetti!"); 
    },

    // Event Listeners
    setupEventListeners() {
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.elements.settingsModal.classList.remove('hidden');
        });

        document.getElementById('close-settings').addEventListener('click', () => {
            this.elements.settingsModal.classList.add('hidden');
        });

        document.getElementById('save-goal-btn').addEventListener('click', () => {
            const val = this.elements.goalInput.value;
            if (val && val > 0) {
                this.setGoal(val);
                this.elements.settingsModal.classList.add('hidden');
            }
        });

        document.getElementById('reset-btn').addEventListener('click', () => this.resetDay());
        document.getElementById('undo-btn').addEventListener('click', () => this.undoLast());
        
        // Close modal on outside click
        this.elements.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.elements.settingsModal) {
                 this.elements.settingsModal.classList.add('hidden');
            }
        });
    }
};

// Start App
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
