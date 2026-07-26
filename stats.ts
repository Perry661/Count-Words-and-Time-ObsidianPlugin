import { calculatePositiveInputDelta } from "./utils.ts";
import type { CountMode } from "./utils.ts";

const SPEED_WINDOW_MS = 60_000;

export interface WritingStatsOptions {
  idleThresholdSeconds: number;
  countMode: CountMode;
}

export interface WritingStatsState {
  wordCount: number;
  writingTimeMs: number;
  idleTimeMs: number;
  totalTimeMs: number;
  lastInputAt: number | null;
  lastTickAt: number | null;
  isPaused: boolean;
  hasStarted: boolean;
}

export interface SpeedWindowState {
  wordCount: number;
  writingTimeMs: number;
  idleTimeMs: number;
  totalTimeMs: number;
}

interface InputEvent {
  at: number;
  delta: number;
}

export class WritingStats {
  private wordCount = 0;
  private writingTimeMs = 0;
  private idleTimeMs = 0;
  private sessionStartedAt: number | null = null;
  private lastInputAt: number | null = null;
  private lastTickAt: number | null = null;
  private isPaused = false;
  private activityEvents: number[] = [];
  private inputEvents: InputEvent[] = [];
  private options: WritingStatsOptions;

  constructor(options: WritingStatsOptions) {
    this.options = options;
  }

  updateOptions(options: WritingStatsOptions): void {
    this.tick(Date.now());
    this.options = options;
  }

  handleContentChange(previousContent: string, currentContent: string, now: number): void {
    if (this.isPaused || previousContent === currentContent) {
      return;
    }

    if (this.sessionStartedAt === null) {
      this.sessionStartedAt = now;
    }

    this.tick(now);

    const inputDelta = calculatePositiveInputDelta(
      previousContent,
      currentContent,
      this.options.countMode,
    );
    if (inputDelta > 0) {
      this.wordCount += inputDelta;
      this.inputEvents.push({ at: now, delta: inputDelta });
    }

    this.activityEvents.push(now);
    this.lastInputAt = now;
    this.lastTickAt = now;
  }

  tick(now: number): void {
    if (this.isPaused || this.lastInputAt === null) {
      return;
    }

    if (this.lastTickAt === null) {
      this.lastTickAt = now;
      return;
    }

    if (now <= this.lastTickAt) {
      return;
    }

    const idleThresholdMs = this.options.idleThresholdSeconds * 1000;
    let activeSegmentStart = this.lastTickAt;
    let segmentEnd = now;

    if (activeSegmentStart < this.lastInputAt) {
      activeSegmentStart = this.lastInputAt;
    }

    const idleStartsAt = this.lastInputAt + idleThresholdMs;

    if (segmentEnd <= idleStartsAt) {
      this.writingTimeMs += segmentEnd - activeSegmentStart;
    } else if (activeSegmentStart >= idleStartsAt) {
      this.idleTimeMs += segmentEnd - activeSegmentStart;
    } else {
      this.writingTimeMs += idleStartsAt - activeSegmentStart;
      this.idleTimeMs += segmentEnd - idleStartsAt;
    }

    this.lastTickAt = now;
  }

  setPaused(isPaused: boolean, now: number = Date.now()): void {
    if (this.isPaused === isPaused) {
      return;
    }

    if (isPaused) {
      this.tick(now);
      this.isPaused = true;
      return;
    }

    this.isPaused = false;
    this.lastInputAt = null;
    this.lastTickAt = null;
  }

  togglePaused(now: number = Date.now()): boolean {
    this.setPaused(!this.isPaused, now);
    return this.isPaused;
  }

  reset(): void {
    this.wordCount = 0;
    this.writingTimeMs = 0;
    this.idleTimeMs = 0;
    this.sessionStartedAt = null;
    this.lastInputAt = null;
    this.lastTickAt = null;
    this.isPaused = false;
    this.activityEvents = [];
    this.inputEvents = [];
  }

  getSpeedWindowState(now: number = Date.now()): SpeedWindowState {
    if (this.sessionStartedAt === null) {
      return {
        wordCount: 0,
        writingTimeMs: 0,
        idleTimeMs: 0,
        totalTimeMs: 0,
      };
    }

    const effectiveNow = this.isPaused && this.lastTickAt !== null ? this.lastTickAt : now;
    const windowStart = Math.max(this.sessionStartedAt, effectiveNow - SPEED_WINDOW_MS);
    const windowEnd = Math.max(windowStart, effectiveNow);
    const wordCount = this.inputEvents
      .filter((event) => event.at >= windowStart && event.at <= windowEnd)
      .reduce((total, event) => total + event.delta, 0);
    const totalTimeMs = windowEnd - windowStart;
    const writingTimeMs = this.calculateWritingTimeInWindow(windowStart, windowEnd);

    return {
      wordCount,
      writingTimeMs,
      idleTimeMs: Math.max(0, totalTimeMs - writingTimeMs),
      totalTimeMs,
    };
  }

  getState(): WritingStatsState {
    return {
      wordCount: this.wordCount,
      writingTimeMs: this.writingTimeMs,
      idleTimeMs: this.idleTimeMs,
      totalTimeMs: this.writingTimeMs + this.idleTimeMs,
      lastInputAt: this.lastInputAt,
      lastTickAt: this.lastTickAt,
      isPaused: this.isPaused,
      hasStarted: this.lastInputAt !== null || this.writingTimeMs > 0 || this.idleTimeMs > 0,
    };
  }

  private calculateWritingTimeInWindow(windowStart: number, windowEnd: number): number {
    const idleThresholdMs = this.options.idleThresholdSeconds * 1000;
    const intervals: Array<{ start: number; end: number }> = [];

    for (const activityAt of this.activityEvents) {
      const activeStart = Math.max(activityAt, windowStart);
      const activeEnd = Math.min(activityAt + idleThresholdMs, windowEnd);

      if (activeEnd > activeStart) {
        intervals.push({ start: activeStart, end: activeEnd });
      }
    }

    intervals.sort((a, b) => a.start - b.start);

    let writingTimeMs = 0;
    let currentStart: number | null = null;
    let currentEnd: number | null = null;

    for (const interval of intervals) {
      if (currentStart === null || currentEnd === null) {
        currentStart = interval.start;
        currentEnd = interval.end;
        continue;
      }

      if (interval.start <= currentEnd) {
        currentEnd = Math.max(currentEnd, interval.end);
        continue;
      }

      writingTimeMs += currentEnd - currentStart;
      currentStart = interval.start;
      currentEnd = interval.end;
    }

    if (currentStart !== null && currentEnd !== null) {
      writingTimeMs += currentEnd - currentStart;
    }

    return writingTimeMs;
  }
}
