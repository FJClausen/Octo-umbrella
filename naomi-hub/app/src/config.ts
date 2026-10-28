/** Baked in at build time from EAS environment variables (see .github/workflows/naomi-hub.yml). */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');
export const APP_SECRET = process.env.EXPO_PUBLIC_APP_SECRET ?? '';

export const apiConfigured = () => API_URL !== '' && APP_SECRET !== '';
