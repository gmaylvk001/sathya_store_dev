"use client";

import { useEffect, useRef } from "react";

export default function FireworksEffect() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d", { alpha: true });
        if (!ctx) return;

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }

        let animationFrameId;
        const timeouts = [];

        let width = window.innerWidth;
        let height = window.innerHeight;
        let dpr = Math.min(window.devicePixelRatio || 1, 2);

        const rockets = [];
        const particles = [];

        const isMobile = width < 768;
        const maxParticles = isMobile ? 600 : 1400;

        // Rich Diwali Palette: Bright Golds, Marigolds, Ruby Reds, Emeralds, Royal Blues
        const DIWALI_PALETTE = [
            { h: [42, 52], s: "100%", l: "60%", weight: 6 },  // Brilliant Gold
            { h: [20, 35], s: "100%", l: "55%", weight: 5 },  // Warm Amber / Saffron
            { h: [350, 8], s: "95%", l: "55%", weight: 4 },   // Crimson Red
            { h: [120, 150], s: "90%", l: "50%", weight: 2 }, // Deep Emerald
            { h: [210, 250], s: "90%", l: "60%", weight: 2 }, // Deep Royal Blue
            { h: [280, 310], s: "95%", l: "65%", weight: 2 }  // Sparkly Purple
        ];

        function getRandomHue() {
            const totalWeight = DIWALI_PALETTE.reduce((acc, curr) => acc + curr.weight, 0);
            let randomNum = Math.random() * totalWeight;

            for (const p of DIWALI_PALETTE) {
                if (randomNum < p.weight) {
                    const h = random(p.h[0], p.h[1]);
                    return `hsl(${h}, ${p.s}, ${p.l})`;
                }
                randomNum -= p.weight;
            }
            return `hsl(45, 100%, 60%)`;
        }

        function random(min, max) {
            return Math.random() * (max - min) + min;
        }

        function resizeCanvas() {
            width = window.innerWidth;
            height = window.innerHeight;
            dpr = Math.min(window.devicePixelRatio || 1, 2);

            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        function createRocket() {
            const startX = random(width * 0.1, width * 0.9);
            const types = ["standard", "crossette", "willow"];
            const type = types[Math.floor(Math.random() * types.length)];

            rockets.push({
                x: startX,
                y: height + 10,
                vx: random(-0.8, 0.8),
                vy: random(-10.5, -13.5),
                targetY: random(height * 0.12, height * 0.42),
                color: getRandomHue(),
                trail: [],
                type,
            });
        }

        function spawnParticle(x, y, color, opts = {}) {
            particles.push({
                x,
                y,
                vx: opts.vx ?? random(-5, 5),
                vy: opts.vy ?? random(-5, 5),
                gravity: opts.gravity ?? 0.05,
                friction: opts.friction ?? 0.96,
                size: opts.size ?? random(1.5, 3),
                alpha: 1,
                decay: opts.decay ?? random(0.009, 0.018),
                color,
                trail: [],
                twinkle: opts.twinkle ?? Math.random() < 0.3,
                type: opts.type,
            });
        }

        function explode(rocket) {
            const particleCount = isMobile ? 70 : 130;
            const baseColor = rocket.color;

            // Flash effect at detonation center
            ctx.save();
            ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
            ctx.beginPath();
            ctx.arc(rocket.x, rocket.y, 35, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            if (rocket.type === "willow") {
                // Golden Willow Effect (Drooping slow trails)
                for (let i = 0; i < particleCount; i++) {
                    const angle = random(0, Math.PI * 2);
                    const speed = random(1.2, 4.8);
                    spawnParticle(rocket.x, rocket.y, "hsl(42, 100%, 62%)", {
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        gravity: 0.025,
                        friction: 0.982,
                        decay: random(0.004, 0.009),
                        size: random(1.2, 2.2),
                        twinkle: true,
                    });
                }
            } else if (rocket.type === "crossette") {
                // Crossette (Particles that split mid-air)
                for (let i = 0; i < particleCount / 2; i++) {
                    const angle = random(0, Math.PI * 2);
                    const speed = random(3.5, 6.5);
                    spawnParticle(rocket.x, rocket.y, baseColor, {
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        gravity: 0.04,
                        friction: 0.96,
                        decay: random(0.012, 0.02),
                        type: "crossette",
                    });
                }
            } else {
                // Spherical Peony Burst with Golden Sparkle Center
                for (let i = 0; i < particleCount; i++) {
                    const angle = random(0, Math.PI * 2);
                    const speed = random(2, 7);
                    spawnParticle(rocket.x, rocket.y, baseColor, {
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        gravity: 0.05,
                        friction: 0.96,
                    });
                }

                // Inner Golden Crackle Core
                const coreSparks = isMobile ? 15 : 35;
                for (let i = 0; i < coreSparks; i++) {
                    const angle = random(0, Math.PI * 2);
                    const speed = random(0.5, 2.2);
                    spawnParticle(rocket.x, rocket.y, "hsl(48, 100%, 75%)", {
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        gravity: 0.02,
                        friction: 0.97,
                        decay: random(0.018, 0.035),
                        size: random(1, 1.8),
                        twinkle: true,
                    });
                }
            }
        }

        function updateRocket(rocket, index) {
            rocket.trail.push({ x: rocket.x, y: rocket.y });
            if (rocket.trail.length > 8) rocket.trail.shift();

            rocket.x += rocket.vx;
            rocket.y += rocket.vy;
            rocket.vy *= 0.985; // Air resistance near apex
            rocket.vy += 0.08;  // Light gravity drag

            // Draw rocket tail
            ctx.beginPath();
            ctx.moveTo(rocket.x, rocket.y);
            for (let i = rocket.trail.length - 1; i >= 0; i--) {
                ctx.lineTo(rocket.trail[i].x, rocket.trail[i].y);
            }
            ctx.strokeStyle = rocket.color;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Check burst trigger
            if (rocket.y <= rocket.targetY || rocket.vy >= -0.2) {
                explode(rocket);
                rockets.splice(index, 1);
            }
        }

        function updateParticle(p, index) {
            p.trail.push({ x: p.x, y: p.y });
            if (p.trail.length > 4) p.trail.shift();

            p.vx *= p.friction;
            p.vy *= p.friction;
            p.vy += p.gravity;

            p.x += p.vx;
            p.y += p.vy;

            p.alpha -= p.decay;

            // Crossette particle splitting midway
            if (p.type === "crossette" && !p.hasSplit && p.alpha < 0.6) {
                p.hasSplit = true;
                for (let i = 0; i < 4; i++) {
                    const angle = (Math.PI / 2) * i;
                    spawnParticle(p.x, p.y, p.color, {
                        vx: Math.cos(angle) * 3,
                        vy: Math.sin(angle) * 3,
                        decay: 0.03,
                        size: p.size * 0.8,
                    });
                }
            }

            if (p.alpha <= 0) {
                particles.splice(index, 1);
                return;
            }

            // Rendering
            let drawAlpha = p.alpha;
            if (p.twinkle) {
                drawAlpha *= random(0.3, 1);
            }

            ctx.save();
            ctx.globalCompositeOperation = "lighter"; // Bright additive glow blend

            // Trail
            if (p.trail.length > 1) {
                ctx.beginPath();
                ctx.moveTo(p.trail[0].x, p.trail[0].y);
                for (let i = 1; i < p.trail.length; i++) {
                    ctx.lineTo(p.trail[i].x, p.trail[i].y);
                }
                ctx.strokeStyle = p.color;
                ctx.globalAlpha = drawAlpha * 0.35;
                ctx.lineWidth = p.size;
                ctx.stroke();
            }

            // Particle Core
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = drawAlpha;
            ctx.fill();

            ctx.restore();
        }

        function animate() {
            // Semi-transparent overlay to produce motion blur/light trails
            ctx.globalCompositeOperation = "destination-out";
            ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
            ctx.fillRect(0, 0, width, height);

            ctx.globalCompositeOperation = "source-over";

            for (let i = rockets.length - 1; i >= 0; i--) {
                updateRocket(rockets[i], i);
            }

            for (let i = particles.length - 1; i >= 0; i--) {
                updateParticle(particles[i], i);
            }

            if (particles.length > maxParticles) {
                particles.splice(0, particles.length - maxParticles);
            }

            animationFrameId = requestAnimationFrame(animate);
        }

        // Auto launcher cadence
        function scheduleLaunch() {
            const timeout = window.setTimeout(() => {
                createRocket();
                if (Math.random() < 0.35) {
                    const secondBurst = window.setTimeout(createRocket, random(150, 300));
                    timeouts.push(secondBurst);
                }
                scheduleLaunch();
            }, random(900, 2200));

            timeouts.push(timeout);
        }

        // Instant visual burst on open (0ms) so there is no waiting
        explode({
            x: width * 0.35,
            y: height * 0.25,
            color: "hsl(45, 100%, 60%)",
            type: "standard"
        });

        timeouts.push(window.setTimeout(() => {
            explode({
                x: width * 0.65,
                y: height * 0.22,
                color: "hsl(350, 95%, 55%)",
                type: "willow"
            });
        }, 150));

        // Diwali Grand Opening Volley
        createRocket();
        timeouts.push(window.setTimeout(createRocket, 250));
        timeouts.push(window.setTimeout(createRocket, 600));
        timeouts.push(window.setTimeout(createRocket, 1100));

        scheduleLaunch();
        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            timeouts.forEach((t) => clearTimeout(t));
            window.removeEventListener("resize", resizeCanvas);
            rockets.length = 0;
            particles.length = 0;
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            style={{
                position: "fixed",
                inset: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: 9990,
            }}
        />
    );
}