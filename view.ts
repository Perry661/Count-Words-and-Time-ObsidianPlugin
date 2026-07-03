import { ItemView, WorkspaceLeaf } from "obsidian";
import type { WritingStats, WritingStatsState } from "./stats.ts";
import type { WritingStatsSettings } from "./settings.ts";
import {
  calculateFocusRate,
  formatDuration,
  getAverageSpeed,
  getCountModeMetricLabel,
  getCountModeUnit,
} from "./utils.ts";

export const VIEW_TYPE_WRITING_STATS = "writing-stats-view";

interface WritingStatsViewActions {
  onTogglePause: () => void;
  onReset: () => void;
}

export class WritingStatsView extends ItemView {
  private stats: WritingStats;
  private getSettings: () => WritingStatsSettings;
  private actions: WritingStatsViewActions;
  private wordCountLabelEl: HTMLElement | null = null;
  private wordCountEl: HTMLElement | null = null;
  private averageSpeedEl: HTMLElement | null = null;
  private writingTimeEl: HTMLElement | null = null;
  private idleTimeEl: HTMLElement | null = null;
  private totalTimeEl: HTMLElement | null = null;
  private focusRateEl: HTMLElement | null = null;
  private focusProgressEl: HTMLDivElement | null = null;
  private pauseButtonEl: HTMLButtonElement | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    stats: WritingStats,
    getSettings: () => WritingStatsSettings,
    actions: WritingStatsViewActions,
  ) {
    super(leaf);
    this.stats = stats;
    this.getSettings = getSettings;
    this.actions = actions;
  }

  getViewType(): string {
    return VIEW_TYPE_WRITING_STATS;
  }

  getDisplayText(): string {
    return "写作统计";
  }

  getIcon(): string {
    return "timer";
  }

  async onOpen(): Promise<void> {
    this.render();
  }

  async onClose(): Promise<void> {
    this.containerEl.replaceChildren();
  }

  requestRender(): void {
    this.updateValues();
  }

  private render(): void {
    const root = this.contentEl;
    root.replaceChildren();
    root.addClass("writing-stats-view");

    const title = root.createEl("h2", { text: "本次写作" });
    title.addClass("writing-stats-title");

    const wordMetric = this.createMetric(root, "字数");
    this.wordCountLabelEl = wordMetric.labelEl;
    this.wordCountEl = wordMetric.valueEl;
    this.averageSpeedEl = this.createMetric(root, "平均速度").valueEl;
    this.createDivider(root);
    this.writingTimeEl = this.createMetric(root, "码字时间").valueEl;
    this.idleTimeEl = this.createMetric(root, "空闲时间").valueEl;
    this.totalTimeEl = this.createMetric(root, "总计时间").valueEl;
    this.createDivider(root);
    this.createFocusSection(root);
    this.createDivider(root);
    this.createButtons(root);

    this.updateValues();
  }

  private createMetric(parent: HTMLElement, label: string): { labelEl: HTMLElement; valueEl: HTMLElement } {
    const row = parent.createDiv({ cls: "writing-stats-metric" });
    const labelEl = row.createDiv({ cls: "writing-stats-label", text: label });
    const valueEl = row.createDiv({ cls: "writing-stats-value" });
    return { labelEl, valueEl };
  }

  private createDivider(parent: HTMLElement): void {
    parent.createDiv({ cls: "writing-stats-divider" });
  }

  private createFocusSection(parent: HTMLElement): void {
    const section = parent.createDiv({ cls: "writing-stats-focus" });
    const header = section.createDiv({ cls: "writing-stats-focus-header" });
    header.createDiv({ cls: "writing-stats-label", text: "专注率" });
    this.focusRateEl = header.createDiv({ cls: "writing-stats-focus-value" });

    const track = section.createDiv({ cls: "writing-stats-progress-track" });
    this.focusProgressEl = track.createDiv({ cls: "writing-stats-progress-fill" });
  }

  private createButtons(parent: HTMLElement): void {
    const buttonGroup = parent.createDiv({ cls: "writing-stats-buttons" });
    this.pauseButtonEl = buttonGroup.createEl("button", {
      cls: "mod-cta writing-stats-button",
      text: "暂停",
    });
    this.pauseButtonEl.addEventListener("click", this.actions.onTogglePause);

    const resetButton = buttonGroup.createEl("button", {
      cls: "writing-stats-button",
      text: "开始新的统计",
    });
    resetButton.addEventListener("click", this.actions.onReset);
  }

  private updateValues(): void {
    const settings = this.getSettings();
    const state = this.stats.getState();
    const focusRate = calculateFocusRate(state.writingTimeMs, state.totalTimeMs);
    const averageSpeed = getAverageSpeed(
      state.wordCount,
      state.writingTimeMs,
      state.totalTimeMs,
      settings.speedMode,
    );

    const unit = getCountModeUnit(settings.countMode);

    this.setText(this.wordCountLabelEl, getCountModeMetricLabel(settings.countMode));
    this.setText(this.wordCountEl, `${state.wordCount} ${unit}`);
    this.setText(this.averageSpeedEl, `${averageSpeed} ${unit}/小时`);
    this.setText(this.writingTimeEl, formatDuration(state.writingTimeMs, settings.ignoreSeconds));
    this.setText(this.idleTimeEl, formatDuration(state.idleTimeMs, settings.ignoreSeconds));
    this.setText(this.totalTimeEl, formatDuration(state.totalTimeMs, settings.ignoreSeconds));
    this.setText(this.focusRateEl, `${focusRate}%`);

    if (this.focusProgressEl) {
      this.focusProgressEl.style.width = `${focusRate}%`;
      this.focusProgressEl.setAttribute("aria-valuenow", String(focusRate));
    }

    if (this.pauseButtonEl) {
      this.pauseButtonEl.textContent = state.isPaused ? "继续" : "暂停";
    }
  }

  private setText(element: HTMLElement | null, value: string): void {
    if (element) {
      element.textContent = value;
    }
  }
}

export type { WritingStatsState };
