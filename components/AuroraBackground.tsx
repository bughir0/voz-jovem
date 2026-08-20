export function AuroraBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="animate-blob absolute -top-40 -left-32 h-[32rem] w-[32rem] rounded-full bg-brand-300/45 blur-[110px]" />
      <div
        className="animate-blob absolute -top-24 right-[-10rem] h-[28rem] w-[28rem] rounded-full bg-accent-400/35 blur-[120px]"
        style={{ animationDelay: "-7s" }}
      />
      <div
        className="animate-blob absolute bottom-[-14rem] left-1/3 h-[34rem] w-[34rem] rounded-full bg-mint-400/30 blur-[130px]"
        style={{ animationDelay: "-13s" }}
      />
      <div
        className="animate-blob absolute right-1/4 bottom-10 h-[18rem] w-[18rem] rounded-full bg-sun-400/25 blur-[100px]"
        style={{ animationDelay: "-4s" }}
      />
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgb(115 80 240 / 0.16) 1px, transparent 0)",
          backgroundSize: "26px 26px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 75%)",
        }}
      />
    </div>
  );
}
