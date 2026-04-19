"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useOrderDetailQuery } from "@/hooks/use-orders";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Download, Printer } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import InvoicePDF from "@/components/dashboard/orders/InvoicePDF";

function InvoiceSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12 animate-pulse bg-white">
      <div className="flex justify-between items-start">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 text-right">
          <Skeleton className="h-10 w-24 ml-auto" />
          <Skeleton className="h-5 w-32 ml-auto" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

export default function InvoicePage() {
  const params = useParams<{ id: string }>();
  const { data: order, isLoading, isError } = useOrderDetailQuery(params.id);
  const [isClient, setIsClient] = useState(false);

  // Ensure PDFDownloadLink only renders on client to avoid SSR issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50 py-8">
        <InvoiceSkeleton />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50/50">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Could not load invoice details. The order might not exist or there
            was a server error.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isPaid =
    order.payment?.status.toUpperCase() === "SUCCESS" ||
    order.status.toUpperCase() === "COMPLETED";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 py-8 px-4 sm:px-6 lg:px-8">
      {/* Print styles applied dynamically */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page {
            /* Setting margin 0 removes the browser injected headers and footers */
            margin: 0;
            size: auto;
          }
          body, html {
            background-color: white !important;
            height: auto !important;
            /* Give it our own safe printing margin */
            padding: 10mm !important;
          }
          /* Hide unused layout elements */
          aside, nav, .fixed, .no-print {
            display: none !important;
          }
          /* Override layout constraints */
          main {
            margin-left: 0 !important;
            padding: 0 !important;
            display: block !important;
            width: 100% !important;
          }
          /* Reset the main wrapper so it doesn't add height/padding */
          .min-h-screen {
            min-height: 0 !important;
            height: auto !important;
            padding: 0 !important;
            background: transparent !important;
          }
          /* Adjust container to normal flow but without styles */
          #invoice-container {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            min-height: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            page-break-inside: avoid;
          }
          /* Compress vertical spacing slightly to guarantee one-page fit */
          .mb-16 { margin-bottom: 2rem !important; }
          .mb-12 { margin-bottom: 1.5rem !important; }
          .mb-24, .sm\\:mb-24 { margin-bottom: 2rem !important; }
          .gap-10 { gap: 1.5rem !important; }
          .pb-4 { padding-bottom: 0.5rem !important; }
          .py-5, .pt-5 { padding-top: 0.75rem !important; padding-bottom: 0.75rem !important; }
        }
      `,
        }}
      />

      <div className="no-print flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center max-w-4xl mx-auto mb-6">
        <p className="text-sm text-muted-foreground hidden sm:block">
          Press{" "}
          <kbd className="font-mono bg-muted/50 px-1.5 py-0.5 rounded text-xs mx-1">
            Ctrl/Cmd + P
          </kbd>{" "}
          to print or save as PDF
        </p>
        <div className="flex w-full sm:w-auto items-center gap-3">
          {isClient && order ? (
            <PDFDownloadLink
              document={<InvoicePDF order={order} />}
              fileName={`invoice-${order.orderNumber}.pdf`}
            >
              {({ loading }) => (
                <Button
                  variant="outline"
                  disabled={loading}
                  className="flex-1 sm:flex-none"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {loading ? "Preparing..." : "Download PDF"}
                </Button>
              )}
            </PDFDownloadLink>
          ) : (
            <Button variant="outline" disabled className="flex-1 sm:flex-none">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          )}
          <Button
            onClick={() => window.print()}
            className="flex-1 sm:flex-none"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Invoice
          </Button>
        </div>
      </div>

      {/* Invoice Container */}
      <div
        id="invoice-container"
        className="max-w-4xl mx-auto bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200/50 min-h-264 p-8 sm:p-12 lg:p-16"
      >
        {/* Header */}
        <header className="flex justify-between items-start mb-8">
          <div className="flex items-center">
            {/* Logo placeholder mimicking the green "M" */}
            <div className="w-10 h-10 bg-emerald-500 rounded-[10px] flex items-center justify-center text-white font-bold text-xl select-none relative overflow-hidden">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 z-10 transition-transform duration-500 group-hover:scale-110"
              >
                <path
                  d="M4 18V6H8L12 14L16 6H20V18H16V10L12 18L8 10V18H4Z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </div>

          <div className="text-right">
            <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 mb-1">
              {isPaid ? "Paid" : "Invoice"}
            </h1>
            <p className="text-zinc-500 font-medium">INV-{order.orderNumber}</p>
          </div>
        </header>

        {/* Addresses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mb-8">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 mb-3">
              Invoice from
            </h2>
            <div className="text-sm text-zinc-600 leading-relaxed font-medium space-y-1">
              <p className="text-zinc-900">Ariana Lang</p>
              <p>4642 Demetris Lane Suite 407</p>
              <p>Edmond, AZ / 60888</p>
              <p className="pt-2">+54 11 1234-5678</p>
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 mb-3">
              Invoice to
            </h2>
            <div className="text-sm text-zinc-600 leading-relaxed font-medium space-y-1">
              <p className="text-zinc-900">{order.user.name}</p>
              {order.shippingAddress ? (
                <>
                  <p>{order.shippingAddress.street_address}</p>
                  <p>{`${order.shippingAddress.city}, ${order.shippingAddress.state} / ${order.shippingAddress.postal_code}`}</p>
                </>
              ) : (
                <p className="text-zinc-400 italic">No shipping address</p>
              )}
              <p className="pt-2">{order.user.email}</p>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mb-8">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 mb-2">
              Date create
            </h2>
            <p className="text-sm text-zinc-600 font-medium">
              {format(new Date(order.createdAt), "dd MMM yyyy")}
            </p>
          </div>
        </div>

        {/* Invoice Details Table */}
        <div className="mb-12">
          <h2 className="text-sm font-bold text-zinc-900 mb-4">
            Invoice details
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="py-3 text-left font-semibold text-zinc-900 pb-4 w-12">
                    #
                  </th>
                  <th className="py-3 text-left font-semibold text-zinc-900 pb-4">
                    Description
                  </th>
                  <th className="py-3 text-right font-semibold text-zinc-900 pb-4 w-24">
                    Qty
                  </th>
                  <th className="py-3 text-right font-semibold text-zinc-900 pb-4 w-32">
                    Unit price
                  </th>
                  <th className="py-3 text-right font-semibold text-zinc-900 pb-4 w-32">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="align-top font-medium text-zinc-600">
                {order.items.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 transition-colors"
                  >
                    <td className="py-5 pt-5">{index + 1}</td>
                    <td className="py-5 pt-5">
                      <p className="font-semibold text-zinc-900 mb-1">
                        {item.product.title}
                      </p>
                      <p className="text-zinc-500 text-xs leading-relaxed max-w-md line-clamp-2">
                        {item.product.description}
                      </p>
                    </td>
                    <td className="py-5 pt-5 text-right">{item.quantity}</td>
                    <td className="py-5 pt-5 text-right">
                      {formatCurrency(item.unitPrice, order.currency)}
                    </td>
                    <td className="py-5 pt-5 text-right text-zinc-900 font-semibold">
                      {formatCurrency(item.totalPrice, order.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="flex justify-end mb-16 sm:mb-24">
          <div className="w-full sm:w-72 space-y-4 text-sm font-medium">
            <div className="flex justify-between items-center">
              <span className="text-zinc-600">Subtotal</span>
              <span className="text-zinc-900">
                {formatCurrency(order.subtotal, order.currency)}
              </span>
            </div>

            {(order.shippingAmount > 0 ||
              order.discountAmount > 0 ||
              order.taxAmount > 0) && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-600">Shipping</span>
                  <span className="text-zinc-900">
                    {formatCurrency(order.shippingAmount, order.currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-600">Discount</span>
                  <span className="text-zinc-900">
                    -{formatCurrency(order.discountAmount, order.currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-600">Taxes</span>
                  <span className="text-zinc-900">
                    {formatCurrency(order.taxAmount, order.currency)}
                  </span>
                </div>
              </>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-zinc-200">
              <span className="text-zinc-900 font-bold text-base">Total</span>
              <span className="text-zinc-900 font-extrabold text-lg">
                {formatCurrency(order.totalAmount, order.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm">
          <div>
            <h3 className="font-bold text-zinc-900 mb-2 uppercase tracking-wide text-xs">
              NOTES
            </h3>
            <p className="text-zinc-600 font-medium">
              We appreciate your business. Should you need us to add VAT or
              extra notes let us know!
            </p>
          </div>
          <div className="sm:text-right">
            <h3 className="font-bold text-zinc-900 mb-2 uppercase tracking-wide text-xs">
              Have a question?
            </h3>
            <p className="text-zinc-600 font-medium">support@abcapp.com</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
