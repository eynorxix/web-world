import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HOME = process.env.HOME || "";
const DATA_DIRS = [
  process.env.XDG_DATA_HOME || path.join(HOME, ".local", "share"),
  ...(process.env.XDG_DATA_DIRS || "/usr/local/share:/usr/share").split(":"),
].filter(Boolean);

const CHROMIUM_HINTS = ["brave", "chrome", "chromium", "edge", "vivaldi", "opera", "thorium"];

function which(command) {
  if (!command) {
    return null;
  }

  if (command.includes("/")) {
    return fs.existsSync(command) ? command : null;
  }

  for (const directory of (process.env.PATH || "").split(":")) {
    if (!directory) {
      continue;
    }

    const candidate = path.join(directory, command);

    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return candidate;
    } catch {
      continue;
    }
  }

  return null;
}

function readDesktopId() {
  if (process.env.PLAYWRIGHT_DEFAULT_BROWSER_ID) {
    return process.env.PLAYWRIGHT_DEFAULT_BROWSER_ID;
  }

  const attempts = [
    ["omarchy-cmd-default-browser", []],
    ["xdg-mime", ["query", "default", "x-scheme-handler/https"]],
    ["xdg-mime", ["query", "default", "text/html"]],
    ["xdg-settings", ["get", "default-web-browser"]],
  ];

  for (const [command, args] of attempts) {
    try {
      const output = execFileSync(command, args, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();

      if (output && output !== "omarchy-browser.desktop") {
        return output;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function readDesktopEntry(desktopId) {
  if (!desktopId) {
    return null;
  }

  for (const directory of DATA_DIRS) {
    const file = path.join(directory, "applications", desktopId);

    if (!fs.existsSync(file)) {
      continue;
    }

    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
    const execLine = lines.find((line) => line.startsWith("Exec="));
    const nameLine = lines.find((line) => line.startsWith("Name="));

    if (!execLine) {
      return null;
    }

    const match = execLine.slice(5).trim().match(/^"([^"]+)"|^(\S+)/);

    if (!match) {
      return null;
    }

    return {
      command: match[1] || match[2],
      displayName: nameLine ? nameLine.slice(5).trim() : path.basename(match[1] || match[2]),
    };
  }

  return null;
}

export function detectDefaultBrowser() {
  if (process.env.PLAYWRIGHT_BROWSER_PATH) {
    return {
      displayName: process.env.PLAYWRIGHT_BROWSER_NAME || path.basename(process.env.PLAYWRIGHT_BROWSER_PATH),
      desktopId: null,
      executablePath: process.env.PLAYWRIGHT_BROWSER_PATH,
      engine: "chromium",
    };
  }

  const desktopId = readDesktopId();
  const entry = readDesktopEntry(desktopId);
  const executablePath = which(entry?.command);
  const signature = `${desktopId || ""} ${entry?.command || ""} ${executablePath || ""}`.toLowerCase();

  if (!executablePath) {
    return null;
  }

  return {
    displayName: entry.displayName,
    desktopId,
    executablePath,
    engine: CHROMIUM_HINTS.some((hint) => signature.includes(hint)) ? "chromium" : null,
  };
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function defaultBrowserProject() {
  const browser = detectDefaultBrowser();

  if (browser?.engine === "chromium") {
    return {
      browser,
      project: {
        name: `predeterminado-${slugify(browser.displayName) || "brave"}`,
        use: {
          executablePath: browser.executablePath,
        },
      },
    };
  }

  return {
    browser: null,
    project: {
      name: "chromium",
      use: {},
    },
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const browser = detectDefaultBrowser();

  if (browser) {
    console.log(`${browser.displayName} (${browser.executablePath})`);
  } else {
    console.log("Chromium incluido por Playwright (respaldo)");
  }
}
