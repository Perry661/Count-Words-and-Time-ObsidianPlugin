export type SpeedMode = "total" | "writing";
export type CountMode = "characters" | "chinese-characters" | "english-words";

export function countTextUnits(text: string, mode: CountMode = "characters"): number {
  if (mode === "chinese-characters") {
    return Array.from(text.matchAll(/\p{Script=Han}/gu)).length;
  }

  if (mode === "english-words") {
    return Array.from(text.matchAll(/[A-Za-z]+(?:['-][A-Za-z]+)*/g)).length;
  }

  return Array.from(text).filter((char) => !/\s/u.test(char)).length;
}

export function calculatePositiveInputDelta(
  previous: string,
  current: string,
  mode: CountMode = "characters",
): number {
  const previousCount = countTextUnits(previous, mode);
  const currentCount = countTextUnits(current, mode);
  return Math.max(0, currentCount - previousCount);
}

export function formatDuration(milliseconds: number, ignoreSeconds: boolean): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  return ignoreSeconds ? `${hh}:${mm}` : `${hh}:${mm}:${ss}`;
}

export function calculateSpeedPerHour(wordCount: number, milliseconds: number): number {
  if (wordCount <= 0 || milliseconds <= 0) {
    return 0;
  }

  const hours = milliseconds / 3_600_000;
  return Math.round(wordCount / hours);
}

export function calculateFocusRate(writingTimeMs: number, totalTimeMs: number): number {
  if (writingTimeMs <= 0 || totalTimeMs <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((writingTimeMs / totalTimeMs) * 100));
}

export function getAverageSpeed(
  wordCount: number,
  writingTimeMs: number,
  totalTimeMs: number,
  mode: SpeedMode,
): number {
  const baseTimeMs = mode === "writing" ? writingTimeMs : totalTimeMs;
  return calculateSpeedPerHour(wordCount, baseTimeMs);
}

export function getCountModeMetricLabel(mode: CountMode): string {
  if (mode === "chinese-characters") {
    return "中文字符";
  }

  if (mode === "english-words") {
    return "英文单词";
  }

  return "字数";
}

export function getCountModeUnit(mode: CountMode): string {
  if (mode === "chinese-characters") {
    return "中文字符";
  }

  if (mode === "english-words") {
    return "词";
  }

  return "字";
}
