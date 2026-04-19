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
import { useCreateOrder, useVerifyOrder } from "@/hooks/use-orders";
import { useProductsQuery } from "@/hooks/use-products";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function ReviewOrderPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<OrderFormData | null>(null);
  const createOrderMutation = useCreateOrder();

  // Verify order details and get price breakdown from API
  const {
    data: verifiedOrder,
    isLoading: isVerifying,
    error: verifyError,
  } = useVerifyOrder(draft);

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

  // Show error if verification failed
  if (verifyError) {
    return (
      <div className="flex flex-col h-full bg-muted/30">
        <Topbar title="Review Order" />
        <main className="flex-1 p-6 flex justify-center items-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Verification Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {verifyError instanceof Error
                  ? verifyError.message
                  : "Failed to verify order. Please try again."}
              </p>
              <Button
                className="mt-4 w-full"
                onClick={() => router.push("/dashboard/orders/new")}
              >
                Go Back
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

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
                      <Badge variant="secondary" className="text-white">
                        Existing Customer
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground font-medium">
                      Name:
                    </span>
                    <p className="font-medium">{draft.customerName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">
                      Email:
                    </span>
                    <p>{draft.customerEmail}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">
                      Phone:
                    </span>
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
                        <Badge variant="outline" className="text-xs">
                          Saved
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">
                      {formatAddress(draft.shippingAddress)}
                    </p>
                  </div>
                  <div className="space-y-1 rounded-md bg-muted/50 p-4 border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">Billing Address</span>
                      {draft.billingAddressId && (
                        <Badge variant="outline" className="text-xs">
                          Saved
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">
                      {draft.sameAsShipping
                        ? "Same as shipping"
                        : formatAddress(draft.billingAddress)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Product */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  {isVerifying ? (
                    <div className="space-y-3">
                      <Skeleton className="h-20 w-full" />
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="animate-pulse">
                          Verifying order details...
                        </span>
                      </div>
                    </div>
                  ) : verifiedOrder && verifiedOrder.items.length > 0 ? (
                    <div className="space-y-3">
                      {verifiedOrder.items.map((item, index) => (
                        <div
                          key={index}
                          className={`flex justify-between items-center bg-muted/30 p-4 rounded-lg border ${
                            verifiedOrder.affiliateDiscount &&
                            verifiedOrder.affiliateDiscount.amount > 0
                              ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20"
                              : ""
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{item.productTitle}</p>
                              {verifiedOrder.affiliateDiscount &&
                                verifiedOrder.affiliateDiscount.amount > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-green-100 text-green-700 border-green-300"
                                  >
                                    <Tag className="w-3 h-3 mr-1" />
                                    Discount Applied
                                  </Badge>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Qty: {item.quantity} x{" "}
                              {formatCurrency(
                                item.unitPrice,
                                verifiedOrder.currency,
                              )}
                            </p>
                            {item.availableStock !== undefined && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Stock available: {item.availableStock}
                              </p>
                            )}
                            {verifiedOrder.affiliateDiscount &&
                              verifiedOrder.affiliateDiscount.amount > 0 && (
                                <p className="text-xs text-green-600 font-medium mt-1">
                                  {verifiedOrder.affiliateDiscount.type ===
                                  "PERCENTAGE"
                                    ? `${verifiedOrder.affiliateDiscount.value}% off`
                                    : `${formatCurrency(verifiedOrder.affiliateDiscount.value, verifiedOrder.currency)} off`}
                                </p>
                              )}
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">
                              {formatCurrency(
                                item.totalPrice,
                                verifiedOrder.currency,
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      Unable to verify order items
                    </p>
                  )}
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
                          <span className="text-muted-foreground font-medium">
                            Affiliate Code:
                          </span>
                          <p className="inline-block px-2 py-1 bg-primary/10 text-primary font-mono text-xs rounded">
                            {verifiedOrder?.affiliateCode ||
                              draft.affiliateCode}
                          </p>
                          {isVerifying && (
                            <Badge variant="outline" className="text-xs">
                              <span className="animate-pulse">
                                Verifying...
                              </span>
                            </Badge>
                          )}
                          {!isVerifying &&
                            verifiedOrder?.affiliateDiscount &&
                            verifiedOrder.affiliateDiscount.amount > 0 && (
                              <Badge
                                variant="default"
                                className="text-xs bg-green-600"
                              >
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Valid
                              </Badge>
                            )}
                          {!isVerifying &&
                            verifiedOrder &&
                            (!verifiedOrder.affiliateDiscount ||
                              verifiedOrder.affiliateDiscount.amount === 0) && (
                              <Badge
                                variant="outline"
                                className="text-xs text-amber-600"
                              >
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Not Applied
                              </Badge>
                            )}
                        </div>

                        {verifiedOrder?.affiliateDiscount &&
                          verifiedOrder.affiliateDiscount.amount > 0 && (
                            <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                              <div className="text-xs space-y-1">
                                <p>
                                  <span className="font-medium">Discount:</span>{" "}
                                  {verifiedOrder.affiliateDiscount.type ===
                                  "PERCENTAGE"
                                    ? `${verifiedOrder.affiliateDiscount.value}% off`
                                    : formatCurrency(
                                        verifiedOrder.affiliateDiscount.value,
                                        verifiedOrder.currency,
                                      ) + " off"}
                                </p>
                                <p>
                                  <span className="font-medium">
                                    Total Saved:
                                  </span>{" "}
                                  {formatCurrency(
                                    verifiedOrder.affiliateDiscount.amount,
                                    verifiedOrder.currency,
                                  )}
                                </p>
                              </div>
                            </div>
                          )}
                      </div>
                    )}
                    {draft.notes && (
                      <div>
                        <span className="text-muted-foreground font-medium">
                          Notes:
                        </span>
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
                  {isVerifying ? (
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  ) : verifiedOrder ? (
                    <>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>
                          {formatCurrency(
                            verifiedOrder.subtotal,
                            verifiedOrder.currency,
                          )}
                        </span>
                      </div>

                      {verifiedOrder.shippingAmount > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">
                            Shipping
                          </span>
                          <span>
                            {formatCurrency(
                              verifiedOrder.shippingAmount,
                              verifiedOrder.currency,
                            )}
                          </span>
                        </div>
                      )}

                      {verifiedOrder.taxAmount > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Tax</span>
                          <span>
                            {formatCurrency(
                              verifiedOrder.taxAmount,
                              verifiedOrder.currency,
                            )}
                          </span>
                        </div>
                      )}

                      {verifiedOrder.discountAmount > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-1 text-green-600">
                            <Tag className="w-3 h-3" />
                            <span>Discount</span>
                          </div>
                          <span className="text-green-600 font-medium">
                            -{" "}
                            {formatCurrency(
                              verifiedOrder.discountAmount,
                              verifiedOrder.currency,
                            )}
                          </span>
                        </div>
                      )}

                      <div className="pt-4 border-t flex justify-between items-center font-bold">
                        <span>Total</span>
                        <span className="text-base">
                          {formatCurrency(
                            verifiedOrder.totalAmount,
                            verifiedOrder.currency,
                          )}
                        </span>
                      </div>

                      <div className="pt-4 space-y-1">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                          Payment Method
                        </span>
                        <p className="font-medium">
                          <Badge variant="default" className="text-white">
                            {draft.paymentMethod}
                          </Badge>
                        </p>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Unable to calculate totals
                    </p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={
                      createOrderMutation.isPending ||
                      isVerifying ||
                      !verifiedOrder
                    }
                  >
                    {createOrderMutation.isPending ? (
                      "Processing..."
                    ) : isVerifying ? (
                      "Verifying..."
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
