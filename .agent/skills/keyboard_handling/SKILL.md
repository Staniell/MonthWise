---
name: keyboard_handling
description: Best practices for handling keyboard overlap in React Native modals for MonthWise.
---

# Keyboard Handling & Safe Area Patterns

## Safe Area Setup

The app uses `react-native-safe-area-context` at the root level. Reference [\_layout.tsx](file:///c:/Users/giost/OneDrive/Desktop/MonthWise/app/_layout.tsx):

```tsx
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

// In RootLayout:
<SafeAreaProvider>
  <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["bottom"]}>
    {/* App content (Stack navigator, etc.) */}
  </SafeAreaView>
</SafeAreaProvider>;
```

### Key Points

- **`SafeAreaProvider`**: Wraps the entire app, provides inset context
- **`SafeAreaView`**: Apply with `edges={["bottom"]}` to handle home indicator
- **Modals**: Since modals render within this hierarchy, they inherit safe area context
- **For custom positioning**: Use `useSafeAreaInsets()` hook if needed

```tsx
import { useSafeAreaInsets } from "react-native-safe-area-context";

const insets = useSafeAreaInsets();
// Use insets.bottom, insets.top, etc. for manual padding
```

---

## Keyboard Handling in Modals (When Needed)

For modals with text inputs that may be covered by the keyboard, use this pattern from `AddExpenseModal.tsx`:

### 1. State and Listeners

Track keyboard height explicitly for Android padding:

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

### 2. Component Structure

```tsx
<Modal ...>
  <TouchableWithoutFeedback onPress={onClose}>
    {/* Overlay View with Android-specific padding */}
    <View style={[styles.overlay, Platform.OS === "android" && { paddingBottom: keyboardHeight }]}>

      {/* Dismiss keyboard when tapping outside inputs */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Card style={styles.modalContent}>
              {/* Form inputs here */}
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </View>
  </TouchableWithoutFeedback>
</Modal>
```

### 3. Required Styles

```tsx
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  keyboardView: {
    width: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: layout.borderRadius.xl,
    borderTopRightRadius: layout.borderRadius.xl,
    padding: layout.spacing.l,
    paddingBottom: layout.spacing.xxl,
    maxHeight: "90%",
  },
});
```

---

## When to Apply This Pattern

**Apply keyboard handling when:**

- Modal has text inputs
- Users need to type while viewing the input field
- Form fields may be near the bottom of the modal

**Skip keyboard handling when:**

- Modal has no text inputs
- Modal only has buttons/selection UI
- Modal is a simple confirmation dialog

---

## Why This Works

- **iOS**: `KeyboardAvoidingView` with `behavior="padding"` handles the shift natively
- **Android**: Manual `paddingBottom` based on `keyboardHeight` provides reliable shift
- **ScrollView**: Ensures form is scrollable when pushed up by keyboard
- **TouchableWithoutFeedback**: Enables closing modal by tapping overlay and dismissing keyboard
