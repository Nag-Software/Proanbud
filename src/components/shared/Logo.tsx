import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";

export default function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const router = useRouter();

  const sizes = {
    md: { circle: "w-8 h-8", text: "text-xl", rounded: "rounded-lg", zapSize: "w-5 h-5" },
    lg: { circle: "w-10 h-10", text: "text-2xl", rounded: "rounded-xl", zapSize: "w-6 h-6" },
  };

  return (
    <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
      <div className={`${sizes[size].circle} ${sizes[size].rounded} bg-[#82ffb2] flex items-center justify-center`}>
        <Zap className={`${sizes[size].zapSize} text-gray-900`} />
      </div>
      <span className={`${sizes[size].text} font-bold`}>Proanbud</span>
    </div>
  );
}
