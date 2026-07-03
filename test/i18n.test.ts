import test from "node:test";
import assert from "node:assert/strict";

import { createTranslator, resolveLocale } from "../i18n.ts";

test("resolves interface language from explicit or Obsidian locale", () => {
  assert.equal(resolveLocale("zh", "en"), "zh");
  assert.equal(resolveLocale("en", "zh-CN"), "en");
  assert.equal(resolveLocale("system", "zh-CN"), "zh");
  assert.equal(resolveLocale("system", "en-US"), "en");
  assert.equal(resolveLocale("system", undefined), "en");
});

test("translates shared UI labels", () => {
  const zh = createTranslator("zh");
  const en = createTranslator("en");

  assert.equal(zh("view.title"), "本次写作");
  assert.equal(en("view.title"), "Current session");
  assert.equal(zh("actions.pause"), "暂停");
  assert.equal(en("actions.pause"), "Pause");
});
