// upload.js - Custom server image upload functionality

// Server configuration
const SERVER_CONFIG = {
    baseUrl: 'https://mixtratournaments.github.io/var-_0x1a2b-YUhSMGNITTZMeTl0WldkaExtTnZiU0JqYjIwdlpHOWpZV3h6TG1OdmJTOWhjM1JwYj-', // Your domain
    uploadEndpoint: '/upload_handler.php', // Keep this as is
    maxFileSize: 5 * 1024 * 1024, // 5MB max file size
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    imageQuality: 0.8, // JPEG quality for compression
    maxWidth: 1920, // Max image width
    maxHeight: 1080 // Max image height
};

// Image upload utility functions
class ImageUploader {
    constructor() {
        this.uploadQueue = [];
        this.isUploading = false;
    }

    // Compress and resize image before upload
    async compressImage(file) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Calculate new dimensions while maintaining aspect ratio
                let { width, height } = img;
                
                if (width > SERVER_CONFIG.maxWidth) {
                    height = (height * SERVER_CONFIG.maxWidth) / width;
                    width = SERVER_CONFIG.maxWidth;
                }
                
                if (height > SERVER_CONFIG.maxHeight) {
                    width = (width * SERVER_CONFIG.maxHeight) / height;
                    height = SERVER_CONFIG.maxHeight;
                }
                
                // Set canvas dimensions
                canvas.width = width;
                canvas.height = height;
                
                // Draw and compress image
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to blob with compression
                canvas.toBlob((blob) => {
                    resolve(new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    }));
                }, 'image/jpeg', SERVER_CONFIG.imageQuality);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    // Validate file before upload
    validateFile(file) {
        // Check file size
        if (file.size > SERVER_CONFIG.maxFileSize) {
            throw new Error(`File size must be less than ${SERVER_CONFIG.maxFileSize / (1024 * 1024)}MB`);
        }
        
        // Check file type
        if (!SERVER_CONFIG.allowedTypes.includes(file.type)) {
            throw new Error('Only JPEG, PNG, GIF, and WebP images are allowed');
        }
        
        return true;
    }

    // Upload image to server
    async uploadImage(file, type = 'post') {
        try {
            // Validate file
            this.validateFile(file);
            
            // Compress image
            const compressedFile = await this.compressImage(file);
            
            // Create form data
            const formData = new FormData();
            formData.append('image', compressedFile);
            formData.append('type', type); // 'profile' or 'post'
            formData.append('timestamp', Date.now().toString());
            
            // Get current user ID for file naming
            const { getAuth } = await import('https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js');
            const { app } = await import('./firebase.js');
            const auth = getAuth(app);
            const user = auth.currentUser;
            
            if (user) {
                formData.append('userId', user.uid);
            }
            
            // Upload to server
            const response = await fetch(`${SERVER_CONFIG.baseUrl}${SERVER_CONFIG.uploadEndpoint}`, {
                method: 'POST',
                body: formData,
                headers: {
                    // Don't set Content-Type header - let browser set it with boundary
                }
            });
            
            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Upload failed');
            }
            
            return {
                success: true,
                url: result.url,
                filename: result.filename,
                size: compressedFile.size
            };
            
        } catch (error) {
            console.error('Image upload error:', error);
            throw error;
        }
    }

    // Upload profile picture
    async uploadProfilePicture(file) {
        return await this.uploadImage(file, 'profile');
    }

    // Upload post image
    async uploadPostImage(file) {
        return await this.uploadImage(file, 'post');
    }

    // Delete image from server
    async deleteImage(filename) {
        try {
            const response = await fetch(`${SERVER_CONFIG.baseUrl}${SERVER_CONFIG.uploadEndpoint}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ filename })
            });
            
            if (!response.ok) {
                throw new Error(`Delete failed: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            return result.success;
            
        } catch (error) {
            console.error('Image delete error:', error);
            throw error;
        }
    }

    // Get image preview URL
    getImagePreviewUrl(file) {
        return URL.createObjectURL(file);
    }

    // Revoke object URL to free memory
    revokeImagePreview(url) {
        if (url && url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
        }
    }
}

// Create global instance
const imageUploader = new ImageUploader();

// Export functions for use in main.html
window.imageUploader = imageUploader;
window.uploadProfilePicture = imageUploader.uploadProfilePicture.bind(imageUploader);
window.uploadPostImage = imageUploader.uploadPostImage.bind(imageUploader);
window.deleteImage = imageUploader.deleteImage.bind(imageUploader);
window.getImagePreviewUrl = imageUploader.getImagePreviewUrl.bind(imageUploader);
window.revokeImagePreview = imageUploader.revokeImagePreview.bind(imageUploader);

export { imageUploader, SERVER_CONFIG }; 
