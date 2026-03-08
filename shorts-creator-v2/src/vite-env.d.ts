/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_KEY: string
  readonly VITE_TYPECAST_API_KEY: string
  readonly VITE_TYPECAST_API_KEY_2: string
  readonly VITE_TYPECAST_API_KEY_3: string
  readonly VITE_TYPECAST_API_KEY_4: string
  readonly VITE_TYPECAST_API_KEY_5: string
  readonly VITE_TYPECAST_API_KEY_6: string
  readonly VITE_TYPECAST_API_KEY_7: string
  readonly VITE_FIREBASE_API_KEY?: string
  readonly VITE_FIREBASE_APP_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
