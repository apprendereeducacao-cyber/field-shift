"use client";

import { useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import Chat from "@/components/Chat";

const DATA_PARTNERS = [
  "NASA POWER",
  "Sentinel-2",
  "Copernicus",
  "MapBiomas",
  "ISRIC SoilGrids",
  "IBGE",
  "NASA SMAP",
  "NASA GPM",
  "MODIS",
  "ECOSTRESS",
  "GRACE-FO",
];

function GlobeWireframe() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.12;
  });
  return (
    <group>
      <Sphere ref={meshRef} args={[2, 48, 48]}>
        <meshBasicMaterial color="#21754C" wireframe transparent opacity={0.18} />
      </Sphere>
      <Sphere args={[1.98, 48, 48]}>
        <meshBasicMaterial color="#0B1A10" transparent opacity={0.92} />
      </Sphere>
      <mesh position={[0.85, 1.22, -1.25]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color="#E1F031" />
      </mesh>
      <mesh position={[0.85, 1.22, -1.25]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.06, 0.09, 32]} />
        <meshBasicMaterial color="#96E18E" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function GlobeScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.5], fov: 45 }}
      style={{ width: "100%", height: "100%" }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      <Suspense fallback={null}>
        <GlobeWireframe />
      </Suspense>
      <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 1.5} />
    </Canvas>
  );
}

export default function HomeClient() {
  return (
    <div className="flex flex-col">
      {/* ── HERO ORBIT ── */}
      <section
        data-theme="orbit"
        className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden"
        style={{ background: "radial-gradient(120% 90% at 0% 0%, rgba(70,154,92,0.55) 0%, rgba(11,26,16,0) 60%), #0B1A10" }}
      >
        <div className="absolute inset-0 opacity-50" style={{ backgroundImage: "radial-gradient(rgba(150,225,142,0.16) 1px, transparent 1px)", backgroundSize: "16px 16px" }} />

        <div className="absolute inset-0 opacity-50">
          <GlobeScene />
        </div>

        <div className="relative z-10 flex flex-col items-center px-4 text-center">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-lime-signal" />
            <p className="text-[11px] font-semibold tracking-[0.12em] text-stone-300 uppercase">
              NASA Space Apps 2026
            </p>
          </div>

          <h1 className="mt-4 text-[44px] font-light leading-[1.1] tracking-[-0.035em] text-stone-50 sm:text-[56px]">
            Adapte sua lavoura<br />com dados da NASA
          </h1>
          <p className="mt-4 max-w-md text-base text-stone-300" style={{ letterSpacing: "-0.005em" }}>
            44 anos de dados climaticos, 7 camadas de satelite, inteligencia para decidir o melhor manejo
          </p>

          <div className="mt-8 w-full max-w-md">
            <div className="flex items-center rounded-full border border-stone-700 bg-forest-900/80 px-5 py-3 backdrop-blur-md">
              <svg className="mr-3 h-5 w-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-sm text-stone-300">Cruz Alta, RS</span>
              <span className="ml-auto rounded-full bg-lime-signal px-3 py-0.5 text-[11px] font-semibold text-forest-950">
                Demo
              </span>
            </div>
          </div>

          <div className="mt-12 animate-bounce">
            <svg className="h-5 w-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7" />
            </svg>
          </div>
        </div>
      </section>

      {/* ── DATA PARTNERS ── */}
      <section className="border-y border-border bg-muted py-5 overflow-hidden">
        <p className="mb-4 text-center text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          Dados de
        </p>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-muted to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-muted to-transparent" />
          <div className="flex animate-scroll gap-4">
            {[...DATA_PARTNERS, ...DATA_PARTNERS].map((name, i) => (
              <span
                key={i}
                className="shrink-0 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── NAVIGATION CARDS ── */}
      <section className="mx-auto w-full max-w-3xl space-y-6 px-4 py-12 sm:px-10">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { href: "/painel", title: "Painel", desc: "Risco e clima", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
            { href: "/mapa", title: "Mapa", desc: "7 camadas satelite", icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" },
            { href: "/dados", title: "Dados", desc: "44 anos de historia", icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" },
            { href: "/recomendacao", title: "Manejo", desc: "Cobertura de inverno", icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-[24px] border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-forest-50">
                <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
              </div>
              <p className="text-base font-semibold text-foreground tracking-[-0.005em]">{item.title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{item.desc}</p>
            </Link>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Cruz Alta-RS | NASA POWER, Sentinel-2, SRTM, MapBiomas, ISRIC, IBGE
        </p>

        <Chat />
      </section>
    </div>
  );
}
