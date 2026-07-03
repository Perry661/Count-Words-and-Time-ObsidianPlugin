import { App, PluginSettingTab, Setting } from "obsidian";
import type WritingStatsPlugin from "./main.ts";
import type { CountMode, SpeedMode } from "./utils.ts";

export interface WritingStatsSettings {
  idleThresholdSeconds: number;
  speedMode: SpeedMode;
  countMode: CountMode;
  ignoreSeconds: boolean;
  autoOpenSidebar: boolean;
  autoStartOnLaunch: boolean;
}

export const DEFAULT_SETTINGS: WritingStatsSettings = {
  idleThresholdSeconds: 5,
  speedMode: "total",
  countMode: "characters",
  ignoreSeconds: false,
  autoOpenSidebar: true,
  autoStartOnLaunch: true,
};

const IDLE_THRESHOLD_OPTIONS = [5, 10, 20, 30, 60] as const;

export class WritingStatsSettingTab extends PluginSettingTab {
  private plugin: WritingStatsPlugin;

  constructor(
    app: App,
    plugin: WritingStatsPlugin,
  ) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.replaceChildren();

    const heading = containerEl.createEl("h2", { text: "写作统计设置" });
    heading.addClass("writing-stats-settings-heading");

    new Setting(containerEl)
      .setName("空闲触发间隔")
      .setDesc("最后一次输入后超过该间隔，开始累计空闲时间。")
      .addDropdown((dropdown) => {
        for (const seconds of IDLE_THRESHOLD_OPTIONS) {
          dropdown.addOption(String(seconds), `${seconds} 秒`);
        }

        dropdown
          .setValue(String(this.plugin.settings.idleThresholdSeconds))
          .onChange(async (value) => {
            this.plugin.settings.idleThresholdSeconds = Number(value);
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("平均速度计算方式")
      .setDesc("总计速度按总计时间计算，码字速度只按码字时间计算。")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("total", "总计速度")
          .addOption("writing", "码字速度")
          .setValue(this.plugin.settings.speedMode)
          .onChange(async (value) => {
            this.plugin.settings.speedMode = value === "writing" ? "writing" : "total";
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("统计单位")
      .setDesc("选择本次输入增量的统计口径。")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("characters", "字符数（忽略空白）")
          .addOption("chinese-characters", "中文字符数")
          .addOption("english-words", "英文单词数")
          .setValue(this.plugin.settings.countMode)
          .onChange(async (value) => {
            this.plugin.settings.countMode = this.toCountMode(value);
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("忽略秒钟")
      .setDesc("开启后，所有时间显示为 hh:mm。")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.ignoreSeconds).onChange(async (value) => {
          this.plugin.settings.ignoreSeconds = value;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("自动打开统计侧边栏")
      .setDesc("插件启动后自动显示写作统计视图。")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoOpenSidebar).onChange(async (value) => {
          this.plugin.settings.autoOpenSidebar = value;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("插件启动时自动开始统计")
      .setDesc("关闭后，插件启动时保持暂停，点击继续后开始统计。")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoStartOnLaunch).onChange(async (value) => {
          this.plugin.settings.autoStartOnLaunch = value;
          await this.plugin.saveSettings();
        }),
      );
  }

  private toCountMode(value: string): CountMode {
    if (value === "chinese-characters" || value === "english-words") {
      return value;
    }

    return "characters";
  }
}
