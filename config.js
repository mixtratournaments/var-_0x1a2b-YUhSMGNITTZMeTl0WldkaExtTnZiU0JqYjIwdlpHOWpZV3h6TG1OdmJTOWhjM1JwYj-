// Configuration file for Hubble Gaming Platform
// This file can be used to set configuration values including API keys
// Note: For production, use environment variables instead of hardcoding values here

window.config = {
    // GROQ API Key for chatbot functionality
    // Set this to your GROQ API key or leave undefined to use environment variables
    GROQ_API_KEY: undefined, // Replace with your API key or leave undefined to use process.env.GROQ_API_KEY
    
    // Other configuration options can be added here
    debug: false,
    version: '1.0.0'
};

// Log configuration status
console.log('Hubble Configuration loaded:', {
    hasGroqApiKey: !!window.config.GROQ_API_KEY,
    debug: window.config.debug,
    version: window.config.version
});