/** Lightweight static background shapes — no framer-motion, pure CSS */
export function LoginShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-[hsl(260_70%_65%/0.15)] blur-[100px]" />
      <div className="absolute -bottom-[10%] -right-[10%] w-[45%] h-[45%] rounded-full bg-[hsl(200_70%_55%/0.15)] blur-[100px]" />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-[hsl(340_60%_50%/0.08)] blur-[80px]" />
    </div>
  );
}
