export const sellerOrderShopFilter = (shopId) => ({
  $or: [
    { "sellerOrders.shopId": shopId },
    { "sellerOrders.items.shopId": shopId },
  ],
});

export const findSellerOrderForShop = (sellerOrders, shopId) => {
  const expectedShopId = shopId.toString();

  return sellerOrders.find(
    (sellerOrder) =>
      sellerOrder.shopId?.toString() === expectedShopId ||
      sellerOrder.items?.some(
        (item) => item.shopId?.toString() === expectedShopId,
      ),
  );
};
