"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { X, Package, Search } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Product {
  id: string;
  title: string;
  price: number;
  totalStock: number;
  images?: string[];
}

interface ProductSelectorProps {
  form: UseFormReturn<any>;
  products: Product[];
}

export function ProductSelector({ form, products }: ProductSelectorProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const productId = form.watch("productId");
  const quantity = form.watch("quantity");

  const handleProductSelect = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      form.setValue("productId", product.id);
      form.setValue("quantity", 1);
    }
  };

  const handleClearSelection = () => {
    setSelectedProduct(null);
    form.setValue("productId", "");
    form.setValue("quantity", 1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Selection</CardTitle>
        <CardDescription>
          Select the product and specify quantity
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!selectedProduct ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product-select">Select Product *</Label>
              <Select onValueChange={handleProductSelect} value={productId}>
                <SelectTrigger id="product-select">
                  <SelectValue placeholder="Choose a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center justify-between w-full gap-4">
                        <span className="font-medium">{p.title}</span>
                        <span className="text-muted-foreground text-sm">
                          RS {p.price.toFixed(2)} • {p.totalStock} in stock
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.productId && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.productId.message as string}
                </p>
              )}
            </div>

            {!productId && (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <Package className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>Select a product to continue</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-accent/50">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Selected Product</Badge>
                  </div>
                  <div className="font-medium flex items-center gap-2 text-lg">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    {selectedProduct.title}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-foreground">
                        RS {selectedProduct.price.toFixed(2)}
                      </span>
                      <span>per unit</span>
                    </div>
                    <div className="h-4 w-px bg-border" />
                    <div>
                      <span className="font-semibold text-foreground">
                        {selectedProduct.totalStock}
                      </span>{" "}
                      available
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleClearSelection}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={selectedProduct.totalStock}
                value={quantity}
                onChange={(e) =>
                  form.setValue("quantity", parseInt(e.target.value, 10) || 1)
                }
                className="w-full sm:w-48"
              />
              {form.formState.errors.quantity && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.quantity.message as string}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Total: RS {(selectedProduct.price * (quantity || 1)).toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
