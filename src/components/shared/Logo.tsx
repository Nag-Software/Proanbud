"use client";

import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import Image from "next/image";

export default function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const router = useRouter();

  const sizes = {
    md: { circle: "w-6 h-6", text: "text-xl", rounded: "rounded-md", zapSize: "w-4 h-4" },
    lg: { circle: "w-9 h-9", text: "text-2xl", rounded: "rounded-lg", zapSize: "w-5 h-5" },
  };

  return (
    <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
      <div className={`${sizes[size].circle} ${sizes[size].rounded} bg-[#82ffb2] flex items-center justify-center`}>
        <Zap className={`${sizes[size].zapSize} text-gray-900`} />
      </div>
      <span className={`${sizes[size].text} text-primary font-bold`}>Proanbud</span>
    </div>
  );
}
