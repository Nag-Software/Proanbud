"use client"

import { GalleryVerticalEnd } from "lucide-react"
import LoginForm from "./login-form"
import Logo from "@/components/shared/Logo"
import { getAuthErrorMessage, loginWithEmail } from "@/lib/auth";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Page() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex justify-center w-full">
          <Logo size="md" />
        </div>
        <LoginForm />
      </div>
    </div>
  )
};