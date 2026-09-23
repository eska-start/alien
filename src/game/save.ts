import type { Route } from "./cases";

export type GamePhase = "arrival" | "investigation";

export type GameSave = {
  version: 1;
  started: boolean;
  currentCase: number;
  phase: GamePhase;
  discovered: Record<string, string[]>;
  deductions: number[];
  completed: number[];
  routeAttempts: Record<string, number>;
  outcomes: Record<string, Route>;
  memories: string[];
  endingStep: number;
  endingSeen: boolean;
  savedAt: string;
};

export type GameSettings = {
  sound: boolean;
  reduceMotion: boolean;
};

const GAME_KEY = "dead-letter-office-save-v1";
const SETTINGS_KEY = "dead-letter-office-settings-v1";

export function freshSave(): GameSave {
  return {
    version: 1,
    started: false,
    currentCase: 1,
    phase: "arrival",
    discovered: {},
    deductions: [],
    completed: [],
    routeAttempts: {},
    outcomes: {},
    memories: [],
    endingStep: 0,
    endingSeen: false,
    savedAt: new Date().toISOString(),
  };
}

export function loadGame(): GameSave {
  try {
    const raw = localStorage.getItem(GAME_KEY);
    if (!raw) return freshSave();
    const parsed = JSON.parse(raw) as Partial<GameSave>;
    if (parsed.version !== 1 || typeof parsed.currentCase !== "number") return freshSave();
    return {
      ...freshSave(),
      ...parsed,
      discovered: parsed.discovered ?? {},
      deductions: parsed.deductions ?? [],
      completed: parsed.completed ?? [],
      routeAttempts: parsed.routeAttempts ?? {},
      outcomes: parsed.outcomes ?? {},
      memories: parsed.memories ?? [],
    };
  } catch {
    return freshSave();
  }
}

export function storeGame(save: GameSave) {
  try {
    localStorage.setItem(GAME_KEY, JSON.stringify({ ...save, savedAt: new Date().toISOString() }));
  } catch {
    // Private browsing or a full storage quota should not interrupt the shift.
  }
}

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { sound: true, reduceMotion: false, ...JSON.parse(raw) };
  } catch {
    // Use the quiet defaults if saved settings cannot be read.
  }
  return { sound: true, reduceMotion: false };
}

export function storeSettings(settings: GameSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Game settings are optional and never block play.
  }
}