import { EntryStorage } from "../models/storage";
import { InsightLevel, AdvisorInsight } from "../models/advisor";
import { StorageLocation, UserSettings } from "../models/settings";

const insightsData: AdvisorInsightInterface[] = [
  {
    id: "passwordNotSet",
    level: InsightLevel.danger,
    description: chrome.i18n.getMessage("advisor_insight_password_not_set"),
    validation: async () => {
      const hasEncryptedEntry = await EntryStorage.hasEncryptionKey();
      return !hasEncryptedEntry;
    },
  },
  {
    id: "autoLockNotSet",
    level: InsightLevel.warning,
    description: chrome.i18n.getMessage("advisor_insight_auto_lock_not_set"),
    validation: async () => {
      const userSettings = await UserSettings.getAllItems();
      const hasEncryptedEntry = await EntryStorage.hasEncryptionKey();
      return hasEncryptedEntry && !Number(userSettings.autolock);
    },
  },
  {
    id: "browserSyncNotEnabled",
    level: InsightLevel.info,
    description: chrome.i18n.getMessage(
      "advisor_insight_browser_sync_not_enabled"
    ),
    validation: async () => {
      const userSettings = await UserSettings.getAllItems();
      const storageArea = userSettings.storageLocation;
      return storageArea !== StorageLocation.Sync;
    },
  },
  {
    id: "autoFillNotEnabled",
    level: InsightLevel.info,
    description: chrome.i18n.getMessage(
      "advisor_insight_auto_fill_not_enabled"
    ),
    validation: async () => {
      const userSettings = await UserSettings.getAllItems();
      return userSettings.autofill !== true;
    },
  },
  {
    id: "smartFilterNotEnabled",
    level: InsightLevel.info,
    description: chrome.i18n.getMessage(
      "advisor_insight_smart_filter_not_enabled"
    ),
    validation: async () => {
      const userSettings = await UserSettings.getAllItems();
      return userSettings.smartFilter === false;
    },
  },
];

export class Advisor implements Module {
  async getModule() {
    const userSettings = await UserSettings.getAllItems();
    return {
      state: {
        insights: await this.getInsights(),
        ignoreList: userSettings.advisorIgnoreList || [],
      },
      mutations: {
        dismissInsight: async (state: AdvisorState, insightId: string) => {
          state.ignoreList.push(insightId);
          userSettings.advisorIgnoreList = state.ignoreList;
          UserSettings.setItems(userSettings);

          state.insights = await this.getInsights();
        },
        clearIgnoreList: async (state: AdvisorState) => {
          state.ignoreList = [];
          userSettings.advisorIgnoreList = undefined;
          UserSettings.setItems(userSettings);

          state.insights = await this.getInsights();
        },
        updateInsight: async (state: AdvisorState) => {
          state.insights = await this.getInsights();
          state.ignoreList =
            typeof userSettings.advisorIgnoreList === "string"
              ? JSON.parse(userSettings.advisorIgnoreList || "[]")
              : userSettings.advisorIgnoreList || [];
        },
      },
      namespaced: true,
    };
  }

  private async getInsights() {
    const userSettings = await UserSettings.getAllItems();
    const advisorIgnoreList: string[] =
      typeof userSettings.advisorIgnoreList === "string"
        ? JSON.parse(userSettings.advisorIgnoreList || "[]")
        : userSettings.advisorIgnoreList || [];

    const filteredInsightsData: AdvisorInsightInterface[] = [];

    for (const insightData of insightsData) {
      if (advisorIgnoreList.includes(insightData.id)) {
        continue;
      }

      const validation = await insightData.validation();

      if (validation) {
        filteredInsightsData.push(insightData);
      }
    }

    return filteredInsightsData.map(
      (insightData) => new AdvisorInsight(insightData)
    );
  }
}
