import { useState, useEffect, useMemo, useCallback } from "react";
import { shopApi } from "../api";

export function useProducts(lang) {
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [productFilter, setProductFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [sortBy, setSortBy] = useState("default");
  const [showOnlyInStock, setShowOnlyInStock] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const loadCategories = async () => {
    try {
      const data = await shopApi.getCategories();
      if (data && data.length > 0) {
        const normalized = data.map(item => typeof item === "string" ? { name: item } : item);
        setCategories(normalized);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error("Error loading categories:", err);
      setCategories([]);
    }
  };

  const loadProducts = async (query = "", category = "الكل", filter = "all", isFirstTime = false) => {
    setIsLoading(true);
    if (isFirstTime) {
      setIsInitialLoading(true);
    }
    try {
      const data = await shopApi.getProducts({ q: query, category, filter });
      const loadedProducts = Array.isArray(data) ? data : [];
      setProducts(loadedProducts);

      if (isFirstTime || allProducts.length === 0) {
        let fullList = loadedProducts;
        if (query.trim() || (category && category !== "الكل") || (filter && filter !== "all")) {
          const fullData = await shopApi.getProducts({});
          fullList = Array.isArray(fullData) ? fullData : [];
        }
        setAllProducts(fullList);

        if (fullList.length > 0) {
          setCategories((prev) => {
            if (prev.length === 0) {
              const uniqueCats = Array.from(
                new Set(fullList.map((p) => p.category).filter(Boolean))
              );
              return uniqueCats.map((name) => ({ name }));
            }
            return prev;
          });
        }
      }
    } catch (err) {
      console.error("Error loading products:", err);
      setProducts([]);
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const isFirstTime = products.length === 0;
    const delayDebounceFn = setTimeout(() => {
      loadProducts(searchQuery, selectedCategory, productFilter, isFirstTime);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedCategory, productFilter]);

  useEffect(() => {
    const handleStockUpdate = () => {
      loadProducts(searchQuery, selectedCategory, productFilter, false);
    };
    window.addEventListener("stock_updated", handleStockUpdate);
    window.addEventListener("products_updated", handleStockUpdate);
    return () => {
      window.removeEventListener("stock_updated", handleStockUpdate);
      window.removeEventListener("products_updated", handleStockUpdate);
    };
  }, [searchQuery, selectedCategory, productFilter]);

  const categoriesList = useMemo(() => [
    { name: "الكل" },
    ...categories.map(cat => {
      if (typeof cat === "string") return { name: cat };
      if (cat && typeof cat === "object" && cat.name) {
        return typeof cat.name === "object" ? { name: cat.name.name || "عام" } : cat;
      }
      return { name: "عام" };
    })
  ], [categories]);

  const getCategoryCount = useCallback((categoryName) => {
    const listToCount = allProducts.length > 0 ? allProducts : products;
    if (categoryName === "الكل" || categoryName === "All") {
      return listToCount.length;
    }
    return listToCount.filter(p => (p.category || "عام") === categoryName).length;
  }, [allProducts, products]);

  const localizeProduct = useCallback((p, langCode) => {
    if (!p) return null;
    return {
      ...p,
      name: langCode === "ar" ? (p.name_ar || p.name) : (p.name_en || p.name),
      description: langCode === "ar" ? (p.description_ar || p.description) : (p.description_en || p.description),
    };
  }, []);

  const processedProducts = useMemo(() => {
    let list = products.map(p => localizeProduct(p, lang));

    if (selectedCategory && selectedCategory !== "الكل") {
      list = list.filter(p => p.category && p.category.trim() === selectedCategory.trim());
    }

    if (showOnlyInStock) {
      list = list.filter(p => p.stock > 0);
    }

    list = list.filter(p => {
      const price = p.discount_price || (p.discount ? (p.price - p.discount) : p.price);
      const min = minPrice !== "" ? parseFloat(minPrice) : 0;
      const max = maxPrice !== "" ? parseFloat(maxPrice) : Infinity;
      return price >= min && price <= max;
    });

    if (sortBy === "price_asc") {
      list.sort((a, b) => {
        const pA = a.discount_price || (a.discount ? (a.price - a.discount) : a.price);
        const pB = b.discount_price || (b.discount ? (b.price - b.discount) : b.price);
        return pA - pB;
      });
    } else if (sortBy === "price_desc") {
      list.sort((a, b) => {
        const pA = a.discount_price || (a.discount ? (a.price - a.discount) : a.price);
        const pB = b.discount_price || (b.discount ? (b.price - b.discount) : b.price);
        return pB - pA;
      });
    } else if (sortBy === "rating") {
      list.sort((a, b) => (b.rating || 4.5) - (a.rating || 4.5));
    }

    return list;
  }, [products, selectedCategory, showOnlyInStock, minPrice, maxPrice, sortBy, lang, localizeProduct]);

  const promoProduct = useMemo(() => {
    if (!products || products.length === 0) return null;
    const featured = products.find((p) => p.featured === true);
    if (featured) return localizeProduct(featured, lang);

    const today = new Date();
    const dateCode = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const index = dateCode % products.length;
    return localizeProduct(products[index], lang);
  }, [products, lang, localizeProduct]);

  return {
    products,
    allProducts,
    searchQuery,
    setSearchQuery,
    productFilter,
    setProductFilter,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    showOnlyInStock,
    setShowOnlyInStock,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    isFilterPanelOpen,
    setIsFilterPanelOpen,
    isLoading,
    isInitialLoading,
    categoriesList,
    getCategoryCount,
    processedProducts,
    promoProduct
  };
}
