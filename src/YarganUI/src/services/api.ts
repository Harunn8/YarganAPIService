import axios from 'axios';

// Device API
export const deviceApi = axios.create({
    baseURL: import.meta.env.VITE_DEVICE_API_URL || 'http://localhost:7246/api',
    headers: { 'Content-Type': 'application/json' },
});

// Rule API 
export const ruleApi = axios.create({
    baseURL: import.meta.env.VITE_RULE_API_URL || 'http://localhost:5165/api',
    headers: { 'Content-Type': 'application/json' },
});

// Satops API
export const satopsApi = axios.create({
    baseURL: import.meta.env.VITE_SATOPS_API_URL || 'http://localhost:5131/api',
    headers: { 'Content-Type': 'application/json' },
});

// Helper for interceptors (optional, applies to all)
const attachInterceptors = (instance: any) => {
    instance.interceptors.response.use(
        (response: any) => response.data,
        (error: any) => {
            console.error(`API Error on ${instance.defaults.baseURL}`, error.response?.data || error.message);
            return Promise.reject(error);
        }
    );
};

attachInterceptors(deviceApi);
attachInterceptors(ruleApi);
attachInterceptors(satopsApi);
