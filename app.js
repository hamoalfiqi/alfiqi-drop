/**
 * Main Application Logic for Alfiqi Drop
 * Handles font loading, OpenType features, and UI interactions
 */
class AlfiqiDropApp {
    constructor() {
        this.fontObj = null;
        this.currentFontFamily = null;
        this.isLoading = false;
        
        this.initializeElements();
        this.bindEvents();
        this.loadSettings();
    }
    
    initializeElements() {
        this.fontUpload = document.getElementById('fontUpload');
        this.uploadProgress = document.getElementById('uploadProgress');
        this.richInput = document.getElementById('richInput');
        this.fontSize = document.getElementById('fontSize');
        this.fontSizeValue = document.getElementById('fontSizeValue');
        this.features = document.getElementById('features');
        this.axesSliders = document.getElementById('axesSliders');
        this.grid = document.getElementById('grid');
        
        // Buttons
        this.toggleGridBtn = document.getElementById('toggleGrid');
        this.applyFeatureBtn = document.getElementById('applyFeatureToSelection');
        this.copyCSS = document.getElementById('copyCSS');
    }
    
    bindEvents() {
        // Font upload with progress tracking
        this.fontUpload.addEventListener('change', (e) => this.handleFontUpload(e));
        
        // Font size control
        this.fontSize.addEventListener('input', (e) => this.updateFontSize(e.target.value));
        
        // Feature application
        this.applyFeatureBtn.addEventListener('click', () => this.applyFeatureToSelection());
        
        // Grid toggle
        this.toggleGridBtn.addEventListener('click', () => this.toggleGrid());
        
        // CSS copy
        this.copyCSS.addEventListener('click', () => this.copyCSSToClipboard());
        
        // Text input changes
        this.richInput.addEventListener('input', () => this.onTextChange());
    }
    
    async handleFontUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validate file size (max 3MB)
        if (file.size > 3 * 1024 * 1024) {
            this.showAlert('حجم الملف كبير جداً. الحد الأقصى هو 3 ميجابايت.', 'warning');
            return;
        }
        
        // Validate file type
        const validTypes = ['font/ttf', 'font/otf', 'font/woff2', 'application/font-sfnt', 'application/vnd.ms-opentype'];
        const validExtensions = ['.ttf', '.otf', '.woff2'];
        const isValidType = validTypes.includes(file.type) || 
                          validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
        
        if (!isValidType) {
            this.showAlert('نوع الملف غير مدعوم. استخدم TTF أو OTF أو WOFF2.', 'warning');
            return;
        }
        
        this.isLoading = true;
        this.showProgress(0);
        
        try {
            // Simulate progress for user feedback
            this.updateProgress(20);
            
            const buffer = await this.readFileAsArrayBuffer(file);
            this.updateProgress(40);
            
            // Parse font with OpenType.js
            this.fontObj = opentype.parse(buffer);
            this.updateProgress(60);
            
            // Create font face and load it
            const blob = new Blob([buffer], { type: file.type });
            const url = URL.createObjectURL(blob);
            
            this.currentFontFamily = 'AlfiqiFont_' + Date.now();
            const fontFace = new FontFace(this.currentFontFamily, `url(${url})`);
            
            await fontFace.load();
            this.updateProgress(80);
            
            document.fonts.add(fontFace);
            this.richInput.style.fontFamily = this.currentFontFamily;
            

            
            this.updateProgress(90);
            
            // Update UI elements
            this.updateAxes();
            this.updateFeatures();
            this.updateLivePreview();
            
            this.updateProgress(100);
            
            this.showAlert('تم تحميل الخط بنجاح!', 'success');
            
            // Clean up
            URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('Font loading error:', error);
            this.showAlert('خطأ في تحميل الخط. تأكد من صحة الملف.', 'danger');
        } finally {
            this.isLoading = false;
            setTimeout(() => this.hideProgress(), 1000);
        }
    }
    
    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
        });
    }
    
    showProgress(percent) {
        this.uploadProgress.style.display = 'block';
        this.updateProgress(percent);
    }
    
    updateProgress(percent) {
        const progressBar = this.uploadProgress.querySelector('.progress-bar');
        progressBar.style.width = percent + '%';
        progressBar.setAttribute('aria-valuenow', percent);
    }
    
    hideProgress() {
        this.uploadProgress.style.display = 'none';
    }
    
    updateFontSize(size) {
        this.fontSizeValue.textContent = size;
        this.richInput.style.fontSize = size + 'px';
        
        this.saveSettings();
    }
    
    updateAxes() {
        if (!this.fontObj || !this.fontObj.tables.fvar) {
            this.axesSliders.innerHTML = '<p class="text-muted small">لا توجد محاور متغيرة في هذا الخط</p>';
            return;
        }
        
        const axes = this.fontObj.tables.fvar.axes;
        this.axesSliders.innerHTML = '';
        
        axes.forEach(axis => {
            const sliderContainer = document.createElement('div');
            sliderContainer.className = 'axis-slider mb-3';
            
            const label = document.createElement('label');
            label.className = 'axis-label';
            label.innerHTML = `
                <i class="fas fa-sliders-h"></i>
                ${axis.tag}: <span id="axis-${axis.tag}-value">${axis.defaultValue}</span>
                (${axis.minValue}-${axis.maxValue})
            `;
            
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.className = 'form-range';
            slider.min = axis.minValue;
            slider.max = axis.maxValue;
            slider.value = axis.defaultValue;
            slider.step = (axis.maxValue - axis.minValue) / 100;
            slider.dataset.tag = axis.tag;
            
            slider.addEventListener('input', (e) => {
                document.getElementById(`axis-${axis.tag}-value`).textContent = e.target.value;
                this.updateLivePreview();
            });
            
            sliderContainer.appendChild(label);
            sliderContainer.appendChild(slider);
            this.axesSliders.appendChild(sliderContainer);
        });
    }
    
    updateFeatures() {
        this.features.innerHTML = '';
        
        if (!this.fontObj || !this.fontObj.tables.gsub) {
            const option = document.createElement('option');
            option.disabled = true;
            option.textContent = 'لا توجد خصائص OpenType';
            this.features.appendChild(option);
            return;
        }
        
        const gsub = this.fontObj.tables.gsub;
        if (gsub.features) {
            const tags = [...new Set(gsub.features.map(f => f.tag))];
            
            tags.forEach(tag => {
                const option = document.createElement('option');
                option.value = tag;
                option.textContent = `${tag} - ${this.getFeatureDescription(tag)}`;
                this.features.appendChild(option);
            });
        }
    }
    
    getFeatureDescription(tag) {
        const descriptions = {
            'liga': 'ربط الحروف',
            'kern': 'تباعد الحروف',
            'mark': 'علامات التشكيل',
            'mkmk': 'ربط العلامات',
            'calt': 'بدائل السياق',
            'salt': 'بدائل أسلوبية',
            'swsh': 'حروف زخرفية',
            'cswh': 'زخارف السياق',
            'locl': 'أشكال محلية',
            'init': 'الأشكال الابتدائية',
            'medi': 'الأشكال الوسطية',
            'fina': 'الأشكال النهائية',
            'isol': 'الأشكال المنفصلة'
        };
        return descriptions[tag] || tag;
    }
    
    getVariationSettings() {
        const sliders = this.axesSliders.querySelectorAll('input[data-tag]');
        const settings = Array.from(sliders).map(slider => 
            `"${slider.dataset.tag}" ${slider.value}`
        );
        return settings.join(', ');
    }
    
    updateLivePreview() {
        const variationSettings = this.getVariationSettings();
        if (variationSettings) {
            this.richInput.style.fontVariationSettings = variationSettings;
        }
        

        
        this.saveSettings();
    }
    
    applyFeatureToSelection() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            this.showAlert('حدد جزءاً من النص أولاً', 'warning');
            return;
        }
        
        const range = selection.getRangeAt(0);
        const selectedText = range.toString();
        
        if (!selectedText) {
            this.showAlert('حدد جزءاً من النص أولاً', 'warning');
            return;
        }
        
        const selectedFeatures = Array.from(this.features.selectedOptions).map(opt => opt.value);
        if (selectedFeatures.length === 0) {
            this.showAlert('اختر خاصية OpenType أولاً', 'warning');
            return;
        }
        
        const featureStyle = selectedFeatures.map(f => `"${f}" 1`).join(', ');
        const variationStyle = this.getVariationSettings();
        
        const span = document.createElement('span');
        span.style.fontFeatureSettings = featureStyle;
        if (variationStyle) {
            span.style.fontVariationSettings = variationStyle;
        }
        span.textContent = selectedText;
        
        range.deleteContents();
        range.insertNode(span);
        
        // Clear selection
        selection.removeAllRanges();
        
        this.showAlert('تم تطبيق الخاصية بنجاح!', 'success');
    }
    
    toggleGrid() {
        const isVisible = this.grid.style.display !== 'none';
        this.grid.style.display = isVisible ? 'none' : 'block';
        
        const icon = this.toggleGridBtn.querySelector('i');
        icon.className = isVisible ? 'fas fa-th' : 'fas fa-th-large';
    }
    
    copyCSSToClipboard() {
        const css = `
font-family: '${this.currentFontFamily || 'Arial'}';
font-size: ${this.fontSize.value}px;
color: ${window.colorPickerManager ? window.colorPickerManager.getTextColor() : '#000000'};
${this.getVariationSettings() ? `font-variation-settings: ${this.getVariationSettings()};` : ''}
        `.trim();
        
        navigator.clipboard.writeText(css).then(() => {
            this.showAlert('تم نسخ CSS بنجاح!', 'success');
        }).catch(() => {
            this.showAlert('فشل في نسخ CSS', 'danger');
        });
    }
    
    onTextChange() {
        // No special actions needed for text changes
    }
    
    showAlert(message, type = 'info') {
        // Create bootstrap alert
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
    
    saveSettings() {
        const settings = {
            fontSize: this.fontSize.value,
            variationSettings: this.getVariationSettings(),
            fontFamily: this.currentFontFamily
        };
        
        localStorage.setItem('alfiqiSettings', JSON.stringify(settings));
    }
    
    loadSettings() {
        try {
            const saved = localStorage.getItem('alfiqiSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                
                if (settings.fontSize) {
                    this.fontSize.value = settings.fontSize;
                    this.updateFontSize(settings.fontSize);
                }
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.alfiqiApp = new AlfiqiDropApp();
});

// Handle page visibility changes for performance
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause any intensive operations when page is hidden
        console.log('Page hidden - pausing operations');
    } else {
        // Resume operations when page is visible
        console.log('Page visible - resuming operations');
    }
});
