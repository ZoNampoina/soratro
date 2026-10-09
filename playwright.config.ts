import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'tests/e2e',workers:1,fullyParallel:false,timeout:60000,maxFailures:1,
  expect:{timeout:12000},reporter:[['list'],['html',{open:'never'}]],
  use:{baseURL:'http://127.0.0.1:4176/soratro/',viewport:{width:1360,height:960},trace:'retain-on-failure',screenshot:'only-on-failure',launchOptions:{executablePath:process.env.SORATRO_CHROMIUM_PATH||undefined,args:['--autoplay-policy=no-user-gesture-required','--no-sandbox']}},
  webServer:[
    {command:'npm run dev -- --host 127.0.0.1 --port 4175',url:'http://127.0.0.1:4175/tests/browser.html',reuseExistingServer:!process.env.CI,timeout:60000},
    {command:'npm run preview -- --host 127.0.0.1 --port 4176 --base=/soratro/',url:'http://127.0.0.1:4176/soratro/',reuseExistingServer:!process.env.CI,timeout:60000}
  ]
});
