"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAtmosphere } from "@/components/AtmosphereProvider";

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
  maxLife: number;
  color: string;
}

function particleColor(type: string, season: string): string {
  if (type === "rain") return "140, 200, 255";
  if (type === "snow") return "255, 255, 255";
  if (type === "leaves") {
    if (season === "spring") return "144, 238, 144";
    if (season === "summer") return "34, 139, 34";
    return "210, 105, 30";
  }
  if (type === "petals") return "255, 182, 193";
  if (type === "stars") return "255, 255, 255";
  if (type === "fireflies") return "144, 238, 144";
  if (type === "dust") return "210, 180, 140";
  if (type === "fog") return "200, 210, 220";
  return "200, 200, 200";
}

export default function ParticleEngine() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const clicksRef = useRef<{ x: number; y: number; time: number }[]>([]);
  const { atmosphere } = useAtmosphere();

  const { particleType, particleIntensity, windVector, performanceTier, season } = atmosphere;
  const isFog = particleType === "fog";
  const maxCount = isFog ? 20 : 120;
  const count = performanceTier === "high"
    ? Math.round(maxCount * particleIntensity)
    : performanceTier === "mid"
    ? Math.round((maxCount * 0.5) * particleIntensity)
    : 0;

  const color = particleColor(particleType, season);

  const initParticle = useCallback((w: number, h: number, i: number): Particle => {
    const base: Particle = {
      x: Math.random() * w, y: -Math.random() * h * 0.5,
      vx: windVector.x * 0.3 + (Math.random() - 0.5) * 0.5,
      vy: 0,
      size: 0, opacity: 0, rotation: 0, rotationSpeed: 0,
      life: 0, maxLife: w * 0.8, color,
    };

    if (particleType === "rain") {
      base.vy = 4 + Math.random() * 4 + windVector.y * 0.3;
      base.vx += windVector.x * 0.4;
      base.size = 1.5 + Math.random() * 1.5;
      base.opacity = 0.2 + Math.random() * 0.3;
    } else if (particleType === "snow") {
      base.vy = 0.5 + Math.random() * 0.8;
      base.vx += Math.sin(i) * 0.3;
      base.size = 2 + Math.random() * 4;
      base.opacity = 0.4 + Math.random() * 0.4;
      base.rotation = Math.random() * Math.PI * 2;
      base.rotationSpeed = (Math.random() - 0.5) * 0.02;
    } else if (particleType === "leaves") {
      base.vy = 1 + Math.random() * 1.5;
      base.vx += windVector.x * 0.6 + (Math.random() - 0.5);
      base.size = 4 + Math.random() * 6;
      base.opacity = 0.6 + Math.random() * 0.3;
      base.rotation = Math.random() * Math.PI * 2;
      base.rotationSpeed = (Math.random() - 0.5) * 0.05;
    } else if (particleType === "petals") {
      base.vy = 0.8 + Math.random() * 1;
      base.vx += windVector.x * 0.4 + (Math.random() - 0.5) * 0.3;
      base.size = 3 + Math.random() * 3;
      base.opacity = 0.4 + Math.random() * 0.3;
      base.rotation = Math.random() * Math.PI * 2;
      base.rotationSpeed = (Math.random() - 0.5) * 0.03;
    } else if (particleType === "stars") {
      base.vy = -0.02;
      base.size = 0.5 + Math.random() * 1.5;
      base.opacity = 0.3 + Math.random() * 0.6;
      base.life = Math.random() * 2000;
      base.maxLife = 2000 + Math.random() * 3000;
    } else if (particleType === "fireflies") {
      base.vx = (Math.random() - 0.5) * 0.3;
      base.vy = (Math.random() - 0.5) * 0.3;
      base.size = 2 + Math.random() * 2;
      base.opacity = 0.3 + Math.random() * 0.5;
    } else if (particleType === "dust") {
      base.vy = windVector.y * 0.6 + (Math.random() - 0.5) * 0.5;
      base.vx = windVector.x * 0.8 + (Math.random() - 0.5) * 0.5;
      base.size = 1 + Math.random() * 2;
      base.opacity = 0.2 + Math.random() * 0.3;
    } else if (isFog) {
      base.vy = windVector.y * 0.1 + (Math.random() - 0.5) * 0.1;
      base.vx = windVector.x * 0.1 + (Math.random() - 0.5) * 0.1;
      base.size = 80 + Math.random() * 120;
      base.opacity = 0.02 + Math.random() * 0.04;
    }

    return base;
  }, [particleType, windVector, isFog, color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || count === 0 || performanceTier === "low") return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    particlesRef.current = Array.from({ length: count }, (_, i) => initParticle(canvas!.width, canvas!.height, i));

    const isMouseInteractive = particleType === "snow" && performanceTier === "high";
    const handleMouse = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    const handleLeave = () => { mouseRef.current = { x: -1000, y: -1000 }; };
    const handleClick = (e: MouseEvent) => {
      if (particleType === "rain") clicksRef.current.push({ x: e.clientX, y: e.clientY, time: Date.now() });
    };
    const handleTouch = (e: TouchEvent) => {
      if (e.touches.length > 0 && particleType === "rain") {
        clicksRef.current.push({ x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() });
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    if (isMouseInteractive) {
      window.addEventListener("mousemove", handleMouse);
      window.addEventListener("mouseleave", handleLeave);
      window.addEventListener("touchmove", handleTouchMove);
    }
    if (particleType === "rain") {
      window.addEventListener("click", handleClick);
      window.addEventListener("touchstart", handleTouch);
    }

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      const now = Date.now();
      const parts = particlesRef.current;
      const len = parts.length;

      clicksRef.current = clicksRef.current.filter((c) => now - c.time < 1000);
      for (let ci = 0; ci < clicksRef.current.length; ci++) {
        const c = clicksRef.current[ci];
        const age = (now - c.time) / 1000;
        const radius = age * 60;
        const alpha = Math.max(0, 0.3 - age * 0.3);
        ctx!.beginPath();
        ctx!.arc(c.x, c.y, radius, 0, Math.PI * 2);
        ctx!.strokeStyle = `rgba(140, 200, 255, ${alpha})`;
        ctx!.lineWidth = 1.5;
        ctx!.stroke();
        ctx!.beginPath();
        ctx!.arc(c.x, c.y, radius * 0.6, 0, Math.PI * 2);
        ctx!.strokeStyle = `rgba(140, 200, 255, ${alpha * 0.5})`;
        ctx!.lineWidth = 1;
        ctx!.stroke();
      }

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (let pi = 0; pi < len; pi++) {
        const p = parts[pi];

        if (particleType === "rain" || particleType === "dust") {
          p.x += p.vx;
          p.y += p.vy;
        } else if (particleType === "snow") {
          p.x += p.vx + Math.sin(p.y * 0.01 + p.rotation * 10) * 0.3;
          p.y += p.vy;
          p.rotation += p.rotationSpeed;
          const dx = p.x - mx;
          const dy = p.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 60 && dist > 1) {
            p.x += (dx / dist) * 1.2;
            p.y += (dy / dist) * 0.8;
          }
        } else if (particleType === "leaves" || particleType === "petals") {
          p.x += p.vx + Math.sin(p.y * 0.02 + p.rotation) * 0.5;
          p.y += p.vy;
          p.rotation += p.rotationSpeed;
        } else if (particleType === "stars") {
          p.life += 1;
          if (p.life > p.maxLife) {
            p.x = Math.random() * canvas!.width;
            p.y = Math.random() * canvas!.height * 0.6;
            p.life = 0;
          }
        } else if (particleType === "fireflies") {
          p.x += p.vx + Math.sin(now * 0.002 + p.life) * 0.2;
          p.y += p.vy + Math.cos(now * 0.002 + p.life) * 0.2;
          if (p.x < 0 || p.x > canvas!.width) p.vx *= -1;
          if (p.y < 0 || p.y > canvas!.height) p.vy *= -1;
        } else if (isFog) {
          p.x += p.vx;
          p.y += p.vy;
        }

        if (p.y > canvas!.height + 20) {
          Object.assign(p, initParticle(canvas!.width, canvas!.height, 0));
          p.y = -20;
        }
        if (p.x < -50 || p.x > canvas!.width + 50) {
          p.x = p.x < -50 ? canvas!.width + 50 : -50;
        }

        switch (particleType) {
          case "rain": {
            const plen = p.size * 8;
            ctx!.beginPath();
            ctx!.moveTo(p.x, p.y);
            ctx!.lineTo(p.x - plen * 0.15, p.y + plen);
            ctx!.strokeStyle = `rgba(${p.color}, ${p.opacity})`;
            ctx!.lineWidth = 1.2;
            ctx!.stroke();
            break;
          }
          case "snow": {
            ctx!.beginPath();
            ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx!.fillStyle = `rgba(${p.color}, ${p.opacity})`;
            ctx!.fill();
            break;
          }
          case "leaves": {
            ctx!.save();
            ctx!.translate(p.x, p.y);
            ctx!.rotate(p.rotation);
            ctx!.beginPath();
            ctx!.ellipse(0, 0, p.size, p.size * 0.4, 0, 0, Math.PI * 2);
            ctx!.fillStyle = `rgba(${p.color}, ${p.opacity})`;
            ctx!.fill();
            ctx!.restore();
            break;
          }
          case "petals": {
            ctx!.save();
            ctx!.translate(p.x, p.y);
            ctx!.rotate(p.rotation);
            ctx!.beginPath();
            ctx!.ellipse(0, 0, p.size, p.size * 0.3, 0, 0, Math.PI * 2);
            ctx!.fillStyle = `rgba(${p.color}, ${p.opacity})`;
            ctx!.fill();
            ctx!.restore();
            break;
          }
          case "stars": {
            const twinkle = Math.sin(p.life * 0.02) * 0.3 + 0.7;
            ctx!.beginPath();
            ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx!.fillStyle = `rgba(${p.color}, ${p.opacity * twinkle})`;
            ctx!.fill();
            break;
          }
          case "fireflies": {
            const glow = Math.sin(now * 0.003 + p.life) * 0.3 + 0.7;
            ctx!.beginPath();
            ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx!.fillStyle = `rgba(${p.color}, ${p.opacity * glow})`;
            ctx!.fill();
            ctx!.beginPath();
            ctx!.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
            ctx!.fillStyle = `rgba(${p.color}, ${p.opacity * glow * 0.15})`;
            ctx!.fill();
            break;
          }
          case "dust":
          case "fog": {
            ctx!.beginPath();
            ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx!.fillStyle = `rgba(${p.color}, ${p.opacity})`;
            ctx!.fill();
            break;
          }
        }
      }

      animRef.current = requestAnimationFrame(draw);
    }
    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("mouseleave", handleLeave);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("touchstart", handleTouch);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [particleType, count, windVector, performanceTier, isFog, initParticle]);

  if (count === 0 || performanceTier === "low") return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[2]"
      style={{ opacity: 0.8, willChange: "opacity" }}
    />
  );
}
