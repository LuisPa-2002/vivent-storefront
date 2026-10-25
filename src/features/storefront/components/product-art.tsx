import { Shirt, Sparkles } from "lucide-react";

export function ProductArt({
  title,
  imageUrl,
  compact = false,
}: Readonly<{ title: string; imageUrl?: string | null; compact?: boolean }>) {
  const height = compact ? "h-40 sm:h-44" : "h-56 sm:h-64";
  if (imageUrl) {
    // Catalog media is normalized by the backend and is public by design.
    return <div className={`${height} bg-cover bg-center`} style={{ backgroundImage: `url(${imageUrl})` }} role="img" aria-label={title} />;
  }

  const lower = title.toLowerCase();
  const isDenim = lower.includes("jeans") || lower.includes("índigo") || lower.includes("indigo");
  const isDark = lower.includes("negro") || lower.includes("black");
  const isBlue = lower.includes("azul") || lower.includes("blue");
  const palette = isDenim
    ? "from-[#dbe5ed] via-[#9fb4c5] to-[#48677f] text-[#1d3d58]"
    : isDark
      ? "from-[#5f5d61] via-[#28272a] to-[#111113] text-white"
      : isBlue
        ? "from-[#edf3f4] via-[#b9ced8] to-[#7895a5] text-[#315d70]"
        : "from-[#f5eadc] via-[#d9bd9e] to-[#aa8167] text-[#52392d]";

  return (
    <div className={`relative grid ${height} place-items-center overflow-hidden bg-gradient-to-br ${palette}`}>
      <div className="absolute inset-x-0 top-0 h-px bg-white/60" />
      <div className="absolute -left-6 -top-7 size-28 rounded-full border border-white/35" />
      <div className="absolute -bottom-12 -right-8 size-36 rounded-full bg-white/15" />
      <div className="relative grid size-24 place-items-center rounded-full border border-white/35 bg-white/15 shadow-[0_18px_35px_rgba(22,25,27,.15)] backdrop-blur-sm sm:size-28">
        <Shirt className="size-12 sm:size-14" strokeWidth={1.15} />
      </div>
      <Sparkles className="absolute bottom-4 right-5 size-4 opacity-70" />
    </div>
  );
}
