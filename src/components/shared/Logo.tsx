"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  mode?: "light" | "dark";
}

export default function Logo({ size = "md", mode="light"}: LogoProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
      <Image 
      src={`/logo/${mode}/logo-primary.svg`}
      alt="Proanbud Logo"
      width={size !== "md" ? 150 : 130}
      height={35}
      className="cursor-pointer mb-0.5"
      loading="lazy"
    />
    </div>
  )

}
