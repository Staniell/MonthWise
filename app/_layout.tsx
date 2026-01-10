import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  useFonts,
} from "@expo-google-fonts/outfit";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";

import { getDatabase } from "@/database";
import { useAppStore } from "@/stores";
import { colors } from "@/theme";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  const initializeApp = useAppStore((state) => state.initialize);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize Database (connection + schema + seed)
        await getDatabase();
        // Load App Data
        await initializeApp();
      } catch (e) {
        console.warn(e);
      } finally {
        if (loaded) {
          await SplashScreen.hideAsync();
        }
      }
    }

    if (loaded) {
      prepare();
    }
  }, [loaded, initializeApp]);

  if (!loaded) {
    return null;
  }

  // Application Root
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="light" backgroundColor={colors.background} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontFamily: "Outfit_600SemiBold",
            color: colors.text,
          },
          headerShadowVisible: false, // Minimalist look
          contentStyle: {
            backgroundColor: colors.background,
          },
          animation: "slide_from_right", // Elegant transition
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </View>
  );
}
