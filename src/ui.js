export class UIManager {
    constructor() {
        this.slots = document.querySelectorAll('.slot');
        this.label = document.getElementById('item-label');
        this.itemNames = ['Grass Block', 'Dirt Layer', 'Cobblestone', 'Oak Planks'];
        this.activeIndex = 0;
        
        this.init();
    }

    init() {
        document.addEventListener('keydown', (e) => {
            if (/^[1-4]$/.test(e.key)) {
                this.activeIndex = parseInt(e.key) - 1;
                this.update();
            }
        });
    }

    update() {
        this.slots.forEach((slot, i) => {
            if (i === this.activeIndex) {
                slot.classList.add('active');
            } else {
                slot.classList.remove('active');
            }
        });
        this.label.textContent = this.itemNames[this.activeIndex];
    }
}
