/**
 * Color Picker Enhancement Module
 * Provides advanced color picking functionality with mobile support
 */
class ColorPickerManager {
    constructor() {
        this.textColorPicker = document.getElementById('textColor');
        this.textColorHex = document.getElementById('textColorHex');
        this.backgroundColorPicker = document.getElementById('backgroundColor');
        this.backgroundColorHex = document.getElementById('backgroundColorHex');
        this.previewArea = document.getElementById('richInput');
        
        this.init();
    }
    
    init() {
        // Text color controls
        this.textColorPicker.addEventListener('input', (e) => {
            this.updateTextColor(e.target.value);
        });
        
        this.textColorHex.addEventListener('input', (e) => {
            if (this.isValidHex(e.target.value)) {
                this.updateTextColor(e.target.value);
            }
        });
        
        this.textColorHex.addEventListener('blur', (e) => {
            if (!this.isValidHex(e.target.value)) {
                e.target.value = this.textColorPicker.value;
            }
        });
        
        // Background color controls
        this.backgroundColorPicker.addEventListener('input', (e) => {
            this.updateBackgroundColor(e.target.value);
        });
        
        this.backgroundColorHex.addEventListener('input', (e) => {
            if (this.isValidHex(e.target.value)) {
                this.updateBackgroundColor(e.target.value);
            }
        });
        
        this.backgroundColorHex.addEventListener('blur', (e) => {
            if (!this.isValidHex(e.target.value)) {
                e.target.value = this.backgroundColorPicker.value;
            }
        });
        
        // Load saved colors
        this.loadSavedColors();
    }
    
    updateTextColor(color) {
        this.textColorPicker.value = color;
        this.textColorHex.value = color;
        this.previewArea.style.color = color;
        
        this.saveColors();
    }
    
    updateBackgroundColor(color) {
        this.backgroundColorPicker.value = color;
        this.backgroundColorHex.value = color;
        document.getElementById('previewWrapper').style.backgroundColor = color;
        
        this.saveColors();
    }
    
    isValidHex(hex) {
        return /^#[0-9A-F]{6}$/i.test(hex);
    }
    
    saveColors() {
        const colors = {
            textColor: this.textColorPicker.value,
            backgroundColor: this.backgroundColorPicker.value
        };
        localStorage.setItem('alfiqiColors', JSON.stringify(colors));
    }
    
    loadSavedColors() {
        try {
            const saved = localStorage.getItem('alfiqiColors');
            if (saved) {
                const colors = JSON.parse(saved);
                if (colors.textColor) {
                    this.updateTextColor(colors.textColor);
                }
                if (colors.backgroundColor) {
                    this.updateBackgroundColor(colors.backgroundColor);
                }
            }
        } catch (error) {
            console.error('Error loading saved colors:', error);
        }
    }
    
    getTextColor() {
        return this.textColorPicker.value;
    }
    
    getBackgroundColor() {
        return this.backgroundColorPicker.value;
    }
    
    // Preset color palettes for quick selection
    showColorPalette(type) {
        const presets = [
            '#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff',
            '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
            '#800000', '#008000', '#000080', '#808000', '#800080', '#008080',
            '#ffa500', '#ffc0cb', '#a52a2a', '#dda0dd', '#98fb98', '#87ceeb'
        ];
        
        // This could be enhanced with a custom palette UI
        // For now, using the browser's native color picker
        return presets;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.colorPickerManager = new ColorPickerManager();
});
