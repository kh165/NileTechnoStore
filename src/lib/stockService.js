/**
 * Stock & Inventory Management Service
 * Provides stock levels for products directly from API / product objects.
 * Reserved for Future Supplier Integration
 */

export const stockService = {
  /**
   * Gets stock for a specific product ID directly from product object
   */
  getProductStock(productId, productObj) {
    if (!productObj) return 0;
    const rawVal = productObj.stock ?? productObj.quantity ?? productObj.inventory ?? productObj.count ?? productObj.rating?.count;
    if (rawVal !== undefined && rawVal !== null) {
      const num = Number(rawVal);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  },

  /**
   * Alias for getProductStock with fallback support
   */
  getStock(productId, fallback = 0) {
    return fallback;
  },

  /**
   * Decrements stock for products in an order
   */
  decrementStocks(orderItems) {
    // Read-only stock mode: stock is managed directly on the backend API
  },

  /**
   * Increments stock for products in an order
   */
  incrementStocks(orderItems) {
    // Read-only stock mode
  },

  /**
   * Returns a list of product IDs that are low in stock (less than 5 items)
   */
  getLowStockProducts(allProducts = []) {
    const alerts = [];
    allProducts.forEach(p => {
      const stock = p.stock !== undefined && p.stock !== null ? Number(p.stock) : 0;
      if (stock > 0 && stock < 5) {
        alerts.push({
          id: p.id,
          name: p.name_ar || p.name || p.title,
          stock: stock,
          image: p.image || p.image_url,
          category: p.category
        });
      }
    });
    return alerts.sort((a, b) => a.stock - b.stock);
  }
};
