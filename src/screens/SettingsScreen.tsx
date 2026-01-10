import { AppText, Button, Card } from "@/components/common";
import { exportAndShare, ImportError, pickAndImport, UpdateService } from "@/services";
import { useAppStore } from "@/stores";
import { colors, layout } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from "react-native";

export const SettingsScreen = () => {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const refreshData = useAppStore((state) => state.refreshData);
  const currency = useAppStore((state) => state.currency);
  const setCurrency = useAppStore((state) => state.setCurrency);
  const hideCents = useAppStore((state) => state.hideCents);
  const setHideCents = useAppStore((state) => state.setHideCents);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportAndShare();
    } catch (error) {
      Alert.alert("Export Failed", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    // Confirm before import
    Alert.alert("Import Data", "This will replace ALL existing data. Are you sure you want to continue?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Import",
        style: "destructive",
        onPress: async () => {
          setImporting(true);
          try {
            const result = await pickAndImport();
            if (result) {
              await refreshData();
              Alert.alert("Import Successful", result.message);
            }
          } catch (error) {
            if (error instanceof ImportError) {
              Alert.alert("Import Failed", error.message);
            } else {
              Alert.alert("Import Failed", "An unexpected error occurred");
            }
          } finally {
            setImporting(false);
          }
        },
      },
    ]);
  };

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    try {
      await UpdateService.checkForUpdateAsync();
    } finally {
      setCheckingUpdate(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <AppText variant="display" style={styles.title}>
        Settings
      </AppText>

      <Card style={styles.section}>
        <AppText variant="heading3" style={styles.sectionTitle}>
          Data Management
        </AppText>

        <Button
          title="Export Data"
          onPress={handleExport}
          loading={exporting}
          icon={<Ionicons name="download-outline" size={20} color={colors.primaryForeground} />}
          style={styles.button}
        />
        <AppText variant="caption" color={colors.textMuted} style={styles.hint}>
          Save all your data as a JSON file that you can backup or transfer.
        </AppText>

        <Button
          title="Import Data"
          variant="secondary"
          onPress={handleImport}
          loading={importing}
          icon={<Ionicons name="push-outline" size={20} color={colors.primary} />}
          style={styles.button}
        />
        <AppText variant="caption" color={colors.textMuted} style={styles.hint}>
          Restore data from a previously exported file. This will replace all existing data.
        </AppText>
      </Card>

      <Card style={styles.section}>
        <AppText variant="heading3" style={styles.sectionTitle}>
          Preferences
        </AppText>
        <AppText variant="body" color={colors.textMuted} style={{ marginBottom: layout.spacing.s }}>
          Default Currency
        </AppText>
        <View style={styles.currencyRow}>
          {["USD", "EUR", "GBP", "JPY", "PHP"].map((curr) => (
            <TouchableOpacity
              key={curr}
              onPress={() => setCurrency(curr)}
              style={[styles.currencyButton, currency === curr && styles.currencyButtonActive]}
            >
              <AppText variant="bodyMedium" color={currency === curr ? colors.primaryForeground : colors.text}>
                {curr}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.toggleRow}>
          <View>
            <AppText variant="body" color={colors.textMuted}>
              Hide Cents
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              Show whole numbers only
            </AppText>
          </View>
          <Switch
            value={hideCents}
            onValueChange={setHideCents}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.card}
          />
        </View>
      </Card>

      <Card style={styles.section}>
        <AppText variant="heading3" style={styles.sectionTitle}>
          About
        </AppText>
        <View style={styles.aboutRow}>
          <AppText variant="body" color={colors.textMuted}>
            Version
          </AppText>
          <AppText variant="bodyMedium">
            {Constants.expoConfig?.version} ({UpdateService.getUpdateId().slice(0, 8)})
          </AppText>
        </View>
        <View style={[styles.aboutRow, { marginTop: layout.spacing.s }]}>
          <AppText variant="body" color={colors.textMuted}>
            Channel
          </AppText>
          <AppText variant="bodyMedium">{UpdateService.getChannel()}</AppText>
        </View>

        <Button
          title="Check for Update"
          onPress={handleCheckUpdate}
          loading={checkingUpdate}
          style={{ marginTop: layout.spacing.m }}
          variant="secondary"
        />
      </Card>
      <View style={{ height: layout.spacing.xl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: layout.spacing.m,
    paddingBottom: layout.spacing.xxl,
  },
  title: {
    marginBottom: layout.spacing.l,
    marginTop: layout.spacing.m,
  },
  section: {
    marginBottom: layout.spacing.l,
    padding: layout.spacing.l,
  },
  sectionTitle: {
    marginBottom: layout.spacing.m,
  },
  button: {
    marginBottom: layout.spacing.s,
  },
  hint: {
    marginBottom: layout.spacing.l,
    paddingLeft: layout.spacing.xs,
  },
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  currencyRow: {
    flexDirection: "row",
    gap: layout.spacing.s,
    flexWrap: "wrap",
  },
  currencyButton: {
    paddingVertical: layout.spacing.s,
    paddingHorizontal: layout.spacing.m,
    borderRadius: layout.borderRadius.m,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currencyButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: layout.spacing.l,
    paddingTop: layout.spacing.l,
    borderTopWidth: 1,
    borderTopColor: colors.separator,
  },
});
