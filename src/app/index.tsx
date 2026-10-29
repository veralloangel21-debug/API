import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ApiResponseModal from "../components/ApiResponseModal";
import ProductCard from "../components/ProductCard";
import ProductDetailsModal from "../components/ProductDetailsModal";
import ProductFormModal from "../components/ProductFormModal";

import {
  createProduct,
  deleteProduct,
  getProduct,
  getProducts,
  updateProduct,
} from "../services/productApi";

import {
  emptyProductForm,
  type Product,
  type ProductForm,
} from "../types/product";

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [localProductIds, setLocalProductIds] = useState<number[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  const [detailsVisible, setDetailsVisible] = useState(false);
  const [addVisible, setAddVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [responseVisible, setResponseVisible] = useState(false);

  const [addForm, setAddForm] = useState<ProductForm>(emptyProductForm);
  const [editForm, setEditForm] = useState<ProductForm>(emptyProductForm);

  const [responseTitle, setResponseTitle] = useState("");
  const [responseData, setResponseData] =
    useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  // GET - retrieve all products.
  async function loadProducts() {
    try {
      setLoadingProducts(true);
      setError("");

      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingProducts(false);
    }
  }

  // GET - retrieve one selected product.
  async function openProduct(product: Product) {
    try {
      setWorking(true);
      setError("");

      if (localProductIds.includes(product.id)) {
        setSelectedProduct(product);
      } else {
        const data = await getProduct(product.id);
        setSelectedProduct(data);
      }

      setDetailsVisible(true);
    } catch (err) {
      Alert.alert("Unable to open product", getErrorMessage(err));
    } finally {
      setWorking(false);
    }
  }

  // POST - create a new product.
  async function handleAddProduct() {
    if (!addForm.title.trim() || !addForm.price.trim()) {
      Alert.alert("Missing information", "Product name and price are required.");
      return;
    }

    try {
      setWorking(true);

      const newProductData = formToProduct(addForm);
      const apiResponse = await createProduct(newProductData);

      // DummyJSON does not permanently save new products.
      // A local ID lets the new item stay visible in the app.
      const localId = Date.now();

      const localProduct: Product = {
        ...apiResponse,
        ...newProductData,
        id: localId,
        rating: apiResponse.rating ?? 0,
        reviews: apiResponse.reviews ?? [],
      };

      setProducts((current) => [localProduct, ...current]);
      setLocalProductIds((current) => [...current, localId]);

      setAddForm(emptyProductForm);
      setAddVisible(false);

      showResponse("POST Response", apiResponse);
    } catch (err) {
      Alert.alert("POST Error", getErrorMessage(err));
    } finally {
      setWorking(false);
    }
  }

  function openEditForm() {
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
  }

  // PATCH - update an existing product.
  async function handleUpdateProduct() {
    if (!selectedProduct) return;

    if (!editForm.title.trim() || !editForm.price.trim()) {
      Alert.alert("Missing information", "Product name and price are required.");
      return;
    }

    try {
      setWorking(true);

      const changes = formToProduct(editForm);
      let apiResponse: Product;

      if (localProductIds.includes(selectedProduct.id)) {
        // Products created through DummyJSON POST do not really exist on the server.
        apiResponse = {
          ...selectedProduct,
          ...changes,
        };
      } else {
        apiResponse = await updateProduct(selectedProduct.id, changes);
      }

      const updatedProduct: Product = {
        ...selectedProduct,
        ...apiResponse,
        ...changes,
      };

      setProducts((current) =>
        current.map((product) =>
          product.id === selectedProduct.id ? updatedProduct : product
        )
      );

      setSelectedProduct(updatedProduct);
      setEditVisible(false);

      showResponse("PATCH Response", apiResponse);
    } catch (err) {
      Alert.alert("PATCH Error", getErrorMessage(err));
    } finally {
      setWorking(false);
    }
  }

  function confirmDeleteProduct() {
    if (!selectedProduct) return;

    Alert.alert(
      "Delete product",
      `Are you sure you want to delete "${selectedProduct.title}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: handleDeleteProduct,
        },
      ]
    );
  }

  // DELETE - delete an existing product.
  async function handleDeleteProduct() {
    if (!selectedProduct) return;

    try {
      setWorking(true);

      let apiResponse: Record<string, unknown>;

      if (localProductIds.includes(selectedProduct.id)) {
        apiResponse = {
          ...selectedProduct,
          isDeleted: true,
        };
      } else {
        const deleted = await deleteProduct(selectedProduct.id);
        apiResponse = cleanResponse(deleted);
      }

      setProducts((current) =>
        current.filter((product) => product.id !== selectedProduct.id)
      );

      setLocalProductIds((current) =>
        current.filter((id) => id !== selectedProduct.id)
      );

      setDetailsVisible(false);
      setSelectedProduct(null);

      showResponse("DELETE Response", apiResponse);
    } catch (err) {
      Alert.alert("DELETE Error", getErrorMessage(err));
    } finally {
      setWorking(false);
    }
  }

  function showResponse(title: string, data: unknown) {
    setResponseTitle(title);
    setResponseData(cleanResponse(data));
    setResponseVisible(true);
  }

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(products.map((product) => product.category))
    );

    return ["All", ...uniqueCategories.slice(0, 8)];
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
        selectedCategory === "All" ||
        product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#6842C2" />

      <View style={styles.header}>
        <View style={styles.headerTop}>
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
            placeholderTextColor="#918B99"
            style={styles.searchInput}
          />

          {search.length > 0 ? (
            <Pressable onPress={() => setSearch("")}>
              <Text style={styles.clearText}>×</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.menuArea}>
        <Text style={styles.menuTitle}>Menu</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((category) => {
            const active = category === selectedCategory;

            return (
              <Pressable
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={[styles.categoryButton, active && styles.activeCategory]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    active && styles.activeCategoryText,
                  ]}
                >
                  {category.replaceAll("-", " ")}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.productsHeader}>
        <Text style={styles.productsTitle}>Products</Text>

        <View style={styles.productsHeaderRight}>
          <Text style={styles.itemCount}>{filteredProducts.length} items</Text>

          <Pressable style={styles.refreshButton} onPress={loadProducts}>
            <Text style={styles.refreshText}>Refresh ↻</Text>
          </Pressable>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>

          <Pressable onPress={loadProducts}>
            <Text style={styles.tryAgain}>Try again</Text>
          </Pressable>
        </View>
      ) : null}

      {loadingProducts ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6842C2" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => openProduct(item)}
            />
          )}
          numColumns={2}
          columnWrapperStyle={styles.columns}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptyText}>
                Try another search or category.
              </Text>
            </View>
          }
        />
      )}

      {working ? (
        <View style={styles.workingOverlay}>
          <View style={styles.workingBox}>
            <ActivityIndicator size="large" color="#6842C2" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        </View>
      ) : null}

      <ProductDetailsModal
        visible={detailsVisible}
        product={selectedProduct}
        onClose={() => setDetailsVisible(false)}
        onEdit={openEditForm}
        onDelete={confirmDeleteProduct}
      />

      <ProductFormModal
        visible={addVisible}
        title="Add Product"
        method="POST"
        form={addForm}
        setForm={setAddForm}
        loading={working}
        onClose={() => setAddVisible(false)}
        onSubmit={handleAddProduct}
      />

      <ProductFormModal
        visible={editVisible}
        title="Edit Product"
        method="PATCH"
        form={editForm}
        setForm={setEditForm}
        loading={working}
        onClose={() => setEditVisible(false)}
        onSubmit={handleUpdateProduct}
      />

      <ApiResponseModal
        visible={responseVisible}
        title={responseTitle}
        data={responseData}
        onClose={() => setResponseVisible(false)}
      />
    </SafeAreaView>
  );
}

function formToProduct(form: ProductForm): Omit<Product, "id"> {
  return {
    title: form.title.trim(),
    brand: form.brand.trim(),
    category: form.category.trim() || "general",
    price: Number(form.price),
    stock: Number(form.stock) || 0,
    description: form.description.trim(),
  };
}

function cleanResponse(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {
      response: data,
    };
  }

  return Object.fromEntries(
    Object.entries(data).filter(([key]) => key !== "meta")
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F5FC",
  },
  header: {
    backgroundColor: "#6842C2",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 17,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  logo: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "800",
  },
  subtitle: {
    color: "#E6DEFA",
    fontSize: 12,
    marginTop: 2,
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
    height: 47,
    backgroundColor: "#FFFFFF",
    borderRadius: 11,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  searchIcon: {
    color: "#6842C2",
    fontSize: 20,
    marginRight: 7,
  },
  searchInput: {
    flex: 1,
    color: "#29252E",
  },
  clearText: {
    color: "#827C89",
    fontSize: 23,
    paddingHorizontal: 5,
  },
  menuArea: {
    backgroundColor: "#FFFFFF",
    paddingTop: 12,
    paddingBottom: 13,
    paddingLeft: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#ECE8F2",
  },
  menuTitle: {
    color: "#2C2830",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 9,
  },
  categoryButton: {
    backgroundColor: "#F0EBFA",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  activeCategory: {
    backgroundColor: "#6842C2",
  },
  categoryText: {
    color: "#6842C2",
    fontWeight: "700",
    textTransform: "capitalize",
  },
  activeCategoryText: {
    color: "#FFFFFF",
  },
  productsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
  },
  productsTitle: {
    color: "#2C2830",
    fontSize: 20,
    fontWeight: "800",
  },
  productsHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemCount: {
    color: "#817C89",
    fontSize: 12,
  },
  refreshButton: {
    backgroundColor: "#EEE8FA",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  refreshText: {
    color: "#6842C2",
    fontWeight: "700",
    fontSize: 11,
  },
  list: {
    paddingHorizontal: 10,
    paddingBottom: 35,
  },
  columns: {
    justifyContent: "space-between",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  loadingText: {
    color: "#6B6571",
    marginTop: 9,
  },
  emptyTitle: {
    color: "#36313A",
    fontSize: 18,
    fontWeight: "800",
  },
  emptyText: {
    color: "#8B8590",
    marginTop: 5,
  },
  errorBox: {
    backgroundColor: "#FFF0F0",
    borderColor: "#F3C6C6",
    borderWidth: 1,
    borderRadius: 10,
    marginHorizontal: 14,
    marginBottom: 8,
    padding: 12,
  },
  errorText: {
    color: "#A23A42",
  },
  tryAgain: {
    color: "#6842C2",
    fontWeight: "800",
    marginTop: 7,
  },
  workingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    backgroundColor: "rgba(25, 20, 32, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  workingBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    padding: 22,
    alignItems: "center",
  },
});
