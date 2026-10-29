import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  title: string;
  data: Record<string, unknown> | null;
  onClose: () => void;
};

export default function ApiResponseModal({
  visible,
  title,
  data,
  onClose,
}: Props) {
  const entries = data ? Object.entries(data) : [];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>Request completed successfully.</Text>

          <ScrollView style={styles.scroll}>
            {entries.map(([key, value]) => (
              <View style={styles.row} key={key}>
                <Text style={styles.label}>{formatLabel(key)}:</Text>
                <Text style={styles.value}>{formatValue(value)}</Text>
              </View>
            ))}
          </ScrollView>

          <Pressable style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function formatLabel(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "";

  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(", ");
  }

  if (typeof value === "object") {
    return Object.entries(value)
      .map(([key, item]) => `${formatLabel(key)}: ${String(item)}`)
      .join(", ");
  }

  return String(value);
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(25, 20, 32, 0.45)",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    maxHeight: "80%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
  },
  title: {
    color: "#6842C2",
    fontSize: 21,
    fontWeight: "800",
  },
  subtitle: {
    color: "#817C89",
    marginTop: 3,
    marginBottom: 12,
  },
  scroll: {
    maxHeight: 420,
  },
  row: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEAF3",
  },
  label: {
    color: "#343038",
    fontWeight: "700",
    marginBottom: 2,
  },
  value: {
    color: "#5E5863",
    lineHeight: 19,
  },
  button: {
    backgroundColor: "#6842C2",
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 14,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
});
