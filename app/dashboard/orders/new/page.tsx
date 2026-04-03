"use client";

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { ArrowLeft, Plus, Trash2, Search, Package, CheckCircle2, XCircle, Loader2 } from "lucide-react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Topbar } from "@/components/layout/Topbar";
import { useAuthStore } from "@/stores/auth-store";
import { useProductsQuery } from "@/hooks/use-products";
import { saveOrderFormDraft, loadOrderFormDraft, type OrderFormData } from "@/lib/order-form-store";
import { useValidateAffiliateCode } from "@/hooks/use-orders";
import { useDebounce } from "@/hooks/use-debounce";

const addressSchema = z.object({
    street_address: z.string().optional(),
    city: z.string().min(1, "City is required"),
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

const orderFormSchema = z.object({
    customerEmail: z.string().email("Invalid email address"),
    customerName: z.string().min(1, "Full name is required"),
    customerPhone: z.string().optional(),

    shippingAddress: addressSchema,
    billingAddress: billingSchema.optional(),
    sameAsShipping: z.boolean(),

    items: z.array(
        z.object({
            productId: z.string().min(1, "Product is required"),
            quantity: z.number().int().min(1, "Quantity must be at least 1"),
        })
    ).min(1, "At least one item is required"),

    paymentMethod: z.enum(["ESEWA", "KHALTI", "COD"]),
    affiliateCode: z.string().optional(),
    notes: z.string().optional(),
    editId: z.string().optional(),
}).refine(
    (data) => {
        if (!data.sameAsShipping && !data.billingAddress?.city) {
            return false;
        }
        return true;
    },
    {
        message: "Billing city is required when not using shipping address",
        path: ["billingAddress", "city"],
    }
);

type FormValues = z.infer<typeof orderFormSchema>;

export default function NewOrderPage() {
    const router = useRouter();
    const currentUser = useAuthStore((s) => s.currentUser);

    const { data: productsData } = useProductsQuery({ page: 1, limit: 1000 });
    const products = productsData?.items || [];

    const form = useForm<FormValues>({
        resolver: zodResolver(orderFormSchema),
        defaultValues: {
            customerEmail: "",
            customerName: "",
            customerPhone: "",
            shippingAddress: { city: "", street_address: "", postal_code: "", state: "", country: "" },
            billingAddress: { city: "", street_address: "", postal_code: "", state: "", country: "" },
            sameAsShipping: true,
            items: [{ productId: "", quantity: 1 }],
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

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    const sameAsShipping = form.watch("sameAsShipping");
    const formItems = form.watch("items");
    const currentAffiliateCode = form.watch("affiliateCode");
    const debouncedAffiliateCode = useDebounce(currentAffiliateCode ?? "", 500);

    const { data: affiliateValidation, isFetching: validatingCode, isError: affiliateCodeError } = useValidateAffiliateCode(debouncedAffiliateCode);

    useEffect(() => {
        if (currentUser && !currentUser.roles.includes("admin")) {
            // Allow vendor/admin, adjust if only admin can create orders
            // router.replace("/dashboard");
        }
    }, [currentUser, router]);

    function onSubmit(values: FormValues) {
        console.log("Form Values:", values);
        if (values.items.length === 0) {
            toast.error("Please add at least one product to the order.");
            return;
        }

        saveOrderFormDraft(values as OrderFormData);
        router.push("/dashboard/orders/new/review");
    }

    const getProductDetails = (id: string) => {
        return products.find((p) => p.id === id);
    };

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
                            <Card>
                                <CardHeader>
                                    <CardTitle>Customer Information</CardTitle>
                                    <CardDescription>Enter the customer's contact details</CardDescription>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="customerEmail"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="customer@example.com" type="email" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="customerName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Full Name *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="John Doe" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="customerPhone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone Number</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="+1234567890" {...field} value={field.value || ""} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            {/* Order Items */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Order Items</CardTitle>
                                        <CardDescription>Select products and quantities</CardDescription>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => append({ productId: "", quantity: 1 })}
                                    >
                                        <Plus className="mr-2 h-4 w-4" /> Add Item
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {fields.map((field, index) => {
                                        const selectedId = formItems[index]?.productId;
                                        const product = getProductDetails(selectedId);

                                        return (
                                            <div key={field.id} className="flex flex-col sm:flex-row items-start sm:items-end gap-4 p-4 border rounded-lg">
                                                <FormField
                                                    control={form.control}
                                                    name={`items.${index}.productId`}
                                                    render={({ field: selectField }) => (
                                                        <FormItem className="flex-1 w-full">
                                                            <FormLabel>Product *</FormLabel>
                                                            <Select
                                                                onValueChange={selectField.onChange}
                                                                defaultValue={selectField.value}
                                                                value={selectField.value}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Select a product" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {products.map((p) => (
                                                                        <SelectItem key={p.id} value={p.id}>
                                                                            {p.title} - RS {p.price.toFixed(2)} ({p.totalStock} in stock)
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name={`items.${index}.quantity`}
                                                    render={({ field: qtyField }) => (
                                                        <FormItem className="w-full sm:w-32">
                                                            <FormLabel>Quantity *</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    min="1"
                                                                    max={product?.totalStock || 999}
                                                                    {...qtyField}
                                                                    onChange={(e) => qtyField.onChange(parseInt(e.target.value, 10) || 1)}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="mt-8 shrink-0 text-destructive"
                                                    onClick={() => remove(index)}
                                                    disabled={fields.length === 1}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        );
                                    })}
                                    {fields.length === 0 && (
                                        <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                                            <Package className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                            <p>No items added to this order.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Addresses */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Shipping Address</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="shippingAddress.street_address"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Street Address</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="123 Main St" {...field} value={field.value || ""} />
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
                                                            <Input placeholder="Kathmandu" {...field} />
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
                                                            <Input placeholder="Bagmati" {...field} value={field.value || ""} />
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
                                                            <Input placeholder="44600" {...field} value={field.value || ""} />
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
                                                            <Input placeholder="Nepal" {...field} value={field.value || ""} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
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
                                            <>
                                                <FormField
                                                    control={form.control}
                                                    name="billingAddress.street_address"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Street Address</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="123 Main St" {...field} value={field.value || ""} />
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
                                                                    <Input placeholder="Kathmandu" {...field} value={field.value || ""} />
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
                                                                    <Input placeholder="Bagmati" {...field} value={field.value || ""} />
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
                                                                    <Input placeholder="44600" {...field} value={field.value || ""} />
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
                                                                    <Input placeholder="Nepal" {...field} value={field.value || ""} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </>
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
                                                                <FormLabel className="font-normal">Cash on Delivery (COD)</FormLabel>
                                                            </FormItem>
                                                            <FormItem className="flex items-center space-x-3 space-y-0">
                                                                <FormControl>
                                                                    <RadioGroupItem value="ESEWA" />
                                                                </FormControl>
                                                                <FormLabel className="font-normal">eSewa</FormLabel>
                                                            </FormItem>
                                                            <FormItem className="flex items-center space-x-3 space-y-0">
                                                                <FormControl>
                                                                    <RadioGroupItem value="KHALTI" />
                                                                </FormControl>
                                                                <FormLabel className="font-normal">Khalti</FormLabel>
                                                            </FormItem>
                                                        </RadioGroup>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="affiliateCode"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex justify-between">
                                                        <span>Affiliate Code (Optional)</span>
                                                        {validatingCode &&
                                                            <span className="text-xs text-muted-foreground flex items-center pr-2">
                                                                <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Validating...
                                                            </span>
                                                        }
                                                    </FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input placeholder="e.g. SAVE20" {...field} value={field.value || ""} />
                                                            {
                                                                validatingCode && (
                                                                    <div className="absolute right-3 top-2.5">
                                                                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                                                    </div>
                                                                )
                                                            }
                                                            {!validatingCode && debouncedAffiliateCode && debouncedAffiliateCode.length > 2 && (
                                                                <div className="absolute right-3 top-2.5">
                                                                    {affiliateCodeError || (affiliateValidation && !affiliateValidation.isActive) ? (
                                                                        <XCircle className="h-5 w-5 text-destructive hover:cursor-pointer transition-colors hover:text-red-700" onClick={() => form.setValue("affiliateCode", "")} />
                                                                    ) : affiliateValidation?.isActive ? (
                                                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                                    ) : null}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </FormControl>
                                                    {!validatingCode && debouncedAffiliateCode && debouncedAffiliateCode.length > 2 && affiliateValidation?.isActive && (
                                                        <p className="text-sm text-green-600 font-medium mt-1">
                                                            Code applied! {affiliateValidation.discountType === "PERCENTAGE" ? `${affiliateValidation.discountValue}%` : `RS ${affiliateValidation.discountValue}`} discount
                                                        </p>
                                                    )}
                                                    {!validatingCode && debouncedAffiliateCode && debouncedAffiliateCode.length > 2 && (affiliateCodeError || (affiliateValidation && !affiliateValidation.isActive)) && (
                                                        <p className="text-sm text-destructive font-medium mt-1">
                                                            Invalid or expired affiliate code
                                                        </p>
                                                    )}
                                                    <FormMessage />
                                                </FormItem>
                                            )}
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
                                                            className="min-h-[140px] resize-none"
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
                                        const confirmLeave = window.confirm("Are you sure you want to cancel? Any unsaved changes will be lost.");
                                        if (confirmLeave) {
                                            router.push("/dashboard/orders");
                                        }
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    // onClick={handleSubmit}
                                    type="submit" size="lg">
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
