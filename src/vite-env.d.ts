interface Window {
    aistudio?: {
        openSelectKey: () => Promise<void>;
        hasSelectedApiKey: () => Promise<boolean>;
    };
}

interface ImportMetaEnv {
    readonly VITE_API_KEY: string
    readonly VITE_BACKEND_URL: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
