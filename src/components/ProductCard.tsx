import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { Product } from "../types/product";

type Props = {
  product: Product;
  onPress: () => void;
};

export default function ProductCard({ product, onPress }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      {product.thumbnail ? (
        <Image source={{ uri: product.thumbnail }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.noImage]}>
          <Text style={styles.muted}>No image</Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>

        <Text style={styles.category} numberOfLines={1}>
          {product.category}
        </Text>

        <Text style={styles.price}>$ {product.price.toFixed(2)}</Text>

        <View style={styles.bottomRow}>
          <Text style={styles.smallText}>
            Rating: {(product.rating ?? 0).toFixed(1)}
          </Text>

          <Text style={styles.smallText}>
            Stock: {product.stock ?? 0}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48.5%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8E4F0",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
  },
  image: {
    width: "100%",
    height: 145,
    resizeMode: "contain",
    backgroundColor: "#F8F7FA",
  },
  noImage: {
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 10,
  },
  title: {
    minHeight: 38,
    fontSize: 14,
    fontWeight: "700",
    color: "#2C2931",
  },
  category: {
    fontSize: 11,
    color: "#817C89",
    textTransform: "capitalize",
    marginTop: 3,
  },
  price: {
    fontSize: 18,
    fontWeight: "800",
    color: "#6842C2",
    marginTop: 7,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 7,
  },
  smallText: {
    fontSize: 10,
    color: "#69636F",
  },
  muted: {
    color: "#8B8792",
  },
});
