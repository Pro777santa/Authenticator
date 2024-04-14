export enum StorageLocation {
  Sync = "sync",
  Local = "local",
}

// To determine if a setting is local-only, we use a class instead of an interface.
// This is because interfaces are not accessible at runtime.
class LocalUserSettingsData {
  driveEncrypted?: boolean;
  driveFolder?: string;
  driveRefreshToken?: string;
  driveRevoked?: boolean;
  driveToken?: string;
  dropboxEncrypted?: boolean;
  dropboxRevoked?: boolean;
  dropboxToken?: string;
  lastRemindingBackupTime?: number;
  offset?: number;
  oneDriveBusiness?: boolean;
  oneDriveEncrypted?: boolean;
  oneDriveRevoked?: boolean;
  oneDriveRefreshToken?: string;
  oneDriveToken?: string;
  storageLocation?: StorageLocation;
}

export class UserSettingsData extends LocalUserSettingsData {
  advisorIgnoreList?: string[];
  autofill?: boolean;
  autolock?: number;
  enableContextMenu?: boolean;
  encodedPhrase?: string;
  smartFilter?: boolean;
  theme?: string;
  zoom?: number;
}

export class UserSettings {
  static convertFromLocalStorage(data: Storage) {
    const settings: UserSettingsData = {};

    for (const key in data) {
      if (Object.keys(UserSettingsData).includes(key)) {
        if (
          key in
          [
            "driveEncrypted",
            "dropboxEncrypted",
            "oneDriveEncrypted",
            "highContrast",
            "smartFilter",
            "enableContextMenu",
          ]
        ) {
          data[key] = data[key] === "true";
        } else if (key in ["autolock", "offset", "zoom"]) {
          data[key] = Number(data[key]);
        } else if (key in ["advisorIgnoreList"]) {
          data[key] = JSON.parse(data[key]);
        }

        settings[key as keyof UserSettingsData] = data[key];
      }
    }
  }

  static async setLocation(location: StorageLocation) {
    const localSettings = await UserSettings.getStorageData(
      StorageLocation.Local
    );

    if (location === StorageLocation.Sync) {
      const syncableSettings = await UserSettings.getStorageData(
        StorageLocation.Sync
      );
      const settings = { ...localSettings, ...syncableSettings };

      await chrome.storage[StorageLocation.Sync].set({
        UserSettings: settings,
      });
    } else {
      const syncableSettings = await UserSettings.getStorageData(
        StorageLocation.Sync
      );
      const settings = { ...syncableSettings, ...localSettings };

      await chrome.storage[StorageLocation.Local].set({
        UserSettings: settings,
      });
    }

    localSettings.storageLocation = location;

    await UserSettings.setItems(localSettings);
  }

  static async getAllItems() {
    const localSettings = await UserSettings.getStorageData(
      StorageLocation.Local
    );
    const storageLocation =
      localSettings.storageLocation || StorageLocation.Local;

    if (storageLocation === StorageLocation.Local) {
      return localSettings;
    }

    const syncableSettings = await UserSettings.getStorageData(
      StorageLocation.Sync
    );
    return { ...syncableSettings, ...localSettings };
  }

  static async setItems(settings: UserSettingsData) {
    const localSettings = await UserSettings.getStorageData(
      StorageLocation.Local
    );
    const storageLocation =
      localSettings.storageLocation || StorageLocation.Local;

    if (storageLocation === StorageLocation.Local) {
      await chrome.storage[storageLocation].set({ UserSettings: settings });
    } else {
      const { syncableSettings, localSettings } = UserSettings.splitSettings(
        settings
      );

      await Promise.all([
        chrome.storage[StorageLocation.Local].set({
          UserSettings: localSettings,
        }),
        chrome.storage[StorageLocation.Sync].set({
          UserSettings: syncableSettings,
        }),
      ]);
    }
  }

  static async removeItem(key: keyof UserSettingsData) {
    const localSettings = await UserSettings.getStorageData(
      StorageLocation.Local
    );
    const storageLocation =
      localSettings.storageLocation || StorageLocation.Local;

    const location = Object.keys(LocalUserSettingsData).includes(key)
      ? StorageLocation.Local
      : storageLocation;
    const storageData: UserSettingsData =
      (await chrome.storage[location].get("UserSettings")).UserSettings || {};
    delete storageData[key];

    await UserSettings.setItems(storageData);
  }

  private static async getStorageData(location: StorageLocation) {
    const storageData: UserSettingsData =
      (await chrome.storage[location].get("UserSettings")).UserSettings || {};

    return storageData;
  }

  private static splitSettings(storageData: UserSettingsData) {
    const syncableSettings: UserSettingsData = Object.assign({}, storageData);
    const localSettings: UserSettingsData = Object.assign({}, storageData);

    let key: keyof UserSettingsData;
    for (key in storageData) {
      if (Object.keys(LocalUserSettingsData).includes(key)) {
        delete syncableSettings[key];
      } else {
        delete localSettings[key];
      }
    }

    return {
      syncableSettings,
      localSettings,
    };
  }
}
