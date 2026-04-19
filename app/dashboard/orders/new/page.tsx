"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Topbar } from "@/components/layout/Topbar";
import { CustomerSelector } from "@/components/dashboard/orders/CustomerSelector";
import { AddressPicker } from "@/components/dashboard/orders/AddressPicker";
import { ProductSelector } from "@/components/dashboard/orders/ProductSelector";
import { AffiliateCodeSelector } from "@/components/dashboard/orders/AffiliateCodeSelector";
import { useAuthStore } from "@/stores/auth-store";
import { useProductsQuery } from "@/hooks/use-products";
import {
  saveOrderFormDraft,
  loadOrderFormDraft,
  type OrderFormData,
} from "@/lib/order-form-store";
import type { UserSearchItem } from "@/lib/api/users";

const addressSchema = z.object({
  street_address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
});

const billingSchema = z.object({
  street_address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
});

const orderFormSchema = z
  .object({
    customerMode: z.enum(["existing", "new"]).default("new"),
    customerId: z.string().optional(),
    customerEmail: z.string().email("Invalid email address"),
    customerName: z.string().min(1, "Full name is required"),
    customerPhone: z.string().optional(),

    shippingAddressId: z.string().optional(),
    shippingAddress: addressSchema,
    billingAddressId: z.string().optional(),
    billingAddress: billingSchema.optional(),
    sameAsShipping: z.boolean(),

    productId: z.string().min(1, "Product is required"),
    quantity: z.number().int().min(1, "Quantity must be at least 1"),

    paymentMethod: z.enum(["ESEWA", "KHALTI", "COD"]),
    affiliateCode: z.string().optional(),
    notes: z.string().optional(),
    editId: z.string().optional(),
  })
  .refine(
    (data) => {
      // When in existing customer mode, customerId must be present
      if (data.customerMode === "existing" && !data.customerId) {
        return false;
      }
      return true;
    },
    {
      message: "Please select a customer",
      path: ["customerId"],
    },
  )
  .refine(
    (data) => {
      // When billing is not same as shipping and no saved address is used
      if (
        !data.sameAsShipping &&
        !data.billingAddressId &&
        !data.billingAddress?.city
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Billing city is required when not using shipping address",
      path: ["billingAddress", "city"],
    },
  )
  .refine(
    (data) => {
      // When no saved shipping address is used, city is required
      if (!data.shippingAddressId && !data.shippingAddress?.city) {
        return false;
      }
      return true;
    },
    {
      message: "Shipping city is required",
      path: ["shippingAddress", "city"],
    },
  );

type FormValues = z.infer<typeof orderFormSchema>;

export default function NewOrderPage() {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.currentUser);

  const [selectedUser, setSelectedUser] = useState<UserSearchItem | null>(null);

  const { data: productsData } = useProductsQuery({ page: 1, limit: 1000 });
  const products = productsData?.items || [];

  const form = useForm<FormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      customerMode: "new",
      customerId: undefined,
      customerEmail: "",
      customerName: "",
      customerPhone: "",
      shippingAddressId: undefined,
      shippingAddress: {
        city: "",
        street_address: "",
        postal_code: "",
        state: "",
        country: "",
      },
      billingAddressId: undefined,
      billingAddress: {
        city: "",
        street_address: "",
        postal_code: "",
        state: "",
        country: "",
      },
      sameAsShipping: true,
      productId: "",
      quantity: 1,
      paymentMethod: "COD" as const,
      affiliateCode: "",
      notes: "",
    },
  });

  useEffect(() => {
    const draft = loadOrderFormDraft();
    if (draft) {
      form.reset(draft);
    }
  }, [form]);

  const sameAsShipping = form.watch("sameAsShipping");
  const selectedProductId = form.watch("productId");

  useEffect(() => {
    if (currentUser && !currentUser.roles.includes("admin")) {
      // Allow vendor/admin, adjust if only admin can create orders
      // router.replace("/dashboard");
    }
  }, [currentUser, router]);

  function onSubmit(values: FormValues) {
    if (!values.productId) {
      toast.error("Please select a product.");
      return;
    }

    saveOrderFormDraft(values as OrderFormData);
    router.push("/dashboard/orders/new/review");
  }

  return (
    <div className="flex flex-col h-full bg-muted/30">
      <Topbar title="Create New Order" />

      <main className="flex-1 p-6 flex justify-center">
        <div className="max-w-4xl w-full">
          <Button
            variant="ghost"
            className="mb-4 pl-0"
            onClick={() => router.push("/dashboard/orders")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Customer Information */}
              <CustomerSelector
                form={form}
                onUserSelect={(user) => setSelectedUser(user)}
              />

              {/* Product Selection */}
              <ProductSelector form={form} products={products} />

              {/* Addresses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Shipping Address</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedUser && selectedUser.addresses.length > 0 ? (
                      <AddressPicker
                        form={form}
                        addresses={selectedUser.addresses}
                        addressType="shipping"
                      />
                    ) : (
                      <>
                        <FormField
                          control={form.control}
                          name="shippingAddress.street_address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Street Address</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="123 Main St"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="shippingAddress.city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City *</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Kathmandu"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="shippingAddress.state"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>State</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Bagmati"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="shippingAddress.postal_code"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Postal Code</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="44600"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="shippingAddress.country"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Country</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Nepal"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Billing Address</CardTitle>
                      <FormField
                        control={form.control}
                        name="sameAsShipping"
                        render={({ field }) => (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="sameAsShipping"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                            <label
                              htmlFor="sameAsShipping"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Same as shipping
                            </label>
                          </div>
                        )}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!sameAsShipping ? (
                      selectedUser && selectedUser.addresses.length > 0 ? (
                        <AddressPicker
                          form={form}
                          addresses={selectedUser.addresses}
                          addressType="billing"
                        />
                      ) : (
                        <>
                          <FormField
                            control={form.control}
                            name="billingAddress.street_address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Street Address</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="123 Main St"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="billingAddress.city"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>City *</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Kathmandu"
                                      {...field}
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="billingAddress.state"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>State</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Bagmati"
                                      {...field}
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="billingAddress.postal_code"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Postal Code</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="44600"
                                      {...field}
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="billingAddress.country"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Country</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Nepal"
                                      {...field}
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </>
                      )
                    ) : (
                      <div className="flex h-full items-center justify-center p-8 text-muted-foreground bg-muted/20 border border-dashed rounded-lg">
                        Billing address is the same as shipping
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Payment & Additional Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment & Additional Info</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Payment Method *</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              value={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="COD" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Cash on Delivery (COD)
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="ESEWA" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  eSewa
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="KHALTI" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Khalti
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <AffiliateCodeSelector
                      form={form}
                      selectedProductId={selectedProductId}
                    />
                  </div>
                  <div>
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Order Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any special instructions for delivery..."
                              className="min-h-35 resize-none"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-4 pb-8">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    const confirmLeave = window.confirm(
                      "Are you sure you want to cancel? Any unsaved changes will be lost.",
                    );
                    if (confirmLeave) {
                      router.push("/dashboard/orders");
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  // onClick={handleSubmit}
                  type="submit"
                  size="lg"
                >
                  Review Order
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}
