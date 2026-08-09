import { Home, Search } from "lucide-react";

export default function ErrorNotFound({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 px-6 text-center select-none z-3">
      <div className="relative flex items-center justify-center pb-0">
        <h1 className="text-9xl font-semibold tracking-tight  text-foreground/20">
          404
        </h1>
        <Search
          className="fixed z-50 size-16 text-primary [animation:search-sweep_2.4s_ease-in-out_infinite] fill-white/30"
          strokeWidth={2}
        />
      </div>
      <div className="space-y-2">
        <p className="text-lg text-muted-foreground">找不到這個頁面</p>
        <p className="text-sm text-muted-foreground/70">{text}</p>
      </div>

      <style>{`
        @keyframes search-sweep {
          0% {
            transform: translate(-54px, -12px) rotate(-22deg) scale(1.96);
          }
          32% {
            transform: translate(42px, -18px) rotate(10deg) scale(2.03);
          }
          62% {
            transform: translate(48px, 28px) rotate(18deg) scale(2);
          }
          84% {
            transform: translate(-26px, 32px) rotate(-10deg) scale(2.02);
          }
          100% {
            transform: translate(-54px, -12px) rotate(-22deg) scale(1.96);
          }
        }
      `}</style>
    </div>
  );
}
