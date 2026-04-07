"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Tag, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Topbar } from "@/components/layout/Topbar";
import { loadOrderFormDraft, type OrderFormData } from "@/lib/order-form-store";
import { useCreateOrder, useValidateAffiliateCode } from "@/hooks/use-orders";
import { useProductsQuery } from "@/hooks/use-products";
import { formatCurrency } from "@/lib/utils";
import type { ValidateAffiliateCodeResponse } from "@/lib/api/orders";

export default function ReviewOrderPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<OrderFormData | null>(null);

  // We fetch products to display actual product details on the review page
  const { data: productsData } = useProductsQuery({ page: 1, limit: 1000 });
  const products = productsData?.items || [];

  const createOrderMutation = useCreateOrder();

  // Validate affiliate code if exists
  const {
    data: affiliateValidation,
    isLoading: isValidatingAffiliate,
    isError: affiliateError,
  } = useValidateAffiliateCode(draft?.affiliateCode || "");

  // Calculate discount based on affiliate validation
  // Must be called before any conditional returns (Rules of Hooks)
  const discountInfo = useMemo(() => {
    if (!draft || !affiliateValidation || affiliateError || !affiliateValidation.isActive) {
      return { amount: 0, productId: null, type: null, value: 0 };
    }

    const { product, discountType, discountValue } = affiliateValidation;

    // Find the item in the order that matches the affiliate's product
    const orderItem = draft.items.find((item) => item.productId === product.id);
    if (!orderItem) {
      // Affiliate code is for a product not in this order
      return { amount: 0, productId: product.id, productTitle: product.title, type: discountType, value: discountValue };
    }

    const productInOrder = products.find((p) => p.id === orderItem.productId);
    if (!productInOrder) {
      return {
        amount: 0,
        productId: product.id,
        productTitle: product.title,
        type: discountType,
        value: discountValue
      };
    }

    const itemSubtotal = productInOrder.price * orderItem.quantity;
    let discountAmount = 0;

    if (discountType === "PERCENTAGE") {
      discountAmount = (itemSubtotal * discountValue) / 100;
    } else if (discountType === "FIXED") {
      discountAmount = discountValue;
    }

    return {
      amount: discountAmount,
      productId: product.id,
      productTitle: product.title,
      type: discountType,
      value: discountValue,
      appliedToItem: !!orderItem,
    };
  }, [draft, affiliateValidation, affiliateError, products]);

  console.log("Calculated discount info:", discountInfo);

  useEffect(() => {
    const savedDraft = loadOrderFormDraft();
    if (!savedDraft) {
      toast.error("No order data found. Please restart the process.");
      router.replace("/dashboard/orders/new");
    } else {
      setDraft(savedDraft);
    }
  }, [router]);

  // Early return after all hooks are called
  if (!draft) {
    return null; // Or a loading spinner
  }

  // Helper to format addresses
  const formatAddress = (address: any) => {
    if (!address) return "N/A";
    const parts = [
      address.street_address,
      address.city,
      address.state,
      address.postal_code,
      address.country,
    ].filter(Boolean);
    return parts.join(", ");
  };

  const getProductDetails = (id: string) => {
    return products.find((p) => p.id === id);
  };

  // Calculate totals
  const subtotal = draft.items.reduce((sum, item) => {
    const product = getProductDetails(item.productId);
    const price = product ? product.price : 0;
    return sum + price * item.quantity;
  }, 0);

  // Hardcoded for now. Could calculate shipping based on regions, or call API
  const shipping = 0;
  const discount = discountInfo.amount;

  const total = subtotal + shipping - discount;

  const handleSubmit = () => {
    createOrderMutation.mutate(draft);
  };

  return (
    <div className="flex flex-col h-full bg-muted/30">
      <Topbar title="Review Order" />

      <main className="flex-1 p-6 flex justify-center">
        <div className="max-w-4xl w-full">
          <Button
            variant="ghost"
            className="mb-4 pl-0"
            onClick={() => router.push("/dashboard/orders/new")}
            disabled={createOrderMutation.isPending}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Edit Registration
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Customer Details</CardTitle>
                    {draft.customerId && (
                      <Badge variant="secondary" className="text-white">Existing Customer</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground font-medium">Name:</span>
                    <p className="font-medium">{draft.customerName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">Email:</span>
                    <p>{draft.customerEmail}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">Phone:</span>
                    <p>{draft.customerPhone || "N/A"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Addresses */}
              <Card>
                <CardHeader>
                  <CardTitle>Addresses</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1 rounded-md bg-muted/50 p-4 border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">Shipping Address</span>
                      {draft.shippingAddressId && (
                        <Badge variant="outline" className="text-xs">Saved</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">{formatAddress(draft.shippingAddress)}</p>
                  </div>
                  <div className="space-y-1 rounded-md bg-muted/50 p-4 border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">Billing Address</span>
                      {draft.billingAddressId && (
                        <Badge variant="outline" className="text-xs">Saved</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">
                      {draft.sameAsShipping ? "Same as shipping" : formatAddress(draft.billingAddress)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {draft.items.map((item, index) => {
                      const product = getProductDetails(item.productId);
                      const hasDiscount = discountInfo.productId === item.productId && discountInfo.appliedToItem;

                      return (
                        <div
                          key={index}
                          className={`flex justify-between items-center bg-muted/30 p-3 rounded-lg border ${hasDiscount ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : ''
                            }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="">{product?.title || "Loading..."}</p>
                              {hasDiscount && (
                                <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                                  <Tag className="w-3 h-3 mr-1" />
                                  Discount Applied
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Qty: {item.quantity} x {formatCurrency(product?.price || 0, "NRP")}
                            </p>
                            {hasDiscount && (
                              <p className="text-xs text-green-600 font-medium mt-1">
                                {discountInfo.type === "PERCENTAGE"
                                  ? `${discountInfo.value}% off`
                                  : `${formatCurrency(discountInfo.value, "NRP")} off`}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className={hasDiscount ? "text-muted-foreground line-through text-sm" : ""}>
                              {formatCurrency(product ? product.price * item.quantity : 0, "NRP")}
                            </div>
                            {hasDiscount && (
                              <div className="font-semibold text-green-600">
                                {formatCurrency((product ? product.price * item.quantity : 0) - discountInfo.amount, "NRP")}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Additional Information */}
              {(draft.affiliateCode || draft.notes) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    {draft.affiliateCode && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground font-medium">Affiliate Code:</span>
                          <p className="inline-block px-2 py-1 bg-primary/10 text-primary font-mono text-xs rounded">
                            {draft.affiliateCode}
                          </p>
                          {isValidatingAffiliate && (
                            <Badge variant="outline" className="text-xs">
                              <span className="animate-pulse">Validating...</span>
                            </Badge>
                          )}
                          {!isValidatingAffiliate && affiliateValidation && affiliateValidation.isActive && (
                            <Badge variant="default" className="text-xs bg-green-600">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Valid
                            </Badge>
                          )}
                          {!isValidatingAffiliate && affiliateError && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Invalid
                            </Badge>
                          )}
                        </div>

                        {affiliateValidation && affiliateValidation.isActive && (
                          <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                            <div className="text-xs space-y-1">
                              <p>
                                <span className="font-medium">Discount:</span>{" "}
                                {discountInfo.type === "PERCENTAGE"
                                  ? `${discountInfo.value}% off`
                                  : formatCurrency(discountInfo.value, "NRP") + " off"}
                              </p>
                              <p>
                                <span className="font-medium">Applies to:</span> {discountInfo.productTitle}
                              </p>
                              <p>
                                <span className="font-medium">Vendor:</span> {affiliateValidation.vendor.name}
                              </p>
                              {!discountInfo.appliedToItem && (
                                <p className="text-amber-600 dark:text-amber-500 flex items-start gap-1 mt-2">
                                  <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                                  <span>This discount code is for "{discountInfo.productTitle}" which is not in your order.</span>
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {!isValidatingAffiliate && affiliateError && (
                          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
                            <p className="text-xs text-red-600 dark:text-red-500">
                              This affiliate code is invalid or inactive. Discount will not be applied.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    {draft.notes && (
                      <div>
                        <span className="text-muted-foreground font-medium">Notes:</span>
                        <p className="mt-1 p-3 bg-muted/50 rounded-md border text-muted-foreground italic">
                          {draft.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

            </div>

            {/* Summary Sidebar */}
            <div className="space-y-6">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                  <CardDescription>Review total amount</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>
                      {formatCurrency(subtotal, "NRP")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{shipping > 0 ? formatCurrency(shipping, "NRP") : "Free"}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-1 text-green-600">
                        <Tag className="w-3 h-3" />
                        <span>Discount</span>
                      </div>
                      <span className="text-green-600 font-medium">
                        - {formatCurrency(discount, "NRP")}
                      </span>
                    </div>
                  )}
                  {isValidatingAffiliate && draft.affiliateCode && (
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="animate-pulse">Validating code...</span>
                      </span>
                    </div>
                  )}
                  <div className="pt-4 border-t flex justify-between items-center font-bold">
                    <span>Total</span>
                    <span className="text-base">
                      {formatCurrency(total, "NRP")}
                    </span>
                  </div>

                  <div className="pt-4 space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Payment Method</span>
                    <p className="font-medium">
                      <Badge variant="default" className="text-white">{draft.paymentMethod}</Badge>
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={createOrderMutation.isPending}
                  >
                    {createOrderMutation.isPending ? (
                      "Processing..."
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Confirm & Create Order
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
