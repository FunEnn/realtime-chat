import { cn } from "@/lib/utils";

interface AnimeBackgroundProps {
  className?: string;
}

export function AnimeBackground({ className }: AnimeBackgroundProps) {
  return (
    <div className={cn("absolute inset-0", className)}>
      {/* Anime-style gradient background */}
      <div className="absolute inset-0 bg-linear-to-br from-pink-100 via-purple-100 to-blue-100 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950" />

      {/* Floating anime elements */}
      <FloatingOrb
        size="h-16 w-16"
        color="bg-pink-400 dark:bg-pink-600"
        position="top-10 left-10"
        delay={0}
      />
      <FloatingOrb
        size="h-12 w-12"
        color="bg-yellow-400 dark:bg-yellow-600"
        position="top-32 right-20"
        delay={1000}
      />
      <FloatingOrb
        size="h-20 w-20"
        color="bg-purple-400 dark:bg-purple-600"
        position="bottom-32 left-32"
        delay={2000}
      />
      <FloatingOrb
        size="h-14 w-14"
        color="bg-blue-400 dark:bg-blue-600"
        position="bottom-20 right-40"
        delay={3000}
      />
      <FloatingOrb
        size="h-10 w-10"
        color="bg-cyan-400 dark:bg-cyan-600"
        position="top-1/2 left-20"
        delay={1500}
      />
      <FloatingOrb
        size="h-8 w-8"
        color="bg-indigo-400 dark:bg-indigo-600"
        position="top-20 right-1/3"
        delay={2500}
      />

      {/* Sparkles */}
      <Sparkle position="top-1/4 left-1/4" size="h-2 w-2" delay={0} />
      <Sparkle position="top-1/3 right-1/4" size="h-3 w-3" delay={1000} />
      <Sparkle position="bottom-1/4 left-1/3" size="h-2 w-2" delay={2000} />
      <Sparkle position="bottom-1/3 right-1/3" size="h-2 w-2" delay={3000} />

      {/* Decorative lines */}
      <div className="absolute top-0 left-1/4 h-full w-px bg-linear-to-b from-transparent via-pink-300 to-transparent opacity-30 dark:via-pink-700" />
      <div className="absolute top-0 right-1/3 h-full w-px bg-linear-to-b from-transparent via-purple-300 to-transparent opacity-30 dark:via-purple-700" />
    </div>
  );
}

interface FloatingOrbProps {
  size: string;
  color: string;
  position: string;
  delay: number;
}

function FloatingOrb({ size, color, position, delay }: FloatingOrbProps) {
  const delayClass = `animation-delay-${delay}`;

  return (
    <div
      className={cn(
        "absolute rounded-full opacity-60 shadow-lg animate-float",
        size,
        color,
        position,
        delayClass,
      )}
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}

interface SparkleProps {
  position: string;
  size: string;
  delay: number;
}

function Sparkle({ position, size, delay }: SparkleProps) {
  const delayClass = `animation-delay-${delay}`;

  return (
    <div
      className={cn(
        "absolute rounded-full bg-white shadow-lg animate-sparkle",
        size,
        position,
        delayClass,
      )}
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}
