"use client";

import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import Image from "next/image";

export default function Logo({ size = "md", mode="light"}: { size?: "sm" | "md" | "lg" }) {
  const router = useRouter();

  const sizes = {
    md: { circle: "w-6 h-6", text: "text-xl", rounded: "rounded-md", zapSize: "w-4 h-4" },
    lg: { circle: "w-9 h-9", text: "text-2xl", rounded: "rounded-lg", zapSize: "w-5 h-5" },
  };

  const color = mode === "light" ? "#313131" : "#FFFFFF";

  /*
  return (
    <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")} data-dashboard>

      <Image
        src="/logo/light/icon.png"
        alt="Proanbud Icon"
        width={32}
        height={32}
        className="cursor-pointer mb-0.5"
      />
      <h1 className={`${sizes[size].text} text-2xl font-regular`} style={{ color }}>Proanbud</h1>
    </div>
  )*/

  return (
    <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
      <Image 
      src={`/logo/${mode}/logo-primary.svg`}
      alt="Proanbud Logo"
      width={size !== "md" ? 150 : 130}
      height={35}
      className="cursor-pointer mb-0.5"
    />
    </div>
  )

}
