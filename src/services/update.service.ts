import * as Updates from "expo-updates";
import { Alert } from "react-native";

export const UpdateService = {
  async checkForUpdateAsync() {
    if (__DEV__) {
      Alert.alert("Dev Mode", "OTA updates are not available in development mode.");
      return;
    }

    try {
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        Alert.alert("Update Available", "A new version of MonthWise is available. Would you like to update now?", [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Update",
            onPress: async () => {
              await this.fetchUpdateAsync();
            },
          },
        ]);
      } else {
        Alert.alert("Up to Date", "You are using the latest version of MonthWise.");
      }
    } catch (error) {
      console.error("Error checking for updates:", error);
      Alert.alert("Error", "Failed to check for updates. Please try again later.");
    }
  },

  async fetchUpdateAsync() {
    try {
      await Updates.fetchUpdateAsync();
      Alert.alert("Update Downloaded", "The app will now restart to apply the update.", [
        {
          text: "OK",
          onPress: async () => {
            await Updates.reloadAsync();
          },
        },
      ]);
    } catch (error) {
      console.error("Error fetching update:", error);
      Alert.alert("Error", "Failed to download update.");
    }
  },

  getUpdateId() {
    return Updates.updateId || "Embedded";
  },

  getChannel() {
    return Updates.channel || "Default";
  },
};
