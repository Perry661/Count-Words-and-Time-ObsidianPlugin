import test from "node:test";
import assert from "node:assert/strict";

import { WritingStats } from "../stats.ts";
import {
  calculateFocusRate,
  calculateSpeed,
  countTextUnits,
  formatDuration,
} from "../utils.ts";

test("counts only positive non-whitespace input deltas", () => {
  const stats = new WritingStats({ idleThresholdSeconds: 5, countMode: "characters" });

  stats.handleContentChange("", "你好 world", 0);
  assert.equal(stats.getState().wordCount, 7);

  stats.handleContentChange("你好 world", "你好", 1000);
  assert.equal(stats.getState().wordCount, 7);

  stats.handleContentChange("你好", "你好 again", 2000);
  assert.equal(stats.getState().wordCount, 12);
});

test("treats deletion as writing activity without reducing word count", () => {
  const stats = new WritingStats({ idleThresholdSeconds: 5, countMode: "characters" });

  stats.handleContentChange("hello", "hell", 0);
  stats.tick(3000);

  assert.equal(stats.getState().wordCount, 0);
  assert.equal(stats.getState().writingTimeMs, 3000);
  assert.equal(stats.getState().idleTimeMs, 0);
});

test("deletion resumes writing time after an idle period", () => {
  const stats = new WritingStats({ idleThresholdSeconds: 5, countMode: "characters" });

  stats.handleContentChange("", "hello", 0);
  stats.tick(7000);
  assert.equal(stats.getState().writingTimeMs, 5000);
  assert.equal(stats.getState().idleTimeMs, 2000);

  stats.handleContentChange("hello", "hell", 7000);
  stats.tick(9000);

  assert.equal(stats.getState().wordCount, 5);
  assert.equal(stats.getState().writingTimeMs, 7000);
  assert.equal(stats.getState().idleTimeMs, 2000);
});

test("counts text with selectable count modes", () => {
  assert.equal(countTextUnits("你好 world test", "characters"), 11);
  assert.equal(countTextUnits("你好 world test", "chinese-characters"), 2);
  assert.equal(countTextUnits("你好 world test don't", "english-words"), 3);
});

test("uses selected count mode for input deltas", () => {
  const chineseStats = new WritingStats({
    idleThresholdSeconds: 5,
    countMode: "chinese-characters",
  });
  chineseStats.handleContentChange("", "你好 world", 0);
  assert.equal(chineseStats.getState().wordCount, 2);

  const englishStats = new WritingStats({
    idleThresholdSeconds: 5,
    countMode: "english-words",
  });
  englishStats.handleContentChange("", "你好 world again", 0);
  assert.equal(englishStats.getState().wordCount, 2);
});

test("moves elapsed time from active to idle after the configured threshold", () => {
  const stats = new WritingStats({ idleThresholdSeconds: 5, countMode: "characters" });

  stats.handleContentChange("", "a", 0);
  stats.tick(3000);
  assert.equal(stats.getState().writingTimeMs, 3000);
  assert.equal(stats.getState().idleTimeMs, 0);

  stats.tick(7000);
  assert.equal(stats.getState().writingTimeMs, 5000);
  assert.equal(stats.getState().idleTimeMs, 2000);
});

test("calculates speed data from a recent sliding window", () => {
  const stats = new WritingStats({ idleThresholdSeconds: 5, countMode: "characters" });

  stats.handleContentChange("", "a".repeat(10), 0);
  stats.handleContentChange("a".repeat(10), "a".repeat(15), 30_000);
  stats.handleContentChange("a".repeat(15), "a".repeat(35), 70_000);
  stats.tick(80_000);

  const speedWindow = stats.getSpeedWindowState(80_000);

  assert.equal(stats.getState().wordCount, 35);
  assert.equal(speedWindow.wordCount, 25);
  assert.equal(speedWindow.writingTimeMs, 10_000);
  assert.equal(speedWindow.idleTimeMs, 50_000);
  assert.equal(speedWindow.totalTimeMs, 60_000);
});

test("uses elapsed session time as speed window before the window fills", () => {
  const stats = new WritingStats({ idleThresholdSeconds: 5, countMode: "characters" });

  stats.handleContentChange("", "a".repeat(10), 10_000);
  stats.tick(20_000);

  const speedWindow = stats.getSpeedWindowState(20_000);

  assert.equal(speedWindow.wordCount, 10);
  assert.equal(speedWindow.writingTimeMs, 5000);
  assert.equal(speedWindow.idleTimeMs, 5000);
  assert.equal(speedWindow.totalTimeMs, 10_000);
});

test("pause freezes words and elapsed time until resumed", () => {
  const stats = new WritingStats({ idleThresholdSeconds: 5, countMode: "characters" });

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

test("pause freezes speed window sampling time", () => {
  const stats = new WritingStats({ idleThresholdSeconds: 5, countMode: "characters" });

  stats.handleContentChange("", "a".repeat(10), 0);
  stats.tick(3000);
  stats.setPaused(true, 3000);

  assert.deepEqual(stats.getSpeedWindowState(30_000), {
    wordCount: 10,
    writingTimeMs: 3000,
    idleTimeMs: 0,
    totalTimeMs: 3000,
  });
});

test("reset clears counters and timing anchors", () => {
  const stats = new WritingStats({ idleThresholdSeconds: 5, countMode: "characters" });

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
  assert.equal(calculateSpeed(120, 30 * 60 * 1000, "hour"), 240);
  assert.equal(calculateSpeed(120, 30 * 60 * 1000, "minute"), 4);
  assert.equal(calculateSpeed(120, 0, "hour"), 0);
  assert.equal(calculateFocusRate(4_000, 10_000), 40);
  assert.equal(calculateFocusRate(4_000, 0), 0);
});
