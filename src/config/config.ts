
/**
 * 💡 CENTRAL CONFIGURATION
 * This is the SINGLE SOURCE OF TRUTH for the backend API URL.
 * 
 * 1. It first checks for .env VITE_API_URL.
 * 2. If .env is missing, it uses the MODE set below.
 */

export const CONFIG = {
    // Switch between 'LIVE' or 'LOCAL' if .env is not defined
    MODE: 'LIVE',

    URLS: {
        LOCAL: "http://localhost:5001/api",
        LIVE: "https://ev-clinic-production-9229.up.railway.app/api"
    }
};

/**
 * Automatically selects the URL based on the following priority:
 * 1. Environment variable (VITE_API_URL in .env)
 * 2. Hardcoded CONFIG.MODE ('LOCAL' or 'LIVE')
 */
const getBaseUrl = () => {
    // Check vite .env variables first
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) {
        // Ensure the URL ends with /api if it's missing
        return envUrl.endsWith('/api') || envUrl.endsWith('/api/') ? envUrl : `${envUrl.replace(/\/$/, '')}/api`;
    }

    // Fallback to hardcoded CONFIG
    return CONFIG.MODE === 'LIVE' ? CONFIG.URLS.LIVE : CONFIG.URLS.LOCAL;
};

export const API_URL = getBaseUrl();

console.log(`🚀 API Base URL: ${API_URL}`);
