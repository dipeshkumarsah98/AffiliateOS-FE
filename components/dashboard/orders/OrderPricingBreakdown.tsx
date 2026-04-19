import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { cn, formatCurrency } from "@/lib/utils";

interface OrderPricingBreakdownProps {
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
}

export function OrderPricingBreakdown({
  subtotal,
  taxAmount,
  shippingAmount,
  discountAmount,
  totalAmount,
  currency,
}: OrderPricingBreakdownProps) {
  const rows: {
    label: string;
    value: string;
    highlight?: boolean;
    discount?: boolean;
  }[] = [{ label: "Subtotal", value: formatCurrency(subtotal, currency) }];
  if (shippingAmount > 0)
    rows.push({
      label: "Shipping",
      value: formatCurrency(shippingAmount, currency),
    });
  if (discountAmount > 0)
    rows.push({
      label: "Discount",
      value: `-${formatCurrency(discountAmount, currency)}`,
      discount: true,
    });
  if (taxAmount > 0)
    rows.push({ label: "Tax", value: formatCurrency(taxAmount, currency) });

  return (
    <Card className="py-4">
      <CardHeader className="pb-0">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Pricing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{row.label}</span>
            <span className={cn(row.discount && "text-emerald-600")}>
              {row.value}
            </span>
          </div>
        ))}
        <Separator />
        <div className="flex justify-between text-sm font-bold">
          <span>Total</span>
          <span>{formatCurrency(totalAmount, currency)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
