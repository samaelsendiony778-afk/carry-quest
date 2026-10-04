import type { Lang } from "@/game/copy";

const KEY = "carry-quest-v1";

export type Save = {
  version: 1;
  lang: Lang;
  practiceStars: Record<string, number>;
  challengeBest: number;
  learnDone: boolean;
  muted: boolean;
};

export function defaultSave(): Save {
  return {
    version: 1,
    lang: "ar",
    practiceStars: {},
    challengeBest: 0,
    learnDone: false,
    muted: false,
  };
}

export function loadSave(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as Partial<Save>;
    if (parsed.version !== 1) return defaultSave();
    return { ...defaultSave(), ...parsed, version: 1 };
  } catch {
    return defaultSave();
  }
}

export function writeSave(save: Save) {
  localStorage.setItem(KEY, JSON.stringify(save));
}
