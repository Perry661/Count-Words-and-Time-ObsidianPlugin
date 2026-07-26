import { PluginSettingTab } from "obsidian";
import type { App, SettingDefinitionItem } from "obsidian";
import type { InterfaceLanguage } from "./i18n.ts";
import type WritingStatsPlugin from "./main.ts";
import type { CountMode, SpeedMode, SpeedUnit } from "./utils.ts";

export interface WritingStatsSettings {
  interfaceLanguage: InterfaceLanguage;
  idleThresholdSeconds: number;
  speedMode: SpeedMode;
  speedUnit: SpeedUnit;
  countMode: CountMode;
  ignoreSeconds: boolean;
  autoOpenSidebar: boolean;
  autoStartOnLaunch: boolean;
}

export const DEFAULT_SETTINGS: WritingStatsSettings = {
  interfaceLanguage: "system",
  idleThresholdSeconds: 5,
  speedMode: "total",
  speedUnit: "hour",
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

  getSettingDefinitions(): SettingDefinitionItem<keyof WritingStatsSettings>[] {
    const t = this.plugin.t;
    const idleThresholdOptions = Object.fromEntries(
      IDLE_THRESHOLD_OPTIONS.map((seconds) => [
        String(seconds),
        `${seconds} ${t("time.seconds")}`,
      ]),
    );

    return [
      {
        type: "group",
        heading: t("settings.title"),
        items: [
          {
            name: t("settings.language.name"),
            desc: t("settings.language.desc"),
            control: {
              type: "dropdown",
              key: "interfaceLanguage",
              defaultValue: DEFAULT_SETTINGS.interfaceLanguage,
              options: {
                system: t("language.system"),
                zh: t("language.zh"),
                en: t("language.english"),
              },
            },
          },
          {
            name: t("settings.idleThreshold.name"),
            desc: t("settings.idleThreshold.desc"),
            control: {
              type: "dropdown",
              key: "idleThresholdSeconds",
              defaultValue: String(DEFAULT_SETTINGS.idleThresholdSeconds),
              options: idleThresholdOptions,
            },
          },
          {
            name: t("settings.speedMode.name"),
            desc: t("settings.speedMode.desc"),
            control: {
              type: "dropdown",
              key: "speedMode",
              defaultValue: DEFAULT_SETTINGS.speedMode,
              options: {
                total: t("speedMode.total"),
                writing: t("speedMode.writing"),
              },
            },
          },
          {
            name: t("settings.speedUnit.name"),
            desc: t("settings.speedUnit.desc"),
            control: {
              type: "dropdown",
              key: "speedUnit",
              defaultValue: DEFAULT_SETTINGS.speedUnit,
              options: {
                hour: t("speedUnit.hour"),
                minute: t("speedUnit.minute"),
              },
            },
          },
          {
            name: t("settings.countMode.name"),
            desc: t("settings.countMode.desc"),
            control: {
              type: "dropdown",
              key: "countMode",
              defaultValue: DEFAULT_SETTINGS.countMode,
              options: {
                characters: t("countMode.characters"),
                "chinese-characters": t("countMode.chineseCharacters"),
                "english-words": t("countMode.englishWords"),
              },
            },
          },
          {
            name: t("settings.ignoreSeconds.name"),
            desc: t("settings.ignoreSeconds.desc"),
            control: {
              type: "toggle",
              key: "ignoreSeconds",
              defaultValue: DEFAULT_SETTINGS.ignoreSeconds,
            },
          },
          {
            name: t("settings.autoOpen.name"),
            desc: t("settings.autoOpen.desc"),
            control: {
              type: "toggle",
              key: "autoOpenSidebar",
              defaultValue: DEFAULT_SETTINGS.autoOpenSidebar,
            },
          },
          {
            name: t("settings.autoStart.name"),
            desc: t("settings.autoStart.desc"),
            control: {
              type: "toggle",
              key: "autoStartOnLaunch",
              defaultValue: DEFAULT_SETTINGS.autoStartOnLaunch,
            },
          },
        ],
      },
    ];
  }

  getControlValue(key: keyof WritingStatsSettings): unknown {
    if (key === "idleThresholdSeconds") {
      return String(this.plugin.settings.idleThresholdSeconds);
    }

    return this.plugin.settings[key];
  }

  async setControlValue(key: keyof WritingStatsSettings, value: unknown): Promise<void> {
    switch (key) {
      case "interfaceLanguage":
        this.plugin.settings.interfaceLanguage = this.toInterfaceLanguage(value);
        break;
      case "idleThresholdSeconds":
        this.plugin.settings.idleThresholdSeconds = this.toIdleThreshold(value);
        break;
      case "speedMode":
        this.plugin.settings.speedMode = value === "writing" ? "writing" : "total";
        break;
      case "speedUnit":
        this.plugin.settings.speedUnit = value === "minute" ? "minute" : "hour";
        break;
      case "countMode":
        this.plugin.settings.countMode = this.toCountMode(value);
        break;
      case "ignoreSeconds":
      case "autoOpenSidebar":
      case "autoStartOnLaunch":
        this.plugin.settings[key] = value === true;
        break;
    }

    await this.plugin.saveSettings();

    if (key === "interfaceLanguage") {
      this.update();
    }
  }

  private toCountMode(value: unknown): CountMode {
    return value === "chinese-characters" || value === "english-words"
      ? value
      : "characters";
  }

  private toInterfaceLanguage(value: unknown): InterfaceLanguage {
    return value === "zh" || value === "en" ? value : "system";
  }

  private toIdleThreshold(value: unknown): number {
    const seconds = typeof value === "string" ? Number(value) : Number.NaN;
    return IDLE_THRESHOLD_OPTIONS.some((option) => option === seconds)
      ? seconds
      : DEFAULT_SETTINGS.idleThresholdSeconds;
  }
}
