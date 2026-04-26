"use client";

// This route simply redirects to the shared form page with ?editId=<id>
// keeping a single source of truth for the form UI.

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditUserPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    if (id) {
      router.replace(`/dashboard/users/new?editId=${id}`);
    }
  }, [id, router]);

  return null;
}
