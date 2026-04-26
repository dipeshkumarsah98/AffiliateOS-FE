"use client";

import { formatRelative, parseISO } from "date-fns";
import {
  User,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  MapPin,
  Loader2,
  Edit,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Skeleton } from "@/components/ui/skeleton";
import UserAvatar from "@/components/common/UserAvatar";
import RoleBadge from "@/components/common/RoleBadge";
import { useUserDetail } from "@/hooks/use-users";

interface UserDetailDialogProps {
  userId: string | null;
  onClose: () => void;
}

export function UserDetailDialog({ userId, onClose }: UserDetailDialogProps) {
  const { data: user, isLoading, error } = useUserDetail(userId);
  const router = useRouter();

  if (!userId) return null;

  const handleEdit = () => {
    onClose();
    router.push(`/dashboard/users/${userId}/edit`);
  };

  const displayName =
    user?.name || (user?.email ? user.email.split("@")[0] : "Unknown");
  const displayId = user?.id
    ? user.id.split("-").shift()?.toUpperCase() || user.id
    : "...";

  return (
    <Dialog open={!!userId} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden shadow-xl border-slate-200">
        <VisuallyHidden>
          <DialogTitle>User Profile: {user?.name}</DialogTitle>
        </VisuallyHidden>

        <div className="flex flex-col max-h-[85vh]">
          {/* Header Banner */}
          <div className="relative px-8 pt-8 pb-6 border-b bg-linear-to-br from-indigo-50/50 to-blue-50/20">
            {/* Edit Button */}
            {!isLoading && (
              <div className="absolute top-4 right-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="gap-2 hover:bg-white"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit User
                </Button>
              </div>
            )}

            <div className="flex items-start gap-5">
              <div className="shrink-0 p-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center w-20 h-20">
                {isLoading ? (
                  <Skeleton className="w-16 h-16 rounded-xl" />
                ) : (
                  <div className="w-16 h-16 flex items-center justify-center [&>div]:w-full [&>div]:h-full [&>div]:text-xl">
                    <UserAvatar name={displayName} />
                  </div>
                )}
              </div>
              <div className="pt-1 min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {isLoading ? (
                      <>
                        <Skeleton className="h-8 w-48 mb-2" />
                        <Skeleton className="h-5 w-32" />
                      </>
                    ) : (
                      <>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 truncate">
                          {displayName}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                          {user?.lastLogin ? (
                            <p className="text-sm text-slate-500">
                              Last login:{" "}
                              {formatRelative(
                                parseISO(user.lastLogin),
                                new Date(),
                              )}
                            </p>
                          ) : (
                            <p className="text-sm font-mono text-slate-500 bg-white px-2 py-0.5 rounded-md border shadow-sm">
                              ID: {displayId}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0 max-w-[40%]">
                    {isLoading ? (
                      <Skeleton className="h-6 w-20" />
                    ) : (
                      user?.roles?.map((r) => <RoleBadge key={r} role={r} />)
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 overflow-y-auto bg-white flex-1 relative">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-slate-50/50 border border-slate-100 space-y-4">
                  <Skeleton className="h-4 w-32 mb-4" />
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-indigo-50/20 border border-indigo-100/50 space-y-4">
                  <Skeleton className="h-4 w-28 mb-4" />
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-destructive text-sm">
                  Failed to load user details
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {error instanceof Error ? error.message : "Unknown error"}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contact Info Block */}
                  <div className="p-5 rounded-2xl bg-slate-50/50 border border-slate-100 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                      Contact Information
                    </h3>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500 mb-0.5">
                          Email Address
                        </p>
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {user?.email || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500 mb-0.5">
                          Phone Number
                        </p>
                        <p className="text-sm font-medium text-slate-800">
                          {user?.phone || "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Account Meta Block */}
                  <div className="p-5 rounded-2xl bg-indigo-50/20 border border-indigo-100/50 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                      Account Details
                    </h3>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500 mb-0.5">
                          Joined Date
                        </p>
                        <p className="text-sm font-medium text-slate-800">
                          {user?.createdAt
                            ? formatRelative(
                                parseISO(user.createdAt),
                                new Date(),
                              )
                            : "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500 mb-0.5">
                          Permissions
                        </p>
                        <p className="text-sm font-medium text-slate-800 capitalize">
                          {user?.roles?.join(", ") || "Standard"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Addresses Section */}
                {user?.addresses && user.addresses.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      Addresses ({user.addresses.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {user.addresses.map((address) => (
                        <div
                          key={address.id}
                          className="p-4 rounded-xl bg-linear-to-br from-slate-50/50 to-slate-100/20 border border-slate-200 space-y-2"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                              {address.addressType}
                            </span>
                            {address.isDefault && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-semibold">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                            <div className="text-sm text-slate-700 space-y-0.5">
                              <p className="font-medium">
                                {address.street_address}
                              </p>
                              <p className="text-xs text-slate-500">
                                {address.city}, {address.state}{" "}
                                {address.postal_code}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
