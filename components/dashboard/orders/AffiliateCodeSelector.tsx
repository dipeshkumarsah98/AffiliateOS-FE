"use client";

import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  X,
  Tag,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { useDebounce } from "@/hooks/use-debounce";
import { useValidateAffiliateCode } from "@/hooks/use-orders";

interface AffiliateCodeSelectorProps {
  form: UseFormReturn<any>;
  selectedProductId?: string;
}

export function AffiliateCodeSelector({
  form,
  selectedProductId,
}: AffiliateCodeSelectorProps) {
  const [hasValidCode, setHasValidCode] = useState(false);

  const currentAffiliateCode = form.watch("affiliateCode");
  const debouncedAffiliateCode = useDebounce(currentAffiliateCode ?? "", 500);

  const {
    data: affiliateValidation,
    isFetching: validatingCode,
    isError: affiliateCodeError,
  } = useValidateAffiliateCode(debouncedAffiliateCode);

  // Determine if code is valid and active
  const isCodeValid =
    !validatingCode &&
    debouncedAffiliateCode &&
    debouncedAffiliateCode.length > 2 &&
    affiliateValidation?.isActive;

  // Check if code applies to selected product
  const appliesToSelectedProduct =
    isCodeValid && selectedProductId === affiliateValidation?.product.id;

  const handleClearCode = () => {
    form.setValue("affiliateCode", "");
    setHasValidCode(false);
  };

  useEffect(() => {
    if (isCodeValid) {
      setHasValidCode(true);
    } else {
      setHasValidCode(false);
    }
  }, [isCodeValid]);

  return (
    <div className="space-y-4">
      {!hasValidCode ? (
        <div className="space-y-2">
          <Label htmlFor="affiliate-code">Affiliate Code (Optional)</Label>
          <div className="relative">
            <Input
              id="affiliate-code"
              placeholder="e.g. SAVE20"
              value={currentAffiliateCode || ""}
              onChange={(e) => form.setValue("affiliateCode", e.target.value)}
            />
            {validatingCode && (
              <div className="absolute right-3 top-2.5">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!validatingCode &&
              debouncedAffiliateCode &&
              debouncedAffiliateCode.length > 2 && (
                <div className="absolute right-3 top-2.5">
                  {affiliateCodeError ||
                  (affiliateValidation && !affiliateValidation.isActive) ? (
                    <XCircle
                      className="h-5 w-5 text-destructive hover:cursor-pointer"
                      onClick={handleClearCode}
                    />
                  ) : affiliateValidation?.isActive ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : null}
                </div>
              )}
          </div>

          {validatingCode && debouncedAffiliateCode && (
            <p className="text-xs text-muted-foreground flex items-center">
              <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Validating
              code...
            </p>
          )}

          {!validatingCode &&
            debouncedAffiliateCode &&
            debouncedAffiliateCode.length > 2 &&
            (affiliateCodeError ||
              (affiliateValidation && !affiliateValidation.isActive)) && (
              <p className="text-sm text-destructive font-medium">
                Invalid or expired affiliate code
              </p>
            )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Affiliate Code</Label>
            <Badge variant="default" className="bg-green-600">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Valid Code
            </Badge>
          </div>

          <div
            className={`border rounded-lg p-4 ${
              appliesToSelectedProduct
                ? "bg-green-50/50 border-green-500/50 dark:bg-green-950/20"
                : "bg-accent/50"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono font-semibold text-lg">
                    {affiliateValidation?.code}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Discount:</span>
                    <span className="font-semibold text-green-600">
                      {affiliateValidation?.discountType === "PERCENTAGE"
                        ? `${affiliateValidation?.discountValue}% off`
                        : `RS ${affiliateValidation?.discountValue} off`}
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground shrink-0">
                      Applies to:
                    </span>
                    <span className="font-medium">
                      {affiliateValidation?.product.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Vendor:</span>
                    <span className="font-medium">
                      {affiliateValidation?.vendor.name}
                    </span>
                  </div>
                </div>

                {!appliesToSelectedProduct && selectedProductId && (
                  <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md mt-3">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      This code doesn't apply to your selected product. Change
                      your product selection to get this discount.
                    </p>
                  </div>
                )}

                {appliesToSelectedProduct && (
                  <div className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md mt-3">
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                      Discount will be applied to your order!
                    </p>
                  </div>
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClearCode}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
