import { defineConfig, devices } from "@playwright/test";
import { defaultBrowserProject } from "./tools/default-browser.mjs";

const browserProject = defaultBrowserProject().project;

export default defineConfig({
  testDir: "./tests/ui",
  fullyParallel: false,
  timeout: 60_000,
  expect: {
    timeout: 7_000,
  },
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: {
      slowMo: Number(process.env.PLAYWRIGHT_SLOWMO || 0),
    },
  },
  webServer: {
    command: "python3 -m http.server 4173 --bind 127.0.0.1",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    timeout: 15_000,
  },
  projects: [
    {
      name: browserProject.name,
      use: {
        ...devices["Desktop Chrome"],
        ...browserProject.use,
      },
    },
  ],
});
