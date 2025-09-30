# GROQ API Key Setup for Hubble Chatbot

This document explains how to configure the GROQ API key for the Hubble chatbot functionality.

## Method 1: Environment Variable (Recommended)

Set the `GROQ_API_KEY` environment variable in your deployment environment:

### For Vercel:
1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add a new variable:
   - Name: `GROQ_API_KEY`
   - Value: Your GROQ API key
   - Environment: Production (and Preview if needed)

### For Netlify:
1. Go to your Netlify site dashboard
2. Navigate to Site settings > Environment variables
3. Add a new variable:
   - Name: `GROQ_API_KEY`
   - Value: Your GROQ API key

### For other platforms:
Set the environment variable `GROQ_API_KEY` with your API key value.

## Method 2: Configuration File (Alternative)

If you cannot use environment variables, you can edit the `config.js` file:

1. Open `config.js`
2. Replace `undefined` with your GROQ API key:
   ```javascript
   GROQ_API_KEY: 'your-groq-api-key-here',
   ```

**⚠️ Security Warning**: Only use this method for development or if you're certain the config.js file won't be exposed publicly.

## Getting a GROQ API Key

1. Visit [console.groq.com](https://console.groq.com)
2. Sign up or log in to your account
3. Navigate to the "API Keys" section
4. Click "Create API Key"
5. Provide a descriptive name for your key
6. Copy the generated API key (you won't be able to see it again)

## Testing the Configuration

1. Open the browser's developer console (F12)
2. Look for these messages:
   - `GROQ API Key Status: Configured` (if API key is found)
   - `GROQ API Key Status: Not configured` (if API key is missing)
3. Try sending a message in the chatbot
4. If configured correctly, you should receive AI responses
5. If not configured, you'll see a message explaining the API key requirement

## Troubleshooting

### API Key Not Found
- Check that the environment variable is set correctly
- Verify the variable name is exactly `GROQ_API_KEY`
- Check the browser console for error messages

### API Key Invalid
- Verify the API key is correct and active
- Check that your GROQ account has sufficient credits
- Ensure the API key has the necessary permissions

### Still Having Issues?
- Check the browser console for detailed error messages
- Verify your deployment platform supports environment variables
- Contact support if the issue persists