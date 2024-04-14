import { isSafari } from "../browser";
import { UserSettings } from "../models/settings";
import { ManagedStorage } from "../models/storage";

export class Menu implements Module {
  async getModule() {
    const userSettings = await UserSettings.getAllItems();
    const menuState = {
      state: {
        version: chrome.runtime.getManifest()?.version || "0.0.0",
        zoom: Number(userSettings.zoom) || 100,
        useAutofill: userSettings.autofill === true,
        smartFilter: userSettings.smartFilter !== false,
        enableContextMenu: userSettings.enableContextMenu === true,
        theme: userSettings.theme || (isSafari ? "flat" : "normal"),
        autolock: Number(userSettings.autolock) || 0,
        backupDisabled: await ManagedStorage.get("disableBackup", false),
        exportDisabled: await ManagedStorage.get("disableExport", false),
        enforcePassword: await ManagedStorage.get("enforcePassword", false),
        enforceAutolock: await ManagedStorage.get("enforceAutolock", false),
        storageArea: await ManagedStorage.get<"sync" | "local">("storageArea"),
        feedbackURL: await ManagedStorage.get<string>("feedbackURL"),
        passwordPolicy: await ManagedStorage.get<string>("passwordPolicy"),
        passwordPolicyHint: await ManagedStorage.get<string>(
          "passwordPolicyHint"
        ),
      },
      mutations: {
        setZoom: (state: MenuState, zoom: number) => {
          state.zoom = zoom;
          userSettings.zoom = zoom;
          UserSettings.setItems(userSettings);
          this.resize(zoom);
        },
        setAutofill(state: MenuState, useAutofill: boolean) {
          state.useAutofill = useAutofill;
          userSettings.autofill = useAutofill;
          UserSettings.setItems(userSettings);
        },
        setSmartFilter(state: MenuState, smartFilter: boolean) {
          state.smartFilter = smartFilter;
          userSettings.smartFilter = smartFilter;
          UserSettings.setItems(userSettings);
        },
        setEnableContextMenu(state: MenuState, enableContextMenu: boolean) {
          state.enableContextMenu = enableContextMenu;
          userSettings.enableContextMenu = enableContextMenu;
          UserSettings.setItems(userSettings);
        },
        setTheme(state: MenuState, theme: string) {
          state.theme = theme;
          userSettings.theme = theme;
          UserSettings.setItems(userSettings);
        },
        setAutolock(state: MenuState, autolock: number) {
          state.autolock = autolock;
          userSettings.autolock = autolock;
          UserSettings.setItems(userSettings);
        },
      },
      namespaced: true,
    };

    this.resize(menuState.state.zoom);

    return menuState;
  }

  private resize(zoom: number) {
    if (zoom !== 100) {
      document.body.style.marginBottom = 480 * (zoom / 100 - 1) + "px";
      document.body.style.marginRight = 320 * (zoom / 100 - 1) + "px";
      document.body.style.transform = "scale(" + zoom / 100 + ")";
    }
  }
}
