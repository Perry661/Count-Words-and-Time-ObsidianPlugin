import { calculatePositiveInputDelta } from "./utils.ts";
import type { CountMode } from "./utils.ts";

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

export class WritingStats {
  private wordCount = 0;
  private writingTimeMs = 0;
  private idleTimeMs = 0;
  private lastInputAt: number | null = null;
  private lastTickAt: number | null = null;
  private isPaused = false;
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

    this.tick(now);

    const inputDelta = calculatePositiveInputDelta(
      previousContent,
      currentContent,
      this.options.countMode,
    );
    if (inputDelta > 0) {
      this.wordCount += inputDelta;
    }

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
    this.lastInputAt = null;
    this.lastTickAt = null;
    this.isPaused = false;
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
}
