// Spotify API Configuration
// This file will be populated with actual credentials during GitHub Actions deployment
window.SPOTIFY_CONFIG = {
    clientId: 'PLACEHOLDER_CLIENT_ID',
    clientSecret: 'PLACEHOLDER_CLIENT_SECRET',
    redirectUri: window.location.origin,
    scopes: [
        'streaming',
        'user-read-email',
        'user-read-private',
        'user-read-playback-state',
        'user-modify-playback-state'
    ]
};
