import { rtdb } from './firebase.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

class VersionChecker {
    constructor() {
        // Preset version in the code - change this when you want to force updates
        this.presetVersion = "0.0.20";
        this.currentVersion = null;
        this.init();
    }

    init() {
        this.checkVersion();
    }

    checkVersion() {
        console.log('Starting version check...');
        console.log('Preset version:', this.presetVersion);
        
        const versionRef = ref(rtdb, 'version');
        
        onValue(versionRef, (snapshot) => {
            const data = snapshot.val();
            console.log('Data from Firebase:', data);
            
            if (data) {
                this.currentVersion = data;
                console.log('Version from database:', this.currentVersion);
                this.compareVersions();
            } else {
                // If no version in database, assume it's the same as preset
                console.log('No version in database, using preset version');
                this.currentVersion = this.presetVersion;
                this.compareVersions();
            }
        }, (error) => {
            console.error('Error fetching version:', error);
            // On error, assume version matches to avoid breaking the site
            this.currentVersion = this.presetVersion;
            this.compareVersions();
        });
    }

    compareVersions() {
        console.log('Comparing versions...');
        console.log('Preset version:', this.presetVersion);
        console.log('Current version:', this.currentVersion);
        console.log('Are they equal?', this.currentVersion === this.presetVersion);
        
        if (this.currentVersion !== this.presetVersion) {
            console.log(`🚨 Version mismatch detected! Preset: ${this.presetVersion}, Current: ${this.currentVersion}`);
            this.handleVersionMismatch();
        } else {
            console.log(`✅ Version check passed: ${this.presetVersion}`);
        }
    }

    handleVersionMismatch() {
        // Clear the entire site
        this.clearSite();
        
        // Show popup
        this.showRestartPopup();
    }

    clearSite() {
        // Remove all content from body except the popup
        const body = document.body;
        const children = Array.from(body.children);
        
        children.forEach(child => {
            if (child.id !== 'version-mismatch-popup') {
                body.removeChild(child);
            }
        });

        // Clear the head content except essential meta tags
        const head = document.head;
        const headChildren = Array.from(head.children);
        
        headChildren.forEach(child => {
            if (!child.matches('meta[charset], meta[name="viewport"], title')) {
                head.removeChild(child);
            }
        });

        // Clear any stored data
        try {
            localStorage.clear();
            sessionStorage.clear();
        } catch (e) {
            console.warn('Could not clear storage:', e);
        }

        // Clear any intervals/timeouts
        for (let i = 1; i < 99999; i++) {
            window.clearTimeout(i);
            window.clearInterval(i);
        }

        // Clear any global variables and event listeners
        try {
            // Remove all event listeners
            const newBody = document.createElement('body');
            newBody.innerHTML = body.innerHTML;
            document.documentElement.replaceChild(newBody, body);
        } catch (e) {
            console.warn('Could not clear event listeners:', e);
        }
    }

    showRestartPopup() {
        // Create popup overlay
        const popupOverlay = document.createElement('div');
        popupOverlay.id = 'version-mismatch-popup';
        popupOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 99999;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: 'Poppins', sans-serif;
        `;

        // Create popup content
        const popupContent = document.createElement('div');
        popupContent.style.cssText = `
            background: white;
            padding: 40px;
            border-radius: 12px;
            text-align: center;
            max-width: 400px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            color: #333;
        `;

        // Create popup HTML
        popupContent.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 20px;">🔄</div>
            <h2 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">Please Restart Hubble</h2>
            <p style="margin: 0 0 30px 0; color: #666; line-height: 1.5;">
                A new version of Hubble is available. Please refresh your browser to get the latest updates.
            </p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; color: #666;">
                <strong>Current Version:</strong> ${this.currentVersion}<br>
                <strong>Required Version:</strong> ${this.presetVersion}
            </div>
            <button id="refresh-button" style="
                background: #009CFC;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-family: 'Poppins', sans-serif;
                font-size: 16px;
                cursor: pointer;
                transition: background 0.3s ease;
            " onmouseover="this.style.background='#0088d4'" onmouseout="this.style.background='#009CFC'">
                Refresh Browser
            </button>
        `;

        popupOverlay.appendChild(popupContent);
        document.body.appendChild(popupOverlay);

        // Add refresh button functionality
        const refreshButton = document.getElementById('refresh-button');
        refreshButton.addEventListener('click', () => {
            window.location.reload();
        });

        // Prevent any other interactions
        popupOverlay.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Prevent keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
    }

}

// Auto-initialize version checker when DOM is ready
let versionCheckerInstance = null;

function initializeVersionChecker() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            versionCheckerInstance = new VersionChecker();
        });
    } else {
        versionCheckerInstance = new VersionChecker();
    }
}

// Initialize version checker
initializeVersionChecker();

// Export for manual control if needed
export { VersionChecker };
