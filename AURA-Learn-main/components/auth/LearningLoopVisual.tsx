import { BrainCircuit, HandHeart, Route, Sparkles } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";

/** Lightweight motion illustration: a responsive alternative to a large, slow video asset. */
export function LearningLoopVisual() {
  const nodes = [
    { icon: Route, label: "A path that adapts" },
    { icon: BrainCircuit, label: "Examples in their world" },
    { icon: HandHeart, label: "Human help at the right time" },
  ];

  return (
    <div className="auth-visual relative mx-auto mt-10 max-w-xl overflow-hidden rounded-[2rem] border border-white/10 bg-[rgb(14_15_48_/_0.58)] p-6 shadow-pop backdrop-blur-sm sm:p-8">
      <span className="auth-orbit auth-orbit-one" aria-hidden />
      <span className="auth-orbit auth-orbit-two" aria-hidden />
      <span className="auth-spark auth-spark-one" aria-hidden />
      <span className="auth-spark auth-spark-two" aria-hidden />

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-white text-brand shadow-lg"><LogoMark className="size-7" /></span>
          <div>
            <p className="text-sm font-semibold text-white">AURA is learning with you</p>
            <p className="mt-0.5 text-xs text-indigo-100/75">Progress becomes the next best step</p>
          </div>
        </div>
        <Sparkles className="size-5 text-teal-200" aria-hidden />
      </div>

      <div className="relative z-10 my-10 grid place-items-center">
        <div className="auth-core grid size-32 place-items-center rounded-full border border-white/25 bg-brand text-center shadow-[0_0_60px_rgb(105_105_255_/_0.55)]">
          <span className="text-3xl font-semibold text-white">AURA</span>
          <span className="-mt-5 text-[10px] font-medium uppercase tracking-[0.18em] text-indigo-100">Adaptive loop</span>
        </div>
      </div>

      <div className="relative z-10 grid gap-3 sm:grid-cols-3">
        {nodes.map(({ icon: Icon, label }) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-3.5 text-white">
            <Icon className="mb-3 size-5 text-teal-200" aria-hidden />
            <p className="text-sm font-medium leading-snug">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
