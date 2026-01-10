import { colors, layout } from "@/theme";
import React, { Component, ErrorInfo, ReactNode } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { AppText } from "./AppText";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch JavaScript errors
 * anywhere in the child component tree and display a fallback UI.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <AppText variant="heading2" align="center" style={styles.emoji}>
            😵
          </AppText>
          <AppText variant="heading3" align="center" style={styles.title}>
            Something went wrong
          </AppText>
          <AppText variant="body" color={colors.textMuted} align="center" style={styles.message}>
            An unexpected error occurred. Please try again.
          </AppText>
          {__DEV__ && this.state.error && (
            <AppText variant="small" color={colors.danger} style={styles.errorDetail}>
              {this.state.error.message}
            </AppText>
          )}
          <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
            <AppText variant="bodyMedium" color={colors.primaryForeground}>
              Try Again
            </AppText>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: layout.spacing.xl,
  },
  emoji: {
    fontSize: 64,
    marginBottom: layout.spacing.m,
  },
  title: {
    marginBottom: layout.spacing.s,
  },
  message: {
    marginBottom: layout.spacing.xl,
    maxWidth: 280,
  },
  errorDetail: {
    marginBottom: layout.spacing.l,
    padding: layout.spacing.m,
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.m,
    maxWidth: 300,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: layout.spacing.m,
    paddingHorizontal: layout.spacing.xl,
    borderRadius: layout.borderRadius.full,
  },
});
