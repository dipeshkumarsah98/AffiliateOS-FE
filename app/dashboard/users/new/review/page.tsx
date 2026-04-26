"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  Shield,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { useCreateUser, useUpdateUser } from "@/hooks/use-users";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Topbar } from "@/components/layout/Topbar";
import {
  loadUserFormDraft,
  clearUserFormDraft,
  type UserFormData,
} from "@/lib/user-form-store";

export default function ReviewUserPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<UserFormData | null>(null);

  const isEdit = Boolean(draft?.editId);
  const editId = draft?.editId || "";

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser(editId);

  const mutation = isEdit ? updateMutation : createMutation;
  const { mutateAsync, error, isPending } = mutation;

  useEffect(() => {
    const savedDraft = loadUserFormDraft();
    if (!savedDraft) {
      toast.error("No user data found. Please restart the process.");
      router.replace("/dashboard/users/new");
    } else {
      setDraft(savedDraft);
    }
  }, [router]);

  if (!draft) return null;

  const handleSubmit = async () => {
    try {
      // Remove editId from payload before sending to API
      const { editId: _, ...payload } = draft;

      await mutateAsync(payload);
      toast.success(
        isEdit ? "User updated successfully!" : "User created successfully!",
      );
      clearUserFormDraft();
      router.push("/dashboard/users");
    } catch (err: unknown) {
      console.error(
        isEdit ? "Failed to update user:" : "Failed to create user:",
        err,
      );

      const errorMessage =
        err instanceof Error
          ? err.message
          : isEdit
            ? "Failed to update user"
            : "Failed to create user";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="flex flex-col h-full bg-muted/30">
      <Topbar title={isEdit ? "Review User Update" : "Review New User"} />

      <main className="flex-1 p-6 flex justify-center">
        <div className="max-w-4xl w-full">
          <Button
            variant="ghost"
            className="mb-4 pl-0"
            onClick={() => {
              const path = isEdit
                ? `/dashboard/users/new?editId=${draft.editId}`
                : "/dashboard/users/new";
              router.push(path);
            }}
            disabled={isPending}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Edit Information
          </Button>
          {error && (
            <p className="text-destructive ml-2 mb-1 flex items-center text-sm mt-2">
              <AlertCircle className="inline h-4 w-4 mr-1" />
              {error instanceof Error ? error.message : "Something went wrong"}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Personal Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-medium flex items-center gap-2">
                      <User className="h-3 w-3" /> Name:
                    </span>
                    <p className="font-medium text-base">{draft.name}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-medium flex items-center gap-2">
                      <Mail className="h-3 w-3" /> Email:
                    </span>
                    <p>{draft.email}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-medium flex items-center gap-2">
                      <Phone className="h-3 w-3" /> Phone:
                    </span>
                    <p>{draft.phone || "N/A"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Addresses */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Addresses
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {draft.addresses && draft.addresses.length > 0 ? (
                    draft.addresses.map((address, index) => (
                      <div
                        key={index}
                        className="space-y-1 rounded-md bg-muted/50 p-4 border border-border"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold capitalize">
                            {address.addressType} Address
                          </span>
                          {address.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground">
                          {[
                            address.street_address,
                            address.city,
                            address.state,
                            address.postal_code,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground col-span-full">
                      No addresses specified.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Summary Sidebar */}
            <div className="space-y-6">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Account Status
                  </CardTitle>
                  <CardDescription>Review roles and status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground uppercase tracking-wider font-medium">
                      Status
                    </span>
                    <div className="flex items-center gap-2">
                      {draft.isActive ? (
                        <Badge className="bg-green-500 hover:bg-green-600 text-white">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-sm text-muted-foreground uppercase tracking-wider font-medium">
                      Assigned Roles
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {draft.roles.map((role) => (
                        <Badge
                          key={role}
                          variant="outline"
                          className="capitalize px-3 py-1"
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3 text-primary" />
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={isPending}
                  >
                    {isPending
                      ? isEdit
                        ? "Updating..."
                        : "Creating..."
                      : isEdit
                        ? "Confirm & Update User"
                        : "Confirm & Create User"}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
