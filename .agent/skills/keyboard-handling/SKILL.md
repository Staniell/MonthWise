---
name: keyboard-handling
description: Standardized keyboard handling for React Native modals on Android and iOS
---

# Keyboard Handling Skill

This skill provides instructions for implementing a robust, consistent keyboard handling logic across all modals in the MonthWise application. This ensures that input fields and buttons are never obscured by the software keyboard, specifically addressing common quirks in React Native's standard `KeyboardAvoidingView` on Android.

## Core Implementation Pattern

Every modal containing inputs should follow this structural pattern:

### 1. State & Tracking

Track the keyboard height manually for Android to provide precise offset control.

```tsx
const [keyboardHeight, setKeyboardHeight] = useState(0);

useEffect(() => {
  const showListener = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", (e) =>
    setKeyboardHeight(e.endCoordinates.height),
  );
  const hideListener = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () =>
    setKeyboardHeight(0),
  );
  return () => {
    showListener.remove();
    hideListener.remove();
  };
}, []);
```

### 2. Modal Structure

Use a nested structure of `TouchableWithoutFeedback`, `View` (offset), `KeyboardAvoidingView`, and `ScrollView`.

```tsx
<Modal visible={isVisible} animationType="slide" transparent>
  {/* Layer 1: Tap outside to close */}
  <TouchableWithoutFeedback onPress={onClose}>
    <View style={[styles.overlay, Platform.OS === "android" && { paddingBottom: keyboardHeight }]}>
      {/* Layer 2: Tap inside to dismiss keyboard */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboardView}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.modal,
                { paddingBottom: Math.max(insets.bottom, layout.spacing.xxl) + layout.spacing.xxl },
              ]}
            >
              {/* Header & Content */}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </View>
  </TouchableWithoutFeedback>
</Modal>
```

### 3. Critical Styles

```tsx
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  keyboardView: {
    width: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end", // Keeps the modal at the bottom
  },
  modal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: layout.borderRadius.xl,
    borderTopRightRadius: layout.borderRadius.xl,
    padding: layout.spacing.l,
    maxHeight: "95%",
  },
});
```

## Guidelines for New Modals

- **Always include ScrollView**: Even if content is short, the keyboard might cover it on small devices. `ScrollView` with `justifyContent: 'flex-end'` ensures it stays accessible.
- **Aggressive Safe Area**: Use `Math.max(insets.bottom, layout.spacing.xxl) + layout.spacing.xxl` for bottom padding. This ensures clearance for both Android navigation bars and gesture indicators.
- **Dismiss Keyboard**: Ensure `TouchableWithoutFeedback` with `Keyboard.dismiss` wraps the content area to improve UX.
- **Android Specifics**: Use the `paddingBottom: keyboardHeight` on the overlay `View` only for Android. Set `behavior={undefined}` for `KeyboardAvoidingView` on Android when using this manual tracking method.
