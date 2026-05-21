"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Register is handled by /login with mode=register
export default function RegisterPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login?mode=register");
  }, [router]);
  return null;
}
