import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
logLevel: 'error',
server: {
host: true,
allowedHosts: [
".modal.host"
]
},
plugins: [
base44({
legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
hmrNotifier: true,
navigationNotifier: true,
visualEditAgent: true
}),
react(),
]
});
