// 7Dragon API configuration
export const SEVEN_DRAGON_CONFIG = {
    API_URL: process.env.SEVEN_DRAGON_API_URL || 'https://7dragon-landing.onrender.com',
    API_KEY: process.env.SEVEN_DRAGON_API_KEY,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    REPO_OWNER: '7dragon',
    REPO_NAME: '7dragon-landing',
    BRANCH: 'main'
};

// API endpoints
export const ENDPOINTS = {
    UPDATE_CONTENT: '/api/content/update',
    UPDATE_PROMOTION: '/api/promotion/update',
    UPDATE_GAME: '/api/game/update',
    DEPLOY: '/api/deploy'
};

// Content types
export const CONTENT_TYPES = {
    MARKETING: 'marketing',
    PROMOTION: 'promotion',
    GAME: 'game'
};
