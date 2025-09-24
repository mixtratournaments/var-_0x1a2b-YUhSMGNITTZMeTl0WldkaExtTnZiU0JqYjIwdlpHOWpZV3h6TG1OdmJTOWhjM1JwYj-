import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyC8tI2w4IselKQnAICoAcPsVryK7tXYvq8",
  authDomain: "hubblealpha.firebaseapp.com",
  projectId: "hubblealpha",
  storageBucket: "hubblealpha.firebasestorage.app",
  messagingSenderId: "1019025958368",
  appId: "1:1019025958368:web:4b1a907be2b098c1b67785",
  measurementId: "G-TW9QCGPN5V"
};

const app = initializeApp(firebaseConfig);
const rtdb = getDatabase(app);

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
        this.watermarkElement = document.createElement('div');
        this.watermarkElement.id = 'watermark';
        this.watermarkElement.style.cssText = `
            position: fixed;
            bottom: 0;
            right: 0;
            z-index: 1;
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


        this.watermarkElement.textContent = 'Hubble 2025';
        
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
                this.installationLink = null;
                this.watermarkElement.textContent = 'Hubble 2025';
                this.watermarkElement.title = 'Hubble 2025';
            }
        }, (error) => {
            console.error('Error fetching installation link:', error);
            this.installationLink = null;
            this.watermarkElement.textContent = 'Hubble 2025';
            this.watermarkElement.title = 'Hubble 2025';
        });
    }

    updateWatermarkText() {
        if (this.watermarkElement && this.installationLink) {
            try {
                const url = new URL(this.installationLink);
                const displayText = url.hostname;
                this.watermarkElement.textContent = displayText;
            } catch (e) {
                this.watermarkElement.textContent = this.installationLink;
            }
        }
    }

    updateInstallationLink(newLink) {
        this.installationLink = newLink;
        this.updateWatermarkText();
    }

    setVisible(visible) {
        if (this.watermarkElement) {
            this.watermarkElement.style.display = visible ? 'block' : 'none';
        }
    }

    destroy() {
        if (this.watermarkElement && this.watermarkElement.parentNode) {
            this.watermarkElement.parentNode.removeChild(this.watermarkElement);
            this.watermarkElement = null;
        }
    }
}

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

initializeWatermark();

export { Watermark, watermarkInstance };
