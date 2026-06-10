export class UIManager {
    constructor() {
        this.slots = document.querySelectorAll('.slot');
        this.label = document.getElementById('item-label');
        this.itemNames = ['Dirt', 'Stone', 'Grass Blocks', 'Wood Plank', '', '', '', '', ''];
        this.activeSlotIndex = 0;
        
        this.initListeners();
        this.updateUI();
    }

    initListeners() {
        document.addEventListener('keydown', (e) => {
            // Check if key pressed is between 1 and 9
            if (/^[1-9]$/.test(e.key)) {
                this.activeSlotIndex = parseInt(e.key) - 1;
                this.updateUI();
            }
        });
    }

    updateUI() {
        this.slots.forEach((slot, idx) => {
            if (idx === this.activeSlotIndex) {
                slot.classList.add('active');
            } else {
                slot.classList.remove('active');
            }
        });

        // Display selection text label cleanly
        const name = this.itemNames[this.activeSlotIndex];
        this.label.textContent = name ? name : "";
        this.label.style.opacity = name ? "1" : "0";
    }
}
