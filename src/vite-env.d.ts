/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string
  readonly VITE_ADSENSE_CLIENT_ID: string
  readonly VITE_ADSENSE_HOME_SLOT: string
  readonly VITE_ADSENSE_CATEGORY_SLOT: string
  readonly VITE_ADSENSE_WATCH_SLOT: string
  readonly VITE_ADMIN_USERNAME: string
  readonly VITE_ADMIN_PASSWORD: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
