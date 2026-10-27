import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const API_URL = "https://dummyjson.com/products";

type Review = {
  rating: number;
  comment: string;
  date?: string;
  reviewerName?: string;
  reviewerEmail?: string;
};

type Product = {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage?: number;
  rating?: number;
  stock?: number;
  brand?: string;
  thumbnail?: string;
  images?: string[];
  reviews?: Review[];
  meta?: unknown;
  [key: string]: unknown;
};

type ProductsResponse = {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
};

type ProductForm = {
  title: string;
  brand: string;
  category: string;
  price: string;
  stock: string;
  description: string;
};

const emptyForm: ProductForm = {
  title: "",
  brand: "",
  category: "",
  price: "",
  stock: "",
  description: "",
};

function removeMeta(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(removeMeta);

  if (value && typeof value === "object") {
    const cleaned: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(value)) {
      if (key !== "meta") cleaned[key] = removeMeta(item);
    }

    return cleaned;
  }

  return value;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    const message =
      typeof data?.message === "string"
        ? data.message
        : `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data as T;
}

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [localIds, setLocalIds] = useState<number[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [detailsVisible, setDetailsVisible] = useState(false);
  const [addVisible, setAddVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [responseVisible, setResponseVisible] = useState(false);

  const [addForm, setAddForm] = useState<ProductForm>(emptyForm);
  const [editForm, setEditForm] = useState<ProductForm>(emptyForm);

  const [responseTitle, setResponseTitle] = useState("API Response");
  const [apiResponse, setApiResponse] = useState<unknown>(null);

  useEffect(() => {
    getProducts();
  }, []);

  // GET: retrieve products from DummyJSON.
  const getProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await request<ProductsResponse>(`${API_URL}?limit=100`);
      setProducts(data.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load products.");
    } finally {
      setLoading(false);
    }
  };

  // GET: retrieve one product so details, rating, and reviews can be shown.
  const openProduct = async (product: Product) => {
    try {
      setActionLoading(true);
      setError("");

      if (localIds.includes(product.id)) {
        setSelectedProduct(product);
      } else {
        const data = await request<Product>(`${API_URL}/${product.id}`);
        setSelectedProduct(data);
      }

      setDetailsVisible(true);
    } catch (err) {
      Alert.alert("GET Error", err instanceof Error ? err.message : "Unable to open product.");
    } finally {
      setActionLoading(false);
    }
  };

  // POST: create a product. DummyJSON simulates the save, so we also add it locally.
  const addProduct = async () => {
    if (!addForm.title.trim() || !addForm.price.trim()) {
      Alert.alert("Missing information", "Product name and price are required.");
      return;
    }

    try {
      setActionLoading(true);

      const body = {
        title: addForm.title.trim(),
        brand: addForm.brand.trim(),
        category: addForm.category.trim() || "general",
        price: Number(addForm.price),
        stock: Number(addForm.stock) || 0,
        description: addForm.description.trim(),
      };

      const created = await request<Product>(`${API_URL}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const localId = Date.now();
      const localProduct: Product = {
        ...created,
        ...body,
        id: localId,
        rating: created.rating ?? 0,
        reviews: created.reviews ?? [],
      };

      setProducts((current) => [localProduct, ...current]);
      setLocalIds((current) => [...current, localId]);
      setAddForm(emptyForm);
      setAddVisible(false);

      showResponse("POST Response", created);
    } catch (err) {
      Alert.alert("POST Error", err instanceof Error ? err.message : "Unable to add product.");
    } finally {
      setActionLoading(false);
    }
  };

  const openEdit = () => {
    if (!selectedProduct) return;

    setEditForm({
      title: selectedProduct.title,
      brand: selectedProduct.brand ?? "",
      category: selectedProduct.category,
      price: String(selectedProduct.price),
      stock: String(selectedProduct.stock ?? 0),
      description: selectedProduct.description,
    });

    setEditVisible(true);
  };

  // PATCH: update an existing product. Existing API records send a PATCH request.
  const updateProduct = async () => {
    if (!selectedProduct) return;

    if (!editForm.title.trim() || !editForm.price.trim()) {
      Alert.alert("Missing information", "Product name and price are required.");
      return;
    }

    try {
      setActionLoading(true);

      const changes = {
        title: editForm.title.trim(),
        brand: editForm.brand.trim(),
        category: editForm.category.trim() || "general",
        price: Number(editForm.price),
        stock: Number(editForm.stock) || 0,
        description: editForm.description.trim(),
      };

      let responseData: Product;

      if (localIds.includes(selectedProduct.id)) {
        responseData = { ...selectedProduct, ...changes };
      } else {
        responseData = await request<Product>(`${API_URL}/${selectedProduct.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(changes),
        });
      }

      const updatedProduct = { ...selectedProduct, ...responseData, ...changes };

      setProducts((current) =>
        current.map((product) =>
          product.id === selectedProduct.id ? updatedProduct : product
        )
      );

      setSelectedProduct(updatedProduct);
      setEditVisible(false);

      showResponse("PATCH Response", responseData);
    } catch (err) {
      Alert.alert("PATCH Error", err instanceof Error ? err.message : "Unable to update product.");
    } finally {
      setActionLoading(false);
    }
  };

  // DELETE: delete an existing product and remove it from local state.
  const confirmDelete = () => {
    if (!selectedProduct) return;

    Alert.alert(
      "Delete product",
      `Delete "${selectedProduct.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: deleteProduct,
        },
      ]
    );
  };

  const deleteProduct = async () => {
    if (!selectedProduct) return;

    try {
      setActionLoading(true);

      let responseData: unknown;

      if (localIds.includes(selectedProduct.id)) {
        responseData = { ...selectedProduct, isDeleted: true };
      } else {
        responseData = await request<Product>(`${API_URL}/${selectedProduct.id}`, {
          method: "DELETE",
        });
      }

      setProducts((current) =>
        current.filter((product) => product.id !== selectedProduct.id)
      );

      setLocalIds((current) => current.filter((id) => id !== selectedProduct.id));
      setDetailsVisible(false);
      setSelectedProduct(null);

      showResponse("DELETE Response", responseData);
    } catch (err) {
      Alert.alert("DELETE Error", err instanceof Error ? err.message : "Unable to delete product.");
    } finally {
      setActionLoading(false);
    }
  };

  const showResponse = (title: string, data: unknown) => {
    setResponseTitle(title);
    setApiResponse(removeMeta(data));
    setResponseVisible(true);
  };

  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map((product) => product.category)));
    return ["All", ...unique.slice(0, 8)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        product.title.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        (product.brand ?? "").toLowerCase().includes(query);

      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  const renderProduct = ({ item }: { item: Product }) => (
    <Pressable style={styles.card} onPress={() => openProduct(item)}>
      {item.thumbnail ? (
        <Image source={{ uri: item.thumbnail }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, styles.noImage]}>
          <Text style={styles.muted}>No image</Text>
        </View>
      )}

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>

        <Text style={styles.categoryText} numberOfLines={1}>
          {item.category}
        </Text>

        <Text style={styles.price}>$ {item.price.toFixed(2)}</Text>

        <View style={styles.cardFooter}>
          <Text style={styles.rating}>Rating: {(item.rating ?? 0).toFixed(1)}</Text>
          <Text style={styles.stock}>Stock {item.stock ?? 0}</Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#6842C2" />

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.logo}>VioletCart</Text>
            <Text style={styles.subtitle}>API Products Activity</Text>
          </View>

          <Pressable style={styles.addButton} onPress={() => setAddVisible(true)}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </Pressable>
        </View>

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search products..."
            placeholderTextColor="#8D8997"
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Text style={styles.clearText}>×</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Menu</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((category) => {
            const active = category === selectedCategory;

            return (
              <Pressable
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {category.replaceAll("-", " ")}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.productsHeader}>
        <Text style={styles.productsTitle}>Products</Text>
        <View style={styles.productsActions}>
          <Text style={styles.count}>{filteredProducts.length} items</Text>
          <Pressable style={styles.refreshButton} onPress={getProducts}>
            <Text style={styles.refreshText}>GET ↻</Text>
          </Pressable>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={getProducts}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6842C2" />
          <Text style={styles.loadingText}>GET: Loading products...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.columns}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.muted}>Try another search or category.</Text>
            </View>
          }
        />
      )}

      {actionLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#6842C2" />
            <Text style={styles.loadingText}>Processing request...</Text>
          </View>
        </View>
      )}

      <Modal visible={detailsVisible} animationType="slide" onRequestClose={() => setDetailsVisible(false)}>
        <SafeAreaView style={styles.modalScreen}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setDetailsVisible(false)}>
              <Text style={styles.modalLink}>← Back</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Product Details</Text>
            <View style={styles.headerSpacer} />
          </View>

          {selectedProduct && (
            <ScrollView contentContainerStyle={styles.detailContent}>
              {selectedProduct.thumbnail ? (
                <Image
                  source={{ uri: selectedProduct.thumbnail }}
                  style={styles.detailImage}
                />
              ) : null}

              <Text style={styles.detailTitle}>{selectedProduct.title}</Text>
              <Text style={styles.detailCategory}>{selectedProduct.category}</Text>
              <Text style={styles.detailPrice}>$ {selectedProduct.price.toFixed(2)}</Text>

              <View style={styles.infoRow}>
                <InfoBox label="Rating" value={`${(selectedProduct.rating ?? 0).toFixed(1)} / 5`} />
                <InfoBox label="Stock" value={String(selectedProduct.stock ?? 0)} />
                <InfoBox label="Brand" value={selectedProduct.brand ?? "N/A"} />
              </View>

              <Text style={styles.detailHeading}>Description</Text>
              <View style={styles.whiteBox}>
                <Text style={styles.description}>{selectedProduct.description}</Text>
              </View>

              <View style={styles.actionRow}>
                <Pressable style={styles.editButton} onPress={openEdit}>
                  <Text style={styles.actionText}>PATCH / Edit</Text>
                </Pressable>

                <Pressable style={styles.deleteButton} onPress={confirmDelete}>
                  <Text style={styles.actionText}>DELETE</Text>
                </Pressable>
              </View>

              <Text style={styles.detailHeading}>Customer Reviews</Text>

              {selectedProduct.reviews?.length ? (
                selectedProduct.reviews.map((review, index) => (
                  <View style={styles.reviewCard} key={`${review.reviewerEmail ?? "review"}-${index}`}>
                    <Text style={styles.reviewDetail}>
                      <Text style={styles.reviewLabel}>Name: </Text>
                      {review.reviewerName ?? "Not provided"}
                    </Text>

                    <Text style={styles.reviewDetail}>
                      <Text style={styles.reviewLabel}>Email: </Text>
                      {review.reviewerEmail ?? "Not provided"}
                    </Text>

                    <Text style={styles.reviewDetail}>
                      <Text style={styles.reviewLabel}>Ordered: </Text>
                      {selectedProduct.title}
                    </Text>

                    <Text style={styles.reviewDetail}>
                      <Text style={styles.reviewLabel}>Rating: </Text>
                      {review.rating}/5
                    </Text>

                    <Text style={styles.reviewComment}>
                      <Text style={styles.reviewLabel}>Comment: </Text>
                      {review.comment}
                    </Text>

                    {review.date ? (
                      <Text style={styles.reviewDate}>
                        Date: {new Date(review.date).toLocaleDateString()}
                      </Text>
                    ) : null}
                  </View>
                ))
              ) : (
                <View style={styles.whiteBox}>
                  <Text style={styles.muted}>No reviews available.</Text>
                </View>
              )}

              <Text style={styles.detailHeading}>All Product Data</Text>
              <Text style={styles.note}>Complete GET product data except meta.</Text>
              <ProductDataView product={selectedProduct} />
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      <Modal visible={addVisible} animationType="slide" onRequestClose={() => setAddVisible(false)}>
        <FormScreen
          title="Add Product"
          method="POST"
          description="Create a new product using POST /products/add."
          form={addForm}
          setForm={setAddForm}
          onCancel={() => setAddVisible(false)}
          onSubmit={addProduct}
          submitText="Create Product (POST)"
        />
      </Modal>

      <Modal visible={editVisible} animationType="slide" onRequestClose={() => setEditVisible(false)}>
        <FormScreen
          title="Edit Product"
          method="PATCH"
          description="Update the selected product using PATCH /products/:id."
          form={editForm}
          setForm={setEditForm}
          onCancel={() => setEditVisible(false)}
          onSubmit={updateProduct}
          submitText="Update Product (PATCH)"
        />
      </Modal>

      <Modal
        visible={responseVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setResponseVisible(false)}
      >
        <View style={styles.responseOverlay}>
          <View style={styles.responseCard}>
            <Text style={styles.responseTitle}>{responseTitle}</Text>
            <Text style={styles.note}>Successful API response. The meta field is excluded.</Text>

            <ScrollView style={styles.responseScroll}>
              <JsonBox value={apiResponse} />
            </ScrollView>

            <Pressable style={styles.primaryButton} onPress={() => setResponseVisible(false)}>
              <Text style={styles.primaryButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

type FormScreenProps = {
  title: string;
  method: string;
  description: string;
  form: ProductForm;
  setForm: React.Dispatch<React.SetStateAction<ProductForm>>;
  onCancel: () => void;
  onSubmit: () => void;
  submitText: string;
};

function FormScreen({
  title,
  method,
  description,
  form,
  setForm,
  onCancel,
  onSubmit,
  submitText,
}: FormScreenProps) {
  return (
    <SafeAreaView style={styles.modalScreen}>
      <View style={styles.modalHeader}>
        <Pressable onPress={onCancel}>
          <Text style={styles.modalLink}>Cancel</Text>
        </Pressable>
        <Text style={styles.modalTitle}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.formContent}>
        <Text style={styles.methodBadge}>{method} Request</Text>
        <Text style={styles.formDescription}>{description}</Text>

        <FormInput
          label="Product Name"
          placeholder="Example: Wireless Mouse"
          value={form.title}
          onChangeText={(title) => setForm((current) => ({ ...current, title }))}
        />

        <FormInput
          label="Brand"
          placeholder="Example: Violet Tech"
          value={form.brand}
          onChangeText={(brand) => setForm((current) => ({ ...current, brand }))}
        />

        <FormInput
          label="Category"
          placeholder="Example: accessories"
          value={form.category}
          onChangeText={(category) => setForm((current) => ({ ...current, category }))}
        />

        <FormInput
          label="Price"
          placeholder="49.99"
          keyboardType="decimal-pad"
          value={form.price}
          onChangeText={(price) => setForm((current) => ({ ...current, price }))}
        />

        <FormInput
          label="Stock"
          placeholder="10"
          keyboardType="numeric"
          value={form.stock}
          onChangeText={(stock) => setForm((current) => ({ ...current, stock }))}
        />

        <FormInput
          label="Description"
          placeholder="Enter product description"
          multiline
          value={form.description}
          onChangeText={(description) =>
            setForm((current) => ({ ...current, description }))
          }
        />

        <Pressable style={styles.primaryButton} onPress={onSubmit}>
          <Text style={styles.primaryButtonText}>{submitText}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

type FormInputProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "decimal-pad";
  multiline?: boolean;
};

function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline = false,
}: FormInputProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9994A4"
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={[styles.input, multiline && styles.textArea]}
      />
    </View>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoBox}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function ProductDataView({ product }: { product: Product }) {
  const entries = Object.entries(product).filter(
    ([key]) => key !== "meta" && key !== "reviews"
  );

  return (
    <View style={styles.productDataBox}>
      {entries.map(([key, value]) => {
        let displayValue = "";

        if (Array.isArray(value)) {
          displayValue = value.join(", ");
        } else if (value && typeof value === "object") {
          displayValue = Object.entries(value)
            .map(([subKey, subValue]) => `${subKey}: ${String(subValue)}`)
            .join(", ");
        } else {
          displayValue = String(value ?? "");
        }

        return (
          <View key={key} style={styles.productDataRow}>
            <Text style={styles.productDataLabel}>{formatLabel(key)}:</Text>
            <Text style={styles.productDataValue}>{displayValue}</Text>
          </View>
        );
      })}

      <View style={styles.productDataRow}>
        <Text style={styles.productDataLabel}>Reviews:</Text>
        <Text style={styles.productDataValue}>Shown in Customer Reviews above</Text>
      </View>
    </View>
  );
}

function formatLabel(value: string) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function JsonBox({ value }: { value: unknown }) {
  return (
    <View style={styles.jsonBox}>
      <Text selectable style={styles.jsonText}>
        {JSON.stringify(value, null, 2)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F5FC",
  },
  header: {
    backgroundColor: "#6842C2",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  logo: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "900",
  },
  subtitle: {
    color: "#E7DFFF",
    marginTop: 2,
    fontSize: 12,
  },
  addButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addButtonText: {
    color: "#6842C2",
    fontWeight: "800",
  },
  searchBox: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 13,
  },
  searchIcon: {
    fontSize: 21,
    color: "#6842C2",
    marginRight: 7,
  },
  searchInput: {
    flex: 1,
    color: "#25222B",
    fontSize: 15,
  },
  clearText: {
    fontSize: 24,
    color: "#8D8997",
    paddingHorizontal: 4,
  },
  menuSection: {
    backgroundColor: "#FFFFFF",
    paddingLeft: 14,
    paddingTop: 13,
    paddingBottom: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#ECE8F3",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#25222B",
    marginBottom: 9,
  },
  chip: {
    backgroundColor: "#F0EBFA",
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 20,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: "#6842C2",
  },
  chipText: {
    color: "#6842C2",
    fontWeight: "700",
    textTransform: "capitalize",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  productsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 7,
  },
  productsTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#25222B",
  },
  productsActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  count: {
    color: "#7C7785",
    fontSize: 12,
  },
  refreshButton: {
    backgroundColor: "#ECE5FA",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  refreshText: {
    color: "#6842C2",
    fontSize: 11,
    fontWeight: "800",
  },
  list: {
    paddingHorizontal: 10,
    paddingBottom: 40,
  },
  columns: {
    justifyContent: "space-between",
  },
  card: {
    width: "48.5%",
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ECE8F3",
  },
  cardImage: {
    width: "100%",
    height: 150,
    resizeMode: "contain",
    backgroundColor: "#F8F7FA",
  },
  noImage: {
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    padding: 10,
  },
  cardTitle: {
    minHeight: 38,
    color: "#25222B",
    fontSize: 14,
    fontWeight: "800",
  },
  categoryText: {
    color: "#8B8792",
    fontSize: 11,
    textTransform: "capitalize",
    marginTop: 3,
  },
  price: {
    color: "#6842C2",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 8,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 7,
  },
  rating: {
    color: "#5B5662",
    fontSize: 11,
  },
  stock: {
    color: "#8B8792",
    fontSize: 11,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  loadingText: {
    color: "#6D6875",
    marginTop: 9,
    fontWeight: "600",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#37323E",
    marginBottom: 5,
  },
  muted: {
    color: "#8B8792",
  },
  errorBox: {
    backgroundColor: "#FFF0F0",
    borderColor: "#F4C4C4",
    borderWidth: 1,
    marginHorizontal: 14,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
  },
  errorText: {
    color: "#A52D3A",
  },
  retryText: {
    color: "#6842C2",
    fontWeight: "800",
    marginTop: 7,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(25, 18, 35, 0.28)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  loadingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  modalScreen: {
    flex: 1,
    backgroundColor: "#F7F5FC",
  },
  modalHeader: {
    minHeight: 58,
    backgroundColor: "#6842C2",
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalLink: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },
  headerSpacer: {
    width: 48,
  },
  detailContent: {
    padding: 16,
    paddingBottom: 50,
  },
  detailImage: {
    width: "100%",
    height: 270,
    resizeMode: "contain",
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
  },
  detailTitle: {
    color: "#25222B",
    fontSize: 25,
    fontWeight: "900",
    marginTop: 16,
  },
  detailCategory: {
    color: "#8B8792",
    textTransform: "capitalize",
    marginTop: 4,
  },
  detailPrice: {
    color: "#6842C2",
    fontSize: 30,
    fontWeight: "900",
    marginTop: 9,
  },
  infoRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 15,
  },
  infoBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8E3F0",
    padding: 11,
    borderRadius: 11,
    alignItems: "center",
  },
  infoLabel: {
    color: "#8B8792",
    fontSize: 11,
    marginBottom: 4,
  },
  infoValue: {
    color: "#37323E",
    fontWeight: "800",
    fontSize: 12,
  },
  detailHeading: {
    color: "#25222B",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 24,
    marginBottom: 9,
  },
  whiteBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 11,
    padding: 13,
    borderWidth: 1,
    borderColor: "#ECE8F3",
  },
  description: {
    color: "#57515E",
    lineHeight: 21,
  },
  actionRow: {
    flexDirection: "row",
    gap: 9,
    marginTop: 18,
  },
  editButton: {
    flex: 1,
    backgroundColor: "#6842C2",
    borderRadius: 11,
    paddingVertical: 14,
    alignItems: "center",
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#D34650",
    borderRadius: 11,
    paddingVertical: 14,
    alignItems: "center",
  },
  actionText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 13,
  },
  reviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 11,
    padding: 13,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: "#ECE8F3",
  },
  reviewDetail: {
    color: "#57515E",
    lineHeight: 20,
    marginBottom: 3,
  },
  reviewLabel: {
    color: "#37323E",
    fontWeight: "800",
  },
  reviewComment: {
    color: "#57515E",
    lineHeight: 20,
    marginTop: 5,
  },
  reviewDate: {
    color: "#9A95A1",
    fontSize: 11,
    marginTop: 7,
  },
  note: {
    color: "#77717E",
    fontSize: 12,
    marginBottom: 8,
  },
  productDataBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 11,
    padding: 13,
    borderWidth: 1,
    borderColor: "#ECE8F3",
  },
  productDataRow: {
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EDF5",
  },
  productDataLabel: {
    color: "#37323E",
    fontWeight: "800",
    marginBottom: 2,
  },
  productDataValue: {
    color: "#57515E",
    lineHeight: 19,
  },
  jsonBox: {
    backgroundColor: "#28252E",
    borderRadius: 11,
    padding: 13,
  },
  jsonText: {
    color: "#F5F2FA",
    fontSize: 11,
    lineHeight: 17,
  },
  formContent: {
    padding: 18,
    paddingBottom: 45,
  },
  methodBadge: {
    alignSelf: "flex-start",
    color: "#6842C2",
    backgroundColor: "#EEE8FA",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    fontWeight: "900",
    fontSize: 16,
  },
  formDescription: {
    color: "#77717E",
    marginTop: 9,
    marginBottom: 19,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 13,
  },
  inputLabel: {
    color: "#37323E",
    fontWeight: "800",
    marginBottom: 6,
  },
  input: {
    height: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DDD7E8",
    color: "#25222B",
    paddingHorizontal: 12,
  },
  textArea: {
    height: 105,
    paddingTop: 12,
  },
  primaryButton: {
    backgroundColor: "#6842C2",
    borderRadius: 11,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 9,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  responseOverlay: {
    flex: 1,
    backgroundColor: "rgba(23, 18, 31, 0.46)",
    justifyContent: "center",
    padding: 20,
  },
  responseCard: {
    maxHeight: "82%",
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 17,
  },
  responseTitle: {
    color: "#6842C2",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 5,
  },
  responseScroll: {
    maxHeight: 450,
  },
});
