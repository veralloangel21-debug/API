import type { Dispatch, SetStateAction } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ProductForm } from "../types/product";

type Props = {
  visible: boolean;
  title: string;
  method: "POST" | "PATCH";
  form: ProductForm;
  setForm: Dispatch<SetStateAction<ProductForm>>;
  loading: boolean;
  onClose: () => void;
  onSubmit: () => void;
};

export default function ProductFormModal({
  visible,
  title,
  method,
  form,
  setForm,
  loading,
  onClose,
  onSubmit,
}: Props) {
  const changeField = (field: keyof ProductForm, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={onClose}>
            <Text style={styles.headerButton}>Cancel</Text>
          </Pressable>

          <Text style={styles.headerTitle}>{title}</Text>

          <View style={styles.spacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.method}>{method} Request</Text>

          <Field
            label="Product Name"
            value={form.title}
            placeholder="Example: Wireless Mouse"
            onChangeText={(value) => changeField("title", value)}
          />

          <Field
            label="Brand"
            value={form.brand}
            placeholder="Example: Tech Brand"
            onChangeText={(value) => changeField("brand", value)}
          />

          <Field
            label="Category"
            value={form.category}
            placeholder="Example: accessories"
            onChangeText={(value) => changeField("category", value)}
          />

          <Field
            label="Price"
            value={form.price}
            placeholder="49.99"
            keyboardType="decimal-pad"
            onChangeText={(value) => changeField("price", value)}
          />

          <Field
            label="Stock"
            value={form.stock}
            placeholder="10"
            keyboardType="numeric"
            onChangeText={(value) => changeField("stock", value)}
          />

          <Field
            label="Description"
            value={form.description}
            placeholder="Enter product description"
            multiline
            onChangeText={(value) => changeField("description", value)}
          />

          <Pressable
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={onSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>
                {method === "POST" ? "Create Product" : "Update Product"}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

type FieldProps = {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "numeric" | "decimal-pad";
  multiline?: boolean;
};

function Field({
  label,
  value,
  placeholder,
  onChangeText,
  keyboardType = "default",
  multiline = false,
}: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9A95A1"
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={[styles.input, multiline && styles.textArea]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F5FC",
  },
  header: {
    height: 58,
    backgroundColor: "#6842C2",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerButton: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },
  spacer: {
    width: 45,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  method: {
    color: "#6842C2",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 18,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    color: "#353139",
    fontWeight: "700",
    marginBottom: 6,
  },
  input: {
    height: 48,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDD8E8",
    borderRadius: 10,
    paddingHorizontal: 12,
    color: "#26222B",
  },
  textArea: {
    height: 105,
    paddingTop: 12,
  },
  submitButton: {
    backgroundColor: "#6842C2",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
});
