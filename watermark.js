import { rtdb } from './firebase.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

class Watermark {
    constructor() {
        this.watermarkElement = null;
        this.installationLink = null;
        this.init();
    }

    init() {
        this.createWatermarkElement();
        this.fetchInstallationLink();
    }

    createWatermarkElement() {
        // Create watermark container
        this.watermarkElement = document.createElement('div');
        this.watermarkElement.id = 'watermark';
        this.watermarkElement.style.cssText = `
            position: fixed;
            bottom: 0;
            right: 0;
            z-index: 9999;
            background: rgba(0, 0, 0, 0.6);
            color: white;
            padding: 4px 8px;
            border-radius: 4px 0 0 0;
            font-family: 'Poppins', sans-serif;
            font-size: 10px;
            font-weight: 400;
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-right: none;
            border-bottom: none;
            transition: all 0.3s ease;
            opacity: 0.7;
            max-width: 120px;
            word-wrap: break-word;
            pointer-events: none;
        `;


        // Add default text initially
        this.watermarkElement.textContent = 'Hubble 2025';
        
        // Append to body
        document.body.appendChild(this.watermarkElement);
    }

    fetchInstallationLink() {
        const installationRef = ref(rtdb, 'installation/link');
        
        onValue(installationRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                this.installationLink = data;
                this.updateWatermarkText();
            } else {
                // Fallback if no data in database
                this.installationLink = null;
                this.watermarkElement.textContent = 'Hubble 2025';
                this.watermarkElement.title = 'Hubble 2025';
            }
        }, (error) => {
            console.error('Error fetching installation link:', error);
            // Fallback on error
            this.installationLink = null;
            this.watermarkElement.textContent = 'Hubble 2025';
            this.watermarkElement.title = 'Hubble 2025';
        });
    }

    updateWatermarkText() {
        if (this.watermarkElement && this.installationLink) {
            // Extract domain from URL for display
            try {
                const url = new URL(this.installationLink);
                const displayText = url.hostname;
                this.watermarkElement.textContent = displayText;
            } catch (e) {
                // If URL parsing fails, show the full link
                this.watermarkElement.textContent = this.installationLink;
            }
        }
    }

    // Method to update the installation link programmatically
    updateInstallationLink(newLink) {
        this.installationLink = newLink;
        this.updateWatermarkText();
    }

    // Method to hide/show watermark
    setVisible(visible) {
        if (this.watermarkElement) {
            this.watermarkElement.style.display = visible ? 'block' : 'none';
        }
    }

    // Method to destroy watermark
    destroy() {
        if (this.watermarkElement && this.watermarkElement.parentNode) {
            this.watermarkElement.parentNode.removeChild(this.watermarkElement);
            this.watermarkElement = null;
        }
    }
}

// Auto-initialize watermark when DOM is ready
let watermarkInstance = null;

function initializeWatermark() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            watermarkInstance = new Watermark();
        });
    } else {
        watermarkInstance = new Watermark();
    }
}

// Initialize watermark
initializeWatermark();

// Export for manual control if needed
export { Watermark, watermarkInstance };
