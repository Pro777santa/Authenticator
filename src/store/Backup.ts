import { UserSettings } from "../models/settings";

export class Backup implements Module {
  async getModule() {
    const userSettings = await UserSettings.getAllItems();
    return {
      state: {
        dropboxEncrypted: userSettings.dropboxEncrypted === true,
        driveEncrypted: userSettings.driveEncrypted === true,
        oneDriveEncrypted: userSettings.oneDriveEncrypted === true,
        dropboxToken: Boolean(userSettings.dropboxToken),
        driveToken: Boolean(userSettings.driveToken),
        oneDriveToken: Boolean(userSettings.oneDriveToken),
      },
      mutations: {
        setToken(
          state: BackupState,
          args: { service: string; value: boolean }
        ) {
          switch (args.service) {
            case "dropbox":
              state.dropboxToken = args.value;
              break;

            case "drive":
              state.driveToken = args.value;
              break;

            case "onedrive":
              state.oneDriveToken = args.value;
              break;

            default:
              break;
          }
        },
        setEnc(state: BackupState, args: { service: string; value: boolean }) {
          switch (args.service) {
            case "dropbox":
              state.dropboxEncrypted = args.value;
              break;

            case "drive":
              state.driveEncrypted = args.value;
              break;

            case "onedrive":
              state.oneDriveEncrypted = args.value;
              break;

            default:
              break;
          }
        },
      },
      namespaced: true,
    };
  }
}
