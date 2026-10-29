import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Product } from "../types/product";

type Props = {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export default function ProductDetailsModal({
  visible,
  product,
  onClose,
  onEdit,
  onDelete,
}: Props) {
  if (!product) return null;

  const productEntries = Object.entries(product).filter(
    ([key]) => key !== "meta" && key !== "reviews"
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={onClose}>
            <Text style={styles.headerButton}>Back</Text>
          </Pressable>

          <Text style={styles.headerTitle}>Product Details</Text>

          <View style={styles.spacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {product.thumbnail ? (
            <Image source={{ uri: product.thumbnail }} style={styles.image} />
          ) : null}

          <Text style={styles.title}>{product.title}</Text>
          <Text style={styles.category}>{product.category}</Text>
          <Text style={styles.price}>$ {product.price.toFixed(2)}</Text>

          <View style={styles.summaryRow}>
            <Summary label="Rating" value={`${(product.rating ?? 0).toFixed(1)} / 5`} />
            <Summary label="Stock" value={String(product.stock ?? 0)} />
            <Summary label="Brand" value={product.brand ?? "N/A"} />
          </View>

          <Text style={styles.heading}>Description</Text>
          <View style={styles.box}>
            <Text style={styles.normalText}>{product.description}</Text>
          </View>

          <View style={styles.actionRow}>
            <Pressable style={styles.editButton} onPress={onEdit}>
              <Text style={styles.actionText}>Edit</Text>
            </Pressable>

            <Pressable style={styles.deleteButton} onPress={onDelete}>
              <Text style={styles.actionText}>Delete</Text>
            </Pressable>
          </View>

          <Text style={styles.heading}>Customer Reviews</Text>

          {product.reviews?.length ? (
            product.reviews.map((review, index) => (
              <View
                style={styles.reviewBox}
                key={`${review.reviewerEmail ?? "review"}-${index}`}
              >
                <Row label="Name" value={review.reviewerName ?? "Not provided"} />
                <Row label="Email" value={review.reviewerEmail ?? "Not provided"} />
                <Row label="Ordered" value={product.title} />
                <Row label="Rating" value={`${review.rating}/5`} />
                <Row label="Comment" value={review.comment} />

                {review.date ? (
                  <Row
                    label="Date"
                    value={new Date(review.date).toLocaleDateString()}
                  />
                ) : null}
              </View>
            ))
          ) : (
            <View style={styles.box}>
              <Text style={styles.muted}>No reviews available.</Text>
            </View>
          )}

          <Text style={styles.heading}>All Product Data</Text>
          <Text style={styles.note}>
            All product response fields are shown except meta. Reviews are shown above.
          </Text>

          <View style={styles.dataBox}>
            {productEntries.map(([key, value]) => (
              <Row
                key={key}
                label={formatLabel(key)}
                value={formatValue(value)}
              />
            ))}

            <Row label="Reviews" value="Shown in Customer Reviews above" />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryBox}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}:</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
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
    width: 40,
  },
  content: {
    padding: 16,
    paddingBottom: 45,
  },
  image: {
    width: "100%",
    height: 250,
    resizeMode: "contain",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#29252E",
    marginTop: 14,
  },
  category: {
    color: "#817C89",
    textTransform: "capitalize",
    marginTop: 4,
  },
  price: {
    color: "#6842C2",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7E2EF",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 10,
    color: "#88828E",
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#343038",
    marginTop: 3,
  },
  heading: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2C2830",
    marginTop: 22,
    marginBottom: 8,
  },
  box: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7E2EF",
    borderRadius: 10,
    padding: 12,
  },
  normalText: {
    color: "#55505A",
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  editButton: {
    flex: 1,
    backgroundColor: "#6842C2",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#D64B54",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  actionText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  reviewBox: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7E2EF",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  dataBox: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7E2EF",
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  row: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EDF5",
  },
  rowLabel: {
    fontWeight: "700",
    color: "#343038",
    marginBottom: 2,
  },
  rowValue: {
    color: "#5E5863",
    lineHeight: 19,
  },
  note: {
    color: "#817C89",
    fontSize: 12,
    marginBottom: 8,
  },
  muted: {
    color: "#88828E",
  },
});
