import { defineConfig } from '@playwright/test';
export default defineConfig({
 testDir:'./e2e',fullyParallel:false,workers:1,reporter:'list',
 use:{baseURL:process.env.TEST_BASE_URL??'http://127.0.0.1:4173',headless:true,screenshot:'off',video:'off',trace:'off',launchOptions:{args:['--enable-unsafe-swiftshader']}},
 webServer:{command:`npm run preview -- --port 4173 --strictPort ${process.env.TEST_BASE_PATH?'--base='+process.env.TEST_BASE_PATH:''}`,url:process.env.TEST_BASE_URL??'http://127.0.0.1:4173',reuseExistingServer:false}
});
