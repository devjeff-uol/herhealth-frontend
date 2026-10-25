import { defineConfig } from '@playwright/test'
export default defineConfig({
 testDir:'./tests',fullyParallel:true,
 use:{baseURL:'http://127.0.0.1:5173',viewport:{width:390,height:844},launchOptions:{executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']}},
 webServer:[
  {command:'cd ../herhealth-ai && .venv/bin/python -m uvicorn api:app --host 127.0.0.1 --port 8000',url:'http://127.0.0.1:8000/api/health',env:{MPLCONFIGDIR:'/tmp/herhealth-matplotlib',XDG_CACHE_HOME:'/tmp/herhealth-cache'},reuseExistingServer:!process.env.CI},
  {command:'npm run dev -- --port 5173 --strictPort',url:'http://127.0.0.1:5173',reuseExistingServer:!process.env.CI}
 ]
})
