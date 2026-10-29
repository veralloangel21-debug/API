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
import type { Product, Review } from "../types/product";

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

  const productImages =
    product.images && product.images.length > 0
      ? product.images
      : product.thumbnail
        ? [product.thumbnail]
        : [];

  const productInfo = getProductInformation(product);

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
          {/* 1. PRODUCT PICTURES */}
          <View style={styles.imageSection}>
            {productImages.length > 0 ? (
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
              >
                {productImages.map((imageUrl, index) => (
                  <View style={styles.imagePage} key={`${imageUrl}-${index}`}>
                    <Image source={{ uri: imageUrl }} style={styles.image} />

                    <View style={styles.imageCounter}>
                      <Text style={styles.imageCounterText}>
                        {index + 1}/{productImages.length}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={[styles.imagePage, styles.noImage]}>
                <Text style={styles.muted}>No product image</Text>
              </View>
            )}
          </View>

          {/* 2. PRODUCT TITLE */}
          <View style={styles.mainInfo}>
            <Text style={styles.title}>{product.title}</Text>

            <Text style={styles.price}>$ {product.price.toFixed(2)}</Text>

            <View style={styles.ratingRow}>
              <Text style={styles.ratingText}>
                Rating: {(product.rating ?? 0).toFixed(1)} / 5
              </Text>

              <Text style={styles.stockText}>
                {product.stock ?? 0} in stock
              </Text>
            </View>

            {product.discountPercentage !== undefined ? (
              <Text style={styles.discountText}>
                {product.discountPercentage}% discount
              </Text>
            ) : null}
          </View>

          {/* 3. PRODUCT ATTRIBUTES */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Information</Text>

            <View style={styles.infoCard}>
              {productInfo.map((item) => (
                <InfoRow
                  key={item.label}
                  label={item.label}
                  value={item.value}
                />
              ))}
            </View>
          </View>

          {/* 4. PRODUCT DESCRIPTION */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Description</Text>

            <View style={styles.descriptionCard}>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <Pressable style={styles.editButton} onPress={onEdit}>
              <Text style={styles.actionText}>Edit Product</Text>
            </Pressable>

            <Pressable style={styles.deleteButton} onPress={onDelete}>
              <Text style={styles.actionText}>Delete</Text>
            </Pressable>
          </View>

          {/* REVIEWS */}
          <View style={styles.section}>
            <View style={styles.reviewTitleRow}>
              <Text style={styles.sectionTitle}>Customer Reviews</Text>

              <Text style={styles.reviewCount}>
                {product.reviews?.length ?? 0} review(s)
              </Text>
            </View>

            {product.reviews?.length ? (
              product.reviews.map((review, index) => (
                <ReviewCard
                  key={`${review.reviewerEmail ?? "review"}-${index}`}
                  review={review}
                  productTitle={product.title}
                />
              ))
            ) : (
              <View style={styles.emptyReviewCard}>
                <Text style={styles.muted}>No reviews available.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function ReviewCard({
  review,
  productTitle,
}: {
  review: Review;
  productTitle: string;
}) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewerRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(review.reviewerName ?? "C").charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.reviewerInfo}>
          <Text style={styles.reviewerName}>
            {review.reviewerName ?? "Customer"}
          </Text>

          <Text style={styles.reviewerEmail}>
            {review.reviewerEmail ?? "Email not provided"}
          </Text>
        </View>
      </View>

      <Text style={styles.reviewRating}>
        {getRatingText(review.rating)}
      </Text>

      <Text style={styles.orderedText}>
        Ordered: {productTitle}
      </Text>

      <Text style={styles.reviewComment}>{review.comment}</Text>

      {review.date ? (
        <Text style={styles.reviewDate}>
          {new Date(review.date).toLocaleDateString()}
        </Text>
      ) : null}
    </View>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function getProductInformation(product: Product) {
  const info: { label: string; value: string }[] = [];

  addInfo(info, "Category", product.category);
  addInfo(info, "Brand", product.brand);
  addInfo(info, "Stock", product.stock);
  addInfo(info, "SKU", product.sku);
  addInfo(info, "Weight", product.weight);
  addInfo(info, "Tags", product.tags?.join(", "));
  addInfo(info, "Warranty", product.warrantyInformation);
  addInfo(info, "Shipping", product.shippingInformation);
  addInfo(info, "Availability", product.availabilityStatus);
  addInfo(info, "Return Policy", product.returnPolicy);
  addInfo(info, "Minimum Order", product.minimumOrderQuantity);

  if (product.dimensions) {
    const dimensions = [
      product.dimensions.width !== undefined
        ? `Width: ${product.dimensions.width}`
        : "",
      product.dimensions.height !== undefined
        ? `Height: ${product.dimensions.height}`
        : "",
      product.dimensions.depth !== undefined
        ? `Depth: ${product.dimensions.depth}`
        : "",
    ]
      .filter(Boolean)
      .join(", ");

    addInfo(info, "Dimensions", dimensions);
  }

  // Include any other API fields that are not already shown elsewhere.
  const hiddenKeys = new Set([
    "id",
    "title",
    "description",
    "category",
    "price",
    "discountPercentage",
    "rating",
    "stock",
    "tags",
    "brand",
    "sku",
    "weight",
    "dimensions",
    "warrantyInformation",
    "shippingInformation",
    "availabilityStatus",
    "returnPolicy",
    "minimumOrderQuantity",
    "reviews",
    "thumbnail",
    "images",
    "meta",
  ]);

  for (const [key, value] of Object.entries(product)) {
    if (!hiddenKeys.has(key)) {
      addInfo(info, formatLabel(key), formatValue(value));
    }
  }

  return info;
}

function addInfo(
  list: { label: string; value: string }[],
  label: string,
  value: unknown
) {
  if (value === undefined || value === null || value === "") return;

  list.push({
    label,
    value: formatValue(value),
  });
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(", ");
  }

  if (typeof value === "object" && value !== null) {
    return Object.entries(value)
      .map(([key, item]) => `${formatLabel(key)}: ${String(item)}`)
      .join(", ");
  }

  return String(value);
}

function formatLabel(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function getRatingText(rating: number) {
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));
  return `${"★".repeat(rounded)}${"☆".repeat(5 - rounded)}  ${rating}/5`;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F3F8",
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
    paddingBottom: 45,
  },

  imageSection: {
    backgroundColor: "#FFFFFF",
  },
  imagePage: {
    width: 390,
    height: 300,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  image: {
    width: "92%",
    height: "92%",
    resizeMode: "contain",
  },
  imageCounter: {
    position: "absolute",
    right: 14,
    bottom: 12,
    backgroundColor: "rgba(45, 40, 50, 0.65)",
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  imageCounterText: {
    color: "#FFFFFF",
    fontSize: 11,
  },
  noImage: {
    width: "100%",
  },

  mainInfo: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#EEEAF2",
  },
  title: {
    fontSize: 21,
    fontWeight: "800",
    color: "#29252E",
    lineHeight: 28,
  },
  price: {
    color: "#6842C2",
    fontSize: 26,
    fontWeight: "800",
    marginTop: 8,
  },
  ratingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 9,
  },
  ratingText: {
    color: "#5C5661",
    fontSize: 13,
  },
  stockText: {
    color: "#817B86",
    fontSize: 13,
  },
  discountText: {
    color: "#C84D55",
    marginTop: 7,
    fontWeight: "700",
  },

  section: {
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#2D2931",
  },
  infoCard: {
    marginTop: 10,
  },
  infoRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEAF2",
  },
  infoLabel: {
    width: 120,
    color: "#88818D",
    fontSize: 13,
  },
  infoValue: {
    flex: 1,
    color: "#403A44",
    fontSize: 13,
    lineHeight: 19,
  },

  descriptionCard: {
    marginTop: 10,
  },
  description: {
    color: "#4F4953",
    lineHeight: 21,
    fontSize: 14,
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
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

  reviewTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewCount: {
    color: "#8B8590",
    fontSize: 12,
  },
  reviewCard: {
    marginTop: 12,
    paddingTop: 4,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EDE8F1",
  },
  reviewerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#ECE7F8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarText: {
    color: "#6842C2",
    fontWeight: "800",
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    color: "#332F37",
    fontWeight: "700",
  },
  reviewerEmail: {
    color: "#96909A",
    fontSize: 11,
    marginTop: 2,
  },
  reviewRating: {
    color: "#E6A500",
    marginTop: 8,
    fontSize: 13,
  },
  orderedText: {
    color: "#8C8590",
    fontSize: 12,
    marginTop: 7,
  },
  reviewComment: {
    color: "#4B4650",
    marginTop: 8,
    lineHeight: 20,
    fontSize: 14,
  },
  reviewDate: {
    color: "#A09AA4",
    fontSize: 11,
    marginTop: 8,
  },
  emptyReviewCard: {
    marginTop: 10,
    paddingVertical: 18,
  },
  muted: {
    color: "#8B8590",
  },
});
