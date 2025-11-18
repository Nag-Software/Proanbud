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
  /*
  return (
    <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
      <div className={`${sizes[size].circle} ${sizes[size].rounded} bg-[#82ffb2] flex items-center justify-center`}>
        <Zap className={`${sizes[size].zapSize} text-gray-900`} />
      </div>
      <span className={`${sizes[size].text} text-primary font-bold`}>Proanbud</span>
    </div>
  );*/

  const color = mode === "light" ? "#313131" : "#FFFFFF";

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
  )
}
