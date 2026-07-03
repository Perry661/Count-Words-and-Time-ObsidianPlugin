import { App, PluginSettingTab, Setting } from "obsidian";
import type { InterfaceLanguage } from "./i18n.ts";
import type WritingStatsPlugin from "./main.ts";
import type { CountMode, SpeedMode } from "./utils.ts";

export interface WritingStatsSettings {
  interfaceLanguage: InterfaceLanguage;
  idleThresholdSeconds: number;
  speedMode: SpeedMode;
  countMode: CountMode;
  ignoreSeconds: boolean;
  autoOpenSidebar: boolean;
  autoStartOnLaunch: boolean;
}

export const DEFAULT_SETTINGS: WritingStatsSettings = {
  interfaceLanguage: "system",
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
    const t = this.plugin.t;
    containerEl.replaceChildren();

    const heading = containerEl.createEl("h2", { text: t("settings.title") });
    heading.addClass("writing-stats-settings-heading");

    new Setting(containerEl)
      .setName(t("settings.language.name"))
      .setDesc(t("settings.language.desc"))
      .addDropdown((dropdown) =>
        dropdown
          .addOption("system", t("language.system"))
          .addOption("zh", t("language.zh"))
          .addOption("en", t("language.english"))
          .setValue(this.plugin.settings.interfaceLanguage)
          .onChange(async (value) => {
            this.plugin.settings.interfaceLanguage = this.toInterfaceLanguage(value);
            await this.plugin.saveSettings();
            this.display();
          }),
      );

    new Setting(containerEl)
      .setName(t("settings.idleThreshold.name"))
      .setDesc(t("settings.idleThreshold.desc"))
      .addDropdown((dropdown) => {
        for (const seconds of IDLE_THRESHOLD_OPTIONS) {
          dropdown.addOption(String(seconds), `${seconds} ${t("time.seconds")}`);
        }

        dropdown
          .setValue(String(this.plugin.settings.idleThresholdSeconds))
          .onChange(async (value) => {
            this.plugin.settings.idleThresholdSeconds = Number(value);
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName(t("settings.speedMode.name"))
      .setDesc(t("settings.speedMode.desc"))
      .addDropdown((dropdown) =>
        dropdown
          .addOption("total", t("speedMode.total"))
          .addOption("writing", t("speedMode.writing"))
          .setValue(this.plugin.settings.speedMode)
          .onChange(async (value) => {
            this.plugin.settings.speedMode = value === "writing" ? "writing" : "total";
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName(t("settings.countMode.name"))
      .setDesc(t("settings.countMode.desc"))
      .addDropdown((dropdown) =>
        dropdown
          .addOption("characters", t("countMode.characters"))
          .addOption("chinese-characters", t("countMode.chineseCharacters"))
          .addOption("english-words", t("countMode.englishWords"))
          .setValue(this.plugin.settings.countMode)
          .onChange(async (value) => {
            this.plugin.settings.countMode = this.toCountMode(value);
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName(t("settings.ignoreSeconds.name"))
      .setDesc(t("settings.ignoreSeconds.desc"))
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.ignoreSeconds).onChange(async (value) => {
          this.plugin.settings.ignoreSeconds = value;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName(t("settings.autoOpen.name"))
      .setDesc(t("settings.autoOpen.desc"))
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoOpenSidebar).onChange(async (value) => {
          this.plugin.settings.autoOpenSidebar = value;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName(t("settings.autoStart.name"))
      .setDesc(t("settings.autoStart.desc"))
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

  private toInterfaceLanguage(value: string): InterfaceLanguage {
    if (value === "zh" || value === "en") {
      return value;
    }

    return "system";
  }
}
