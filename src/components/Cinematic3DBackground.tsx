import React, { useEffect, useRef } from 'react';

/**
 * Cinematic3DBackground
 * Visibly noticeable, rich 3D animated environment:
 * - Layer 1: Animated Cosmic Aurora mesh (Electric Blue, Purple, Cyan, Violet)
 * - Layer 2: 3D Perspective Cyber Grid with glowing light wave
 * - Layer 3: Radiant drifting glow orbs that orbit smoothly
 * - Layer 4: Floating stardust particle canvas (smooth 60fps drift with twinkle)
 * - Layer 5: Parallax depth on scroll without scroll blocking
 * - 100% pointer-events-none: never interferes with mobile touch scrolling
 */
export const Cinematic3DBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);

  // Smooth scroll parallax for background depth layers
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (parallaxRef.current) {
            const scrollY = window.scrollY;
            // Gentle parallax shift on the depth container
            parallaxRef.current.style.transform = `translate3d(0, ${-scrollY * 0.12}px, 0)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Floating Stardust Particles (Canvas - lightweight, smooth 60fps)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // 36 vibrant glowing stardust particles
    const colors = [
      'rgba(34, 211, 238, ',   // Cyan
      'rgba(168, 85, 247, ',   // Neon Purple
      'rgba(96, 165, 250, ',   // Electric Blue
      'rgba(244, 114, 182, ',  // Pink / Magenta
      'rgba(52, 211, 153, ',   // Mint Emerald
    ];

    const particles = Array.from({ length: 36 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 0.8,
      speedX: (Math.random() - 0.5) * 0.35,
      speedY: -Math.random() * 0.45 - 0.15, // float upward
      baseAlpha: Math.random() * 0.5 + 0.3,
      alpha: 0.5,
      pulseSpeed: Math.random() * 0.02 + 0.01,
      pulsePhase: Math.random() * Math.PI * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    let lastTime = performance.now();

    const render = (time: number) => {
      if (document.hidden) {
        animId = requestAnimationFrame(render);
        return;
      }

      const dt = Math.min(32, time - lastTime);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.speedX * (dt / 16);
        p.y += p.speedY * (dt / 16);
        p.pulsePhase += p.pulseSpeed;
        p.alpha = p.baseAlpha + Math.sin(p.pulsePhase) * 0.25;

        // Wrap around edges
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${Math.max(0.1, Math.min(1, p.alpha))})`;
        ctx.shadowBlur = p.size * 3.5;
        ctx.shadowColor = `${p.color}0.8)`;
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden select-none -z-10 bg-[#030712]"
      aria-hidden="true"
    >
      {/* Parallax Container for Depth Layers */}
      <div ref={parallaxRef} className="absolute inset-0 w-full h-[120%] will-change-transform">
        
        {/* LAYER 1: Dynamic Cosmic Aurora Gradients (Visibly animated glow) */}
        <div 
          className="absolute -inset-[30%] opacity-90 animate-aurora-drift"
          style={{
            background: `
              radial-gradient(ellipse 70% 50% at 20% 10%, rgba(99, 102, 241, 0.35), transparent 60%),
              radial-gradient(ellipse 65% 50% at 85% 25%, rgba(168, 85, 247, 0.32), transparent 60%),
              radial-gradient(ellipse 60% 45% at 50% 85%, rgba(6, 182, 212, 0.28), transparent 65%),
              radial-gradient(ellipse 50% 50% at 10% 75%, rgba(217, 70, 239, 0.22), transparent 55%),
              radial-gradient(ellipse 45% 45% at 80% 80%, rgba(59, 130, 246, 0.25), transparent 55%)
            `,
          }}
        />

        {/* LAYER 2: 3D Perspective Cyber Grid (Ground Floor Horizon Effect) */}
        <div 
          className="absolute bottom-0 -left-1/4 -right-1/4 h-[700px] opacity-40 animate-grid-depth"
          style={{
            transform: 'perspective(600px) rotateX(65deg)',
            transformOrigin: 'bottom center',
            backgroundImage: `
              linear-gradient(to right, rgba(34, 211, 238, 0.3) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(99, 102, 241, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '54px 54px',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 15%, rgba(0,0,0,0) 85%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 15%, rgba(0,0,0,0) 85%)',
          }}
        />

        {/* LAYER 3: Big Radiant Drifting Orbs with vibrant neon hues */}
        {/* Orb 1: Electric Indigo/Blue (Top Left) */}
        <div
          className="absolute top-[5%] -left-[10%] w-[380px] h-[380px] sm:w-[500px] sm:h-[500px] rounded-full blur-[90px] bg-gradient-to-tr from-blue-600/45 to-indigo-500/40 animate-orb-float-1"
        />

        {/* Orb 2: Neon Purple/Violet (Top Right) */}
        <div
          className="absolute top-[20%] -right-[15%] w-[420px] h-[420px] sm:w-[550px] sm:h-[550px] rounded-full blur-[100px] bg-gradient-to-bl from-purple-600/45 to-fuchsia-600/35 animate-orb-float-2"
        />

        {/* Orb 3: Cyan / Teal Glow (Center-Left) */}
        <div
          className="absolute top-[50%] left-[10%] w-[340px] h-[340px] sm:w-[480px] sm:h-[480px] rounded-full blur-[85px] bg-gradient-to-r from-cyan-500/40 to-blue-500/35 animate-orb-float-3"
        />

        {/* Orb 4: Deep Violet / Magenta (Bottom Right) */}
        <div
          className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] sm:w-[520px] sm:h-[520px] rounded-full blur-[95px] bg-gradient-to-t from-violet-600/40 to-pink-500/30 animate-orb-float-4"
        />

      </div>

      {/* LAYER 4: Real-time Floating Stardust Particles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-85"
      />

      {/* LAYER 5: Subtle Cyber Scanline Overlay for High-Tech Texture */}
      <div 
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0) 50%, rgba(0,0,0,1) 50%)',
          backgroundSize: '100% 4px',
        }}
      />

      {/* LAYER 6: Subtle Cinematic Vignette (Preserves central readability) */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_35%,_rgba(3,7,18,0.75)_90%)] pointer-events-none"
      />
    </div>
  );
};
