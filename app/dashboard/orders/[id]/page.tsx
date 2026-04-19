"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Link2,
  User,
  Info,
} from "lucide-react";

import { Topbar } from "@/components/layout/Topbar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/dashboard/orders/StatusPill";
import { OrderTimeline } from "@/components/dashboard/orders/OrderTimeline";
import { OrderItemsTable } from "@/components/dashboard/orders/OrderItemsTable";
import { OrderPricingBreakdown } from "@/components/dashboard/orders/OrderPricingBreakdown";
import { OrderAddressCard } from "@/components/dashboard/orders/OrderAddressCard";
import { OrderPaymentCard } from "@/components/dashboard/orders/OrderPaymentCard";
import { OrderCustomerCard } from "@/components/dashboard/orders/OrderCustomerCard";
import { OrderVerificationCard } from "@/components/dashboard/orders/OrderVerificationCard";

import { useOrderDetailQuery } from "@/hooks/use-orders";
import { useAuthStore } from "@/stores/auth-store";
import { formatRelative } from "date-fns";
import { formatCurrency } from "@/lib/utils";

const TERMINAL_STATUSES = ["COMPLETED", "CANCELLED"];
const NON_UPDATABLE_STATUSES = [...TERMINAL_STATUSES, "AWAITING_VERIFICATION"];

const DynamicUpdateStatusDialog = dynamic(() =>
  import("@/components/dashboard/orders/UpdateStatusDialog").then(
    (mod) => mod.UpdateStatusDialog,
  ),
);

function OrderDetailSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="h-4 w-80" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-56 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.currentUser);
  const isAdmin = currentUser?.roles.includes("admin") ?? false;

  const {
    data: order,
    isLoading,
    isError,
    refetch,
  } = useOrderDetailQuery(params.id);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const isAwaitingVerification =
    order?.status.toUpperCase() === "AWAITING_VERIFICATION";
  const canUpdateStatus =
    isAdmin &&
    order &&
    !NON_UPDATABLE_STATUSES.includes(order.status.toUpperCase());

  return (
    <>
      <Topbar title="Order Details" />

      <main className="flex-1 p-4 md:p-8 max-w-screen-2xl mx-auto w-full">
        <button
          onClick={() => router.push("/dashboard/orders")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </button>

        {isLoading && <OrderDetailSkeleton />}

        {isError && (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center text-center gap-3">
              <AlertCircle className="w-10 h-10 text-destructive" />
              <p className="text-lg font-semibold">Failed to load order</p>
              <p className="text-sm text-muted-foreground mb-2">
                Something went wrong while fetching the order details.
              </p>
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {order && (
          <div className="space-y-6">
            {/* Verification Notice */}
            {isAwaitingVerification && (
              <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <AlertDescription className="text-sm text-blue-800 md:flex dark:text-blue-300">
                  <span className="block sm:inline">
                    This order is pending verification. To verify or reject this
                    order, please visit the{" "}
                  </span>
                  <Button
                    variant="link"
                    className="h-auto p-0 text-blue-600 dark:text-blue-400 underline font-semibold inline-flex"
                    onClick={() => router.push("/dashboard/cod-verifications")}
                  >
                    COD Verifications
                  </Button>{" "}
                  <span className="inline">page.</span>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold tracking-tight">
                    Order #{order.orderNumber}
                  </h1>
                  <StatusPill status={order.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Placed on{" "}
                  {formatRelative(new Date(order.createdAt), new Date())}
                </p>
              </div>

              <div className="flex flex-row gap-2">
                <Button variant="outline" asChild>
                  <a
                    href={`/dashboard/invoice/${params.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Preview Invoice
                  </a>
                </Button>
                {canUpdateStatus && (
                  <Button onClick={() => setStatusDialogOpen(true)}>
                    Update Status
                  </Button>
                )}
              </div>
            </div>

            {/* ── Content grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column */}
              <div className="lg:col-span-2 space-y-6">
                <OrderItemsTable
                  items={order.items}
                  currency={order.currency}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <OrderCustomerCard
                    name={order.user.name}
                    email={order.user.email}
                    shippingAddress={order?.shippingAddress}
                  />
                  <OrderPaymentCard
                    payment={order.payment}
                    paymentMethod={order.paymentMethod}
                    currency={order.currency}
                  />
                </div>

                <OrderPricingBreakdown
                  subtotal={order.subtotal}
                  taxAmount={order.taxAmount}
                  shippingAmount={order.shippingAmount}
                  discountAmount={order.discountAmount}
                  totalAmount={order.totalAmount}
                  currency={order.currency}
                />

                <OrderAddressCard
                  label="Shipping Address"
                  address={order.shippingAddress}
                />

                {order.notes && (
                  <Card className="py-4">
                    <CardHeader className="pb-0">
                      <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">
                        {order.notes}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right column */}
              <div className="space-y-6">
                <Card className="py-4">
                  <CardHeader className="pb-0">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Order Journey
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <OrderTimeline
                      currentStatus={order.status}
                      createdAt={order.createdAt}
                      statuses={order.statuses}
                    />
                  </CardContent>
                </Card>

                {order.verification && (
                  <OrderVerificationCard verification={order.verification} />
                )}

                {order.affiliate && (
                  <Card className="py-4 bg-linear-to-br from-primary/5 to-primary/10 border-primary/20">
                    <CardHeader className="pb-0">
                      <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Affiliate Partner
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Vendor Info */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <User className="w-3.5 h-3.5 text-primary" />
                          <span className="text-sm font-semibold text-primary">
                            {order.affiliate.vendor.name}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground ml-5">
                          {order.affiliate.vendor.email}
                        </p>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-primary/10" />

                      {/* Affiliate Code */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Code:
                          </span>
                        </div>
                        <span className="text-xs font-mono font-semibold bg-background/60 px-2 py-0.5 rounded">
                          {order.affiliate.code}
                        </span>
                      </div>

                      {/* Discount Info */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Discount:
                        </span>
                        <span className="text-xs font-semibold text-primary">
                          {order.affiliate.discountType === "PERCENTAGE"
                            ? `${order.affiliate.discountValue}%`
                            : formatCurrency(
                                order.affiliate.discountValue,
                                order.currency,
                              )}{" "}
                          OFF
                        </span>
                      </div>

                      {/* Earnings */}
                      {order.earnings && order.earnings.length > 0 && (
                        <>
                          <div className="border-t border-primary/10" />
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              Commission Earned:
                            </span>
                            <span className="text-xs font-bold text-emerald-600">
                              {formatCurrency(
                                order.earnings.reduce(
                                  (s, e) => s + e.amount,
                                  0,
                                ),
                                order.currency,
                              )}
                            </span>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Status update dialog */}
            {canUpdateStatus && (
              <DynamicUpdateStatusDialog
                open={statusDialogOpen}
                onOpenChange={setStatusDialogOpen}
                orderId={order.id}
                currentStatus={order.status}
              />
            )}
          </div>
        )}
      </main>
    </>
  );
}
