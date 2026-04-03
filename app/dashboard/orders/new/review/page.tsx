"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
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
import { Topbar } from "@/components/layout/Topbar";
import { loadOrderFormDraft, type OrderFormData } from "@/lib/order-form-store";
import { useCreateOrder } from "@/hooks/use-orders";
import { useProductsQuery } from "@/hooks/use-products";

export default function ReviewOrderPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<OrderFormData | null>(null);

  // We fetch products to display actual product details on the review page
  const { data: productsData } = useProductsQuery({ page: 1, limit: 1000 });
  const products = productsData?.items || [];

  const createOrderMutation = useCreateOrder();

  useEffect(() => {
    const savedDraft = loadOrderFormDraft();
    if (!savedDraft) {
      toast.error("No order data found. Please restart the process.");
      router.replace("/dashboard/orders/new");
    } else {
      setDraft(savedDraft);
    }
  }, [router]);

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
  // We can apply discount if affiliateCode exists but that would be validated backend-side most likely
  const discount = 0; 
  
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
                  <CardTitle>Customer Details</CardTitle>
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
                    <span className="font-semibold block mb-1">Shipping Address</span>
                    <p className="text-muted-foreground">{formatAddress(draft.shippingAddress)}</p>
                  </div>
                  <div className="space-y-1 rounded-md bg-muted/50 p-4 border border-border">
                    <span className="font-semibold block mb-1">Billing Address</span>
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
                      return (
                        <div key={index} className="flex justify-between items-center bg-muted/30 p-3 rounded-lg border">
                          <div>
                            <p className="font-medium">{product?.title || "Loading..."}</p>
                            <p className="text-sm text-muted-foreground">Qty: {item.quantity} x RS {product?.price.toFixed(2) || "0.00"}</p>
                          </div>
                          <div className="font-medium">
                            RS {product ? (product.price * item.quantity).toFixed(2) : "0.00"}
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
                        <div>
                          <span className="text-muted-foreground font-medium">Affiliate Code:</span>
                          <p className="inline-block px-2 py-1 bg-primary/10 text-primary font-mono text-xs rounded ml-2">
                            {draft.affiliateCode}
                          </p>
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
                      <span>RS {subtotal.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>{shipping > 0 ? `RS ${shipping.toFixed(2)}` : "Free"}</span>
                   </div>
                   {discount > 0 && (
                     <div className="flex justify-between items-center text-sm text-green-600">
                        <span>Discount</span>
                        <span>-RS {discount.toFixed(2)}</span>
                     </div>
                   )}
                   <div className="pt-4 border-t flex justify-between items-center font-bold">
                     <span>Total</span>
                     <span className="text-lg">RS {total.toFixed(2)}</span>
                   </div>
                   
                   <div className="pt-4 space-y-1">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Payment Method</span>
                      <p className="font-medium">{draft.paymentMethod}</p>
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
