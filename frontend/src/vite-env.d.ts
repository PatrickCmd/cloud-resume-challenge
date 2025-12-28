/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_USE_MOCK_API: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_ENABLE_VISITOR_TRACKING: string;
  readonly VITE_DEBUG_API_CALLS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
