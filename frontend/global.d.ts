/**
 * Global type definitions for Time Traveller
 */

// Window extensions for AI Studio API
interface Window {
  aistudio?: {
    hasSelectedApiKey(): Promise<boolean>;
    openSelectKey(): Promise<boolean>;
  };
}

// Vite environment variables
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_WS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

