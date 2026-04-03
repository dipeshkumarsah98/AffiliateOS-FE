"use client";

import { useEffect, useCallback, useMemo, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { MapPin } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import type { UserAddress } from "@/lib/api/users";

interface AddressPickerProps {
    form: UseFormReturn<any>;
    addresses: UserAddress[];
    addressType: "shipping" | "billing";
    disabled?: boolean;
}

export function AddressPicker({
    form,
    addresses,
    addressType,
    disabled = false,
}: AddressPickerProps) {
    // Memoize filtered addresses to avoid unnecessary re-renders
    const filteredAddresses = useMemo(() => {
        return addresses.filter((addr) => addr.addressType === addressType);
    }, [addresses, addressType]);

    const addressIdField = addressType === "shipping" ? "shippingAddressId" : "billingAddressId";
    const addressPrefix = addressType === "shipping" ? "shippingAddress" : "billingAddress";

    const selectedAddressId = form.watch(addressIdField);

    // Track if initial auto-selection has been done to prevent re-triggering
    const hasAutoSelectedRef = useRef(false);
    const prevAddressesLengthRef = useRef(0);

    const handleAddressSelect = useCallback((addressId: string) => {
        if (addressId === "custom") {
            form.setValue(addressIdField, undefined);
            form.setValue(`${addressPrefix}.street_address`, "");
            form.setValue(`${addressPrefix}.city`, "");
            form.setValue(`${addressPrefix}.state`, "");
            form.setValue(`${addressPrefix}.postal_code`, "");
            form.setValue(`${addressPrefix}.country`, "");
        } else {
            const address = filteredAddresses.find((addr) => addr.id === addressId);
            if (address) {
                form.setValue(addressIdField, addressId);
                form.setValue(`${addressPrefix}.street_address`, address.street_address);
                form.setValue(`${addressPrefix}.city`, address.city);
                form.setValue(`${addressPrefix}.state`, address.state);
                form.setValue(`${addressPrefix}.postal_code`, address.postal_code);
            }
        }
    }, [form, addressIdField, addressPrefix, filteredAddresses]);

    // Auto-select default address when addresses become available (only once per customer)
    useEffect(() => {
        // Reset the flag if we have new addresses (new customer selected)
        if (filteredAddresses.length !== prevAddressesLengthRef.current) {
            hasAutoSelectedRef.current = false;
            prevAddressesLengthRef.current = filteredAddresses.length;
        }

        if (filteredAddresses.length > 0 && !selectedAddressId && !hasAutoSelectedRef.current) {
            const defaultAddress = filteredAddresses.find((addr) => addr.isDefault);
            if (defaultAddress) {
                handleAddressSelect(defaultAddress.id);
            } else {
                handleAddressSelect(filteredAddresses[0].id);
            }
            hasAutoSelectedRef.current = true;
        }
    }, [filteredAddresses, selectedAddressId, handleAddressSelect]);

    const isCustomAddress = !selectedAddressId;
    const hasAddresses = filteredAddresses.length > 0;

    return (
        <div className="space-y-4">
            {hasAddresses && (
                <div className="space-y-2 w-full">
                    <Label>Select Saved Address</Label>
                    <Select
                        value={selectedAddressId || "custom"}
                        onValueChange={handleAddressSelect}
                        disabled={disabled}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose an address" />
                        </SelectTrigger>
                        <SelectContent>
                            {filteredAddresses.map((address) => (
                                <SelectItem key={address.id} value={address.id} className="cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-3 w-3" />
                                        <span>
                                            {address.city}, {address.state}
                                            {address.isDefault && (
                                                <Badge variant="secondary" className="ml-2 text-xs text-white">
                                                    Default
                                                </Badge>
                                            )}
                                        </span>
                                    </div>
                                </SelectItem>
                            ))}
                            <SelectItem value="custom" className="cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3" />
                                    <span>Enter Custom Address</span>
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            {isCustomAddress && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor={`${addressPrefix}.street_address`}>
                            Street Address
                        </Label>
                        <Input
                            id={`${addressPrefix}.street_address`}
                            placeholder="123 Main St"
                            {...form.register(`${addressPrefix}.street_address`)}
                            disabled={disabled}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor={`${addressPrefix}.city`}>City *</Label>
                            <Input
                                id={`${addressPrefix}.city`}
                                placeholder="Kathmandu"
                                {...form.register(`${addressPrefix}.city`)}
                                disabled={disabled}
                            />
                            {(() => {
                                const errors = form.formState.errors as any;
                                const addressErrors = errors[addressPrefix];
                                return addressErrors?.city && (
                                    <p className="text-sm text-destructive">
                                        {addressErrors.city.message}
                                    </p>
                                );
                            })()}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`${addressPrefix}.state`}>State</Label>
                            <Input
                                id={`${addressPrefix}.state`}
                                placeholder="Bagmati"
                                {...form.register(`${addressPrefix}.state`)}
                                disabled={disabled}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor={`${addressPrefix}.postal_code`}>
                                Postal Code
                            </Label>
                            <Input
                                id={`${addressPrefix}.postal_code`}
                                placeholder="44600"
                                {...form.register(`${addressPrefix}.postal_code`)}
                                disabled={disabled}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`${addressPrefix}.country`}>Country</Label>
                            <Input
                                id={`${addressPrefix}.country`}
                                placeholder="Nepal"
                                {...form.register(`${addressPrefix}.country`)}
                                disabled={disabled}
                            />
                        </div>
                    </div>
                </>
            )}

            {!isCustomAddress && selectedAddressId && (
                <div className="rounded-lg border bg-accent/30 p-4">
                    <div className="font-medium mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        Selected Address:
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                        {(() => {
                            const addr = filteredAddresses.find((a) => a.id === selectedAddressId);
                            if (!addr) return null;
                            return (
                                <>
                                    {addr.street_address && <p>{addr.street_address}</p>}
                                    <p>
                                        {addr.city}, {addr.state} {addr.postal_code}
                                    </p>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}
