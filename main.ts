import { MarkdownView, Notice, Plugin, WorkspaceLeaf } from "obsidian";
import { DEFAULT_SETTINGS, WritingStatsSettingTab } from "./settings.ts";
import type { WritingStatsSettings } from "./settings.ts";
import { WritingStats } from "./stats.ts";
import { StatsTimer } from "./timer.ts";
import { VIEW_TYPE_WRITING_STATS, WritingStatsView } from "./view.ts";

interface EditorLike {
  getValue(): string;
}

export default class WritingStatsPlugin extends Plugin {
  settings: WritingStatsSettings = { ...DEFAULT_SETTINGS };

  private stats!: WritingStats;
  private timer = new StatsTimer();
  private editorContentCache = new WeakMap<object, string>();

  async onload(): Promise<void> {
    await this.loadSettings();

    this.stats = new WritingStats({
      idleThresholdSeconds: this.settings.idleThresholdSeconds,
      countMode: this.settings.countMode,
    });

    if (!this.settings.autoStartOnLaunch) {
      this.stats.setPaused(true);
    }

    this.registerView(
      VIEW_TYPE_WRITING_STATS,
      (leaf: WorkspaceLeaf) =>
        new WritingStatsView(
          leaf,
          this.stats,
          () => this.settings,
          {
            onTogglePause: () => this.togglePaused(),
            onReset: () => this.resetStats(),
          },
        ),
    );

    this.addRibbonIcon("timer", "写作统计", () => {
      void this.openStatsView();
    });

    this.addCommand({
      id: "open-writing-stats-view",
      name: "打开写作统计侧边栏",
      callback: () => {
        void this.openStatsView();
      },
    });

    this.addCommand({
      id: "reset-writing-stats",
      name: "开始新的统计",
      callback: () => this.resetStats(),
    });

    this.addCommand({
      id: "toggle-writing-stats-pause",
      name: "暂停或继续写作统计",
      callback: () => this.togglePaused(),
    });

    this.registerEvent(
      this.app.workspace.on("editor-change", (editor: unknown) => {
        this.handleEditorChange(editor);
      }),
    );

    this.registerEvent(
      this.app.workspace.on("file-open", () => {
        this.captureActiveEditorContent();
      }),
    );

    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => {
        this.captureActiveEditorContent();
      }),
    );

    this.addSettingTab(new WritingStatsSettingTab(this.app, this));

    this.app.workspace.onLayoutReady(() => {
      this.captureActiveEditorContent();
      this.timer.start(() => this.tick(), 1000);

      if (this.settings.autoOpenSidebar) {
        void this.openStatsView();
      }
    });
  }

  onunload(): void {
    this.timer.stop();
  }

  async loadSettings(): Promise<void> {
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...(await this.loadData()),
    };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.stats.updateOptions({
      idleThresholdSeconds: this.settings.idleThresholdSeconds,
      countMode: this.settings.countMode,
    });
    this.refreshViews();
  }

  private handleEditorChange(editor: unknown): void {
    if (!this.isEditorLike(editor)) {
      return;
    }

    const editorKey = editor as object;
    const currentContent = editor.getValue();
    const previousContent = this.editorContentCache.get(editorKey);

    if (previousContent === undefined) {
      this.editorContentCache.set(editorKey, currentContent);
      return;
    }

    this.stats.handleContentChange(previousContent, currentContent, Date.now());
    this.editorContentCache.set(editorKey, currentContent);
    this.refreshViews();
  }

  private captureActiveEditorContent(): void {
    const editor = this.getActiveEditor();
    if (!editor) {
      return;
    }

    this.editorContentCache.set(editor as object, editor.getValue());
  }

  private getActiveEditor(): EditorLike | null {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    return view?.editor ?? null;
  }

  private isEditorLike(value: unknown): value is EditorLike {
    return (
      typeof value === "object" &&
      value !== null &&
      "getValue" in value &&
      typeof (value as EditorLike).getValue === "function"
    );
  }

  private tick(): void {
    this.stats.tick(Date.now());
    this.refreshViews();
  }

  private togglePaused(): void {
    const isPaused = this.stats.togglePaused(Date.now());
    new Notice(isPaused ? "写作统计已暂停" : "写作统计已继续");
    this.captureActiveEditorContent();
    this.refreshViews();
  }

  private resetStats(): void {
    this.stats.reset();
    this.captureActiveEditorContent();
    this.refreshViews();
    new Notice("已开始新的统计");
  }

  private refreshViews(): void {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_WRITING_STATS)) {
      const view = leaf.view;
      if (view instanceof WritingStatsView) {
        view.requestRender();
      }
    }
  }

  private async openStatsView(): Promise<void> {
    const existingLeaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_WRITING_STATS)[0];
    if (existingLeaf) {
      this.app.workspace.revealLeaf(existingLeaf);
      return;
    }

    const leaf = this.app.workspace.getRightLeaf(false) ?? this.app.workspace.getLeaf(true);
    await leaf.setViewState({
      type: VIEW_TYPE_WRITING_STATS,
      active: true,
    });
    this.app.workspace.revealLeaf(leaf);
  }
}
