"use client";

import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { X, Search, User, Mail, Phone, Loader2, Building2, MapPin } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { useSearchVendors } from "@/hooks/use-users";
import { useDebounce } from "@/hooks/use-debounce";
import type { UserSearchItem } from "@/lib/api/users";
import type { DraftVendorInfo } from "@/lib/affiliate-form-store";

const AFFILIATE_TYPE_MAP: Record<string, "influencer" | "reseller" | "referral" | "partner"> = {
    INFLUENCER: "influencer",
    RESELLER: "reseller",
    REFERRAL: "referral",
    PARTNER: "partner",
};

const ROLE_BADGE_VARIANT: Record<string, "default" | "secondary"> = {
    admin: "default",
    vendor: "secondary",
};

interface VendorSelectorProps {
    form: UseFormReturn<any>;
    disabled?: boolean;
}

export function VendorSelector({ form, disabled }: VendorSelectorProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedVendor, setSelectedVendor] = useState<UserSearchItem | null>(null);
    const debouncedSearch = useDebounce(searchTerm, 500);

    const { data: searchResults, isLoading } = useSearchVendors(debouncedSearch);

    const vendorMode = form.watch("vendorMode");

    // Restore selected vendor from draft on mount
    useEffect(() => {
        const draftInfo = form.getValues("draftVendorInfo") as DraftVendorInfo | undefined;
        if (vendorMode === "existing" && draftInfo?.id && !selectedVendor) {
            setSelectedVendor({
                id: draftInfo.id,
                name: draftInfo.name,
                email: draftInfo.email,
                phone: draftInfo.phone,
                roles: draftInfo.roles,
                createdAt: "",
                addresses: [],
            });
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    function handleVendorSelect(user: UserSearchItem) {
        setSelectedVendor(user);
        setSearchTerm("");

        const billingAddr = user.addresses?.find(
            (a) => a.addressType === "billing"
        ) ?? user.addresses?.[0]; // fallback to any address if billing not found


        form.setValue("vendorMode", "existing");
        form.setValue("vendorId", user.id);
        form.setValue("fullName", user.name);
        form.setValue("email", user.email);
        form.setValue("contactNumber", user.phone || "");
        form.setValue(
            "affiliateType",
            AFFILIATE_TYPE_MAP[user.extras?.affiliateType ?? ""] ?? "influencer"
        );
        form.setValue("streetAddress", billingAddr?.street_address ?? "");
        form.setValue("city", billingAddr?.city ?? "");
        form.setValue("state", billingAddr?.state ?? "");
        form.setValue("postalCode", billingAddr?.postal_code ?? "");
        form.setValue("bankName", user.extras?.bankName ?? "");
        form.setValue("accountNumber", user.extras?.accountNumber ?? "");
        form.setValue("draftVendorInfo", {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            roles: user.roles,
        } satisfies DraftVendorInfo);
    }

    function handleClearSelection() {
        setSelectedVendor(null);
        form.setValue("vendorId", undefined);
        form.setValue("fullName", "");
        form.setValue("email", "");
        form.setValue("contactNumber", "");
        form.setValue("affiliateType", "influencer");
        form.setValue("streetAddress", "");
        form.setValue("city", "");
        form.setValue("state", "");
        form.setValue("postalCode", "");
        form.setValue("bankName", "");
        form.setValue("accountNumber", "");
        form.setValue("draftVendorInfo", undefined);
    }

    function handleTabChange(value: string) {
        const mode = value as "existing" | "new";
        form.setValue("vendorMode", mode);
        if (mode === "new") {
            handleClearSelection();
            form.setValue("vendorMode", "new");
        }
    }

    if (disabled) return null;

    return (
        <Card className="shadow-sm">
            <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-base">Vendor / Admin Information</CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                            Select an existing vendor or create a new one.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <Tabs
                    value={vendorMode}
                    onValueChange={handleTabChange}
                    className="w-full"
                >
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="existing">Existing Vendor</TabsTrigger>
                        <TabsTrigger value="new">New Vendor</TabsTrigger>
                    </TabsList>

                    <TabsContent value="existing" className="space-y-4">
                        {!selectedVendor ? (
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
                                        <ScrollArea className="h-[360px] rounded-md border bg-muted/20">
                                            <div className="p-3 space-y-2">
                                                {searchResults.items.map((user, index) => (
                                                    <div key={user.id}>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleVendorSelect(user)}
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
                                                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                                    <div className="flex gap-1">
                                                                        {user.roles.map((role) => (
                                                                            <Badge
                                                                                key={role}
                                                                                variant={ROLE_BADGE_VARIANT[role] ?? "secondary"}
                                                                                className="text-xs capitalize text-white"
                                                                            >
                                                                                {role}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                    {user.extras?.affiliateType && (
                                                                        <Badge variant="outline" className="text-xs capitalize">
                                                                            {user.extras.affiliateType.toLowerCase()}
                                                                        </Badge>
                                                                    )}
                                                                </div>
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
                                        <p>No vendors found matching &ldquo;{searchTerm}&rdquo;</p>
                                    </div>
                                )}

                                {!searchTerm && !searchResults && (
                                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                        <Search className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                        <p>Start typing to search for vendors or admins</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="border rounded-lg p-4 bg-accent/50">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="default">Selected Vendor</Badge>
                                            {selectedVendor.roles.map((role) => (
                                                <Badge
                                                    key={role}
                                                    variant={ROLE_BADGE_VARIANT[role] ?? "secondary"}
                                                    className="text-xs capitalize text-white"
                                                >
                                                    {role}
                                                </Badge>
                                            ))}
                                        </div>
                                        <div className="font-medium flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            {selectedVendor.name}
                                        </div>
                                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                                            <Mail className="h-3 w-3" />
                                            {selectedVendor.email}
                                        </div>
                                        {selectedVendor.phone && (
                                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                <Phone className="h-3 w-3" />
                                                {selectedVendor.phone}
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

                    <TabsContent value="new" className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="fullName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Ram Bahadur" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Address *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="ram@example.com.np"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="affiliateType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Affiliate Type</FormLabel>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select affiliate type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="influencer">Influencer</SelectItem>
                                                <SelectItem value="reseller">Reseller</SelectItem>
                                                <SelectItem value="referral">Referral</SelectItem>
                                                <SelectItem value="partner">Partner</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="contactNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contact Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+977 9800000000" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Structured Address Fields */}
                        <FormField
                            control={form.control}
                            name="streetAddress"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Street Address</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            rows={2}
                                            placeholder="Tinkune, Ward No. 32"
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>City</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Kathmandu" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="state"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>State / Province</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Bagmati" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="postalCode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Postal Code</FormLabel>
                                        <FormControl>
                                            <Input placeholder="44600" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
