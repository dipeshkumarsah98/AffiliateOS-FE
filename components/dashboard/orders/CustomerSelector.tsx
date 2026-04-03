"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { X, Search, User, Mail, Phone, Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

import { useSearchUsers } from "@/hooks/use-users";
import { useDebounce } from "@/hooks/use-debounce";
import type { UserSearchItem } from "@/lib/api/users";

interface CustomerSelectorProps {
    form: UseFormReturn<any>;
    onUserSelect: (user: UserSearchItem | null) => void;
}

export function CustomerSelector({ form, onUserSelect }: CustomerSelectorProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState<UserSearchItem | null>(null);
    const debouncedSearch = useDebounce(searchTerm, 500);

    const { data: searchResults, isLoading } = useSearchUsers(debouncedSearch);

    const customerMode = form.watch("customerMode");

    const handleUserSelect = (user: UserSearchItem) => {
        setSelectedUser(user);
        setSearchTerm("");
        form.setValue("customerId", user.id);
        form.setValue("customerEmail", user.email);
        form.setValue("customerName", user.name);
        form.setValue("customerPhone", user.phone);
        // Clear previous address selections so AddressPicker can auto-select defaults
        form.setValue("shippingAddressId", undefined);
        form.setValue("billingAddressId", undefined);
        onUserSelect(user);
    };

    const handleClearSelection = () => {
        setSelectedUser(null);
        form.setValue("customerId", undefined);
        form.setValue("customerEmail", "");
        form.setValue("customerName", "");
        form.setValue("customerPhone", "");
        // Clear address selections when clearing customer
        form.setValue("shippingAddressId", undefined);
        form.setValue("billingAddressId", undefined);
        onUserSelect(null);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Customer Information</CardTitle>
                <CardDescription>
                    Select an existing customer or enter new customer details
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs
                    value={customerMode}
                    onValueChange={(value) => form.setValue("customerMode", value as "existing" | "new")}
                    className="w-full"
                >
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="existing">Existing Customer</TabsTrigger>
                        <TabsTrigger value="new">New Customer</TabsTrigger>
                    </TabsList>

                    <TabsContent value="existing" className="space-y-4">
                        {!selectedUser ? (
                            <>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name, email, or phone..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>

                                {isLoading && searchTerm && (
                                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                        Searching...
                                    </div>
                                )}

                                {!isLoading && searchResults && searchResults.items.length > 0 && (
                                    <div className="relative">
                                        <ScrollArea className="h-[400px] rounded-md border bg-muted/20">
                                            <div className="p-3 space-y-2">
                                                {searchResults.items.map((user, index) => (
                                                    <div key={user.id}>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUserSelect(user)}
                                                            className="w-full text-left p-4 rounded-lg bg-background 
                                                            hover:bg-accent transition-all duration-200 
                                                            border border-border hover:border-primary hover:shadow-sm"
                                                        >
                                                            <div className="flex items-start justify-between">
                                                                <div className="space-y-1.5 flex-1">
                                                                    <div className="font-medium flex items-center gap-2">
                                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                                        <span className="text-foreground">{user.name}</span>
                                                                    </div>
                                                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                                        <Mail className="h-3 w-3" />
                                                                        {user.email}
                                                                    </div>
                                                                    {user.phone && (
                                                                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                                            <Phone className="h-3 w-3" />
                                                                            {user.phone}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <Badge variant="secondary" className="text-xs text-white shrink-0">
                                                                    {user.addresses.length} address{user.addresses.length !== 1 ? "es" : ""}
                                                                </Badge>
                                                            </div>
                                                        </button>
                                                        {index < searchResults.items.length - 1 && (
                                                            <div className="h-px bg-border/50 my-2" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background/80 to-transparent pointer-events-none rounded-b-md" />
                                    </div>
                                )}

                                {!isLoading && searchResults && searchResults.items.length === 0 && searchTerm && (
                                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                        <User className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                        <p>No customers found matching "{searchTerm}"</p>
                                    </div>
                                )}

                                {!searchTerm && (
                                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                        <Search className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                        <p>Start typing to search for customers</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="border rounded-lg p-4 bg-accent/50">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="default">Selected Customer</Badge>
                                        </div>
                                        <div className="font-medium flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            {selectedUser.name}
                                        </div>
                                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                                            <Mail className="h-3 w-3" />
                                            {selectedUser.email}
                                        </div>
                                        {selectedUser.phone && (
                                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                <Phone className="h-3 w-3" />
                                                {selectedUser.phone}
                                            </div>
                                        )}
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
                        )}
                    </TabsContent>

                    <TabsContent value="new" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="customerEmail">Email *</Label>
                                <Input
                                    id="customerEmail"
                                    type="email"
                                    placeholder="customer@example.com"
                                    {...form.register("customerEmail")}
                                />
                                {form.formState.errors.customerEmail && (
                                    <p className="text-sm text-destructive">
                                        {form.formState.errors.customerEmail.message as string}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="customerName">Full Name *</Label>
                                <Input
                                    id="customerName"
                                    placeholder="John Doe"
                                    {...form.register("customerName")}
                                />
                                {form.formState.errors.customerName && (
                                    <p className="text-sm text-destructive">
                                        {form.formState.errors.customerName.message as string}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="customerPhone">Phone Number</Label>
                                <Input
                                    id="customerPhone"
                                    placeholder="+1234567890"
                                    {...form.register("customerPhone")}
                                />
                                {form.formState.errors.customerPhone && (
                                    <p className="text-sm text-destructive">
                                        {form.formState.errors.customerPhone.message as string}
                                    </p>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
