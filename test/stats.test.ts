import test from "node:test";
import assert from "node:assert/strict";

import { WritingStats } from "../stats.ts";
import {
  calculateFocusRate,
  calculateSpeedPerHour,
  formatDuration,
} from "../utils.ts";

test("counts only positive non-whitespace input deltas", () => {
  const stats = new WritingStats({ idleThresholdSeconds: 5 });

  stats.handleContentChange("", "你好 world", 0);
  assert.equal(stats.getState().wordCount, 7);

  stats.handleContentChange("你好 world", "你好", 1000);
  assert.equal(stats.getState().wordCount, 7);

  stats.handleContentChange("你好", "你好 again", 2000);
  assert.equal(stats.getState().wordCount, 12);
});

test("moves elapsed time from active to idle after the configured threshold", () => {
  const stats = new WritingStats({ idleThresholdSeconds: 5 });

  stats.handleContentChange("", "a", 0);
  stats.tick(3000);
  assert.equal(stats.getState().writingTimeMs, 3000);
  assert.equal(stats.getState().idleTimeMs, 0);

  stats.tick(7000);
  assert.equal(stats.getState().writingTimeMs, 5000);
  assert.equal(stats.getState().idleTimeMs, 2000);
});

test("pause freezes words and elapsed time until resumed", () => {
  const stats = new WritingStats({ idleThresholdSeconds: 5 });

  stats.handleContentChange("", "abc", 0);
  stats.tick(2000);
  stats.setPaused(true, 2000);
  stats.handleContentChange("abc", "abcdef", 3000);
  stats.tick(10_000);

  assert.equal(stats.getState().wordCount, 3);
  assert.equal(stats.getState().writingTimeMs, 2000);
  assert.equal(stats.getState().idleTimeMs, 0);

  stats.setPaused(false, 10_000);
  stats.handleContentChange("abcdef", "abcdefg", 11_000);
  assert.equal(stats.getState().wordCount, 4);
});

test("reset clears counters and timing anchors", () => {
  const stats = new WritingStats({ idleThresholdSeconds: 5 });

  stats.handleContentChange("", "abc", 0);
  stats.tick(7000);
  stats.reset();

  assert.deepEqual(stats.getState(), {
    wordCount: 0,
    writingTimeMs: 0,
    idleTimeMs: 0,
    totalTimeMs: 0,
    lastInputAt: null,
    lastTickAt: null,
    isPaused: false,
    hasStarted: false,
  });
});

test("formats time, speed, and focus rate", () => {
  assert.equal(formatDuration(3_661_000, false), "01:01:01");
  assert.equal(formatDuration(3_661_000, true), "01:01");
  assert.equal(calculateSpeedPerHour(120, 30 * 60 * 1000), 240);
  assert.equal(calculateSpeedPerHour(120, 0), 0);
  assert.equal(calculateFocusRate(4_000, 10_000), 40);
  assert.equal(calculateFocusRate(4_000, 0), 0);
});
