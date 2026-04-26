"use client";

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import * as z from "zod";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useUserDetail } from "@/hooks/use-users";

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
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Topbar } from "@/components/layout/Topbar";
import { Spinner } from "@/components/ui/spinner";
import {
  saveUserFormDraft,
  loadUserFormDraft,
  type UserFormData,
} from "@/lib/user-form-store";

const addressSchema = z.object({
  addressType: z.enum(["shipping", "billing"]),
  street_address: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postal_code: z.string().min(1, "Postal code is required"),
  isDefault: z.boolean().default(false),
});

const userFormSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  roles: z.array(z.string()).min(1, "Select at least one role"),
  isActive: z.boolean().default(true),
  addresses: z.array(addressSchema).optional(),
});

type FormValues = z.infer<typeof userFormSchema>;

export default function NewUserPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("editId");
  const isEdit = Boolean(editId);

  // Fetch existing user data for edit mode
  const { data: existingUser, isLoading: isLoadingUser } =
    useUserDetail(editId);

  const form = useForm<FormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      roles: ["staff"],
      isActive: true,
      addresses: [
        {
          addressType: "shipping",
          street_address: "",
          city: "",
          state: "",
          postal_code: "",
          isDefault: true,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: "addresses",
    control: form.control,
  });

  // Restore draft data when navigating back from review page (create mode only)
  useEffect(() => {
    if (!editId) {
      const draft = loadUserFormDraft();
      if (draft && !draft.editId) {
        form.reset(draft);
      }
    }
  }, [editId, form]);

  // Load existing user data for edit mode
  useEffect(() => {
    if (existingUser && editId) {
      const draft = loadUserFormDraft();
      // If draft exists and matches editId, use draft (for back navigation)
      if (draft && draft.editId === editId) {
        form.reset(draft);
        return;
      }

      // Otherwise load from API data
      form.reset({
        name: existingUser.name || "",
        email: existingUser.email,
        phone: existingUser.phone || "",
        roles: existingUser.roles,
        isActive: true, // API doesn't return this, default to true
        addresses: existingUser.addresses.map((addr) => ({
          addressType: addr.addressType,
          street_address: addr.street_address,
          city: addr.city,
          state: addr.state,
          postal_code: addr.postal_code,
          isDefault: addr.isDefault,
        })),
      });
    }
  }, [existingUser, editId, form]);

  function onSubmit(values: FormValues) {
    const formData: UserFormData = {
      ...values,
      editId: editId || undefined,
    };
    saveUserFormDraft(formData);
    router.push("/dashboard/users/new/review");
  }

  return (
    <div className="flex flex-col h-full bg-muted/30">
      <Topbar title={isEdit ? "Edit User" : "Create New User"} />

      <main className="flex-1 p-6 flex justify-center">
        <div className="max-w-4xl w-full">
          <Button
            variant="ghost"
            className="mb-4 pl-0"
            onClick={() => router.push("/dashboard/users")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>

          {/* Loading state for edit mode */}
          {isEdit && isLoadingUser ? (
            <div className="flex items-center justify-center py-20">
              <Spinner className="w-8 h-8 text-primary" />
              <span className="ml-3 text-sm text-muted-foreground">
                Loading user data...
              </span>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-6">
                    {/* General Info */}
                    <Card>
                      <CardHeader>
                        <CardTitle>General Information</CardTitle>
                        <CardDescription>
                          Enter the basic details of the user.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email *</FormLabel>
                                <FormControl>
                                  <Input
                                    type="email"
                                    placeholder="john@example.com"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                  <Input placeholder="+123456789" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Addresses */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div>
                          <CardTitle>Addresses</CardTitle>
                          <CardDescription>
                            Add shipping and billing addresses for the user.
                          </CardDescription>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            append({
                              addressType: "shipping",
                              street_address: "",
                              city: "",
                              state: "",
                              postal_code: "",
                              isDefault: false,
                            })
                          }
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Address
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {fields.map((field, index) => (
                          <div
                            key={field.id}
                            className="relative p-4 rounded-lg border bg-muted/20"
                          >
                            <div className="absolute top-2 right-2">
                              {fields.length > 0 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() => remove(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                              <FormField
                                control={form.control}
                                name={`addresses.${index}.addressType`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Address Type</FormLabel>
                                    <Select
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="shipping">
                                          Shipping
                                        </SelectItem>
                                        <SelectItem value="billing">
                                          Billing
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`addresses.${index}.isDefault`}
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 pt-8">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel>Default Address</FormLabel>
                                    </div>
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={form.control}
                              name={`addresses.${index}.street_address`}
                              render={({ field }) => (
                                <FormItem className="mb-4">
                                  <FormLabel>Street Address</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="123 Main St, Apt 4B"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <FormField
                                control={form.control}
                                name={`addresses.${index}.city`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>City</FormLabel>
                                    <FormControl>
                                      <Input placeholder="City" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`addresses.${index}.state`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>State/Province</FormLabel>
                                    <FormControl>
                                      <Input placeholder="State" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`addresses.${index}.postal_code`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Postal Code</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Zip/Postal"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        ))}
                        {fields.length === 0 && (
                          <div className="text-center p-6 text-muted-foreground border rounded-lg border-dashed">
                            No addresses added
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    {/* Settings Sidebar */}
                    <Card className="sticky top-6">
                      <CardHeader>
                        <CardTitle>Access & Status</CardTitle>
                        <CardDescription>
                          Configure user role and account status.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <FormField
                          control={form.control}
                          name="isActive"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Active Account
                                </FormLabel>
                                <CardDescription>
                                  Unchecking will disable login
                                </CardDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="roles"
                          render={() => (
                            <FormItem>
                              <div className="mb-4">
                                <FormLabel className="text-base">
                                  User Roles
                                </FormLabel>
                                <CardDescription>
                                  Select the roles to assign to this user.
                                </CardDescription>
                              </div>
                              {["admin", "staff"].map((item) => (
                                <FormField
                                  key={item}
                                  control={form.control}
                                  name="roles"
                                  render={({ field }) => {
                                    return (
                                      <FormItem
                                        key={item}
                                        className="flex flex-row items-start space-x-3 space-y-0 mb-3"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(
                                              item,
                                            )}
                                            onCheckedChange={(checked) => {
                                              return checked
                                                ? field.onChange([
                                                    ...field.value,
                                                    item,
                                                  ])
                                                : field.onChange(
                                                    field.value?.filter(
                                                      (value) => value !== item,
                                                    ),
                                                  );
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="font-normal capitalize">
                                          {item}
                                        </FormLabel>
                                      </FormItem>
                                    );
                                  }}
                                />
                              ))}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                      <div className="p-6 pt-0">
                        <Button type="submit" className="w-full">
                          {isEdit ? "Continue to Review" : "Continue to Review"}
                        </Button>
                      </div>
                    </Card>
                  </div>
                </div>
              </form>
            </Form>
          )}
        </div>
      </main>
    </div>
  );
}
