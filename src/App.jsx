import { useState, useEffect, useRef, useMemo } from "react"
import {
  motion, AnimatePresence,
  useScroll, useTransform, useInView, useSpring
} from "framer-motion"
import { Canvas, useFrame, useLoader } from "@react-three/fiber"
import { Stars, OrbitControls } from "@react-three/drei"
import { TextureLoader } from "three"
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Cell
} from "recharts"
import * as THREE from "three"

const API_URL = "https://hackathon-practice-w99t.onrender.com"

const POLLUTION_SPOTS = [
  { city: "Delhi",     lat: 28.6,  lng: 77.2,   aqi: 287, level: "Hazardous" },
  { city: "Beijing",   lat: 39.9,  lng: 116.4,  aqi: 201, level: "Very Unhealthy" },
  { city: "Cairo",     lat: 30.0,  lng: 31.2,   aqi: 178, level: "Unhealthy" },
  { city: "Jakarta",   lat: -6.2,  lng: 106.8,  aqi: 156, level: "Unhealthy" },
  { city: "Lahore",    lat: 31.5,  lng: 74.3,   aqi: 243, level: "Very Unhealthy" },
  { city: "Mumbai",    lat: 19.0,  lng: 72.8,   aqi: 134, level: "Unhealthy" },
  { city: "Dhaka",     lat: 23.7,  lng: 90.4,   aqi: 198, level: "Very Unhealthy" },
  { city: "London",    lat: 51.5,  lng: -0.1,   aqi: 45,  level: "Good" },
  { city: "New York",  lat: 40.7,  lng: -74.0,  aqi: 52,  level: "Moderate" },
  { city: "Tokyo",     lat: 35.7,  lng: 139.7,  aqi: 48,  level: "Good" },
  { city: "Sydney",    lat: -33.9, lng: 151.2,  aqi: 32,  level: "Good" },
  { city: "São Paulo", lat: -23.5, lng: -46.6,  aqi: 112, level: "Unhealthy" },
  { city: "Lagos",     lat: 6.5,   lng: 3.4,    aqi: 189, level: "Unhealthy" },
  { city: "Paris",     lat: 48.9,  lng: 2.3,    aqi: 42,  level: "Good" },
  { city: "Berlin",    lat: 52.5,  lng: 13.4,   aqi: 38,  level: "Good" },
]

function getMarkerColor(aqi) {
  if (aqi >= 200) return "#ff2020"
  if (aqi >= 150) return "#ff6600"
  if (aqi >= 100) return "#ffaa00"
  if (aqi >= 50)  return "#ffee00"
  return "#00cc44"
}
function getMarkerSize(aqi) {
  if (aqi >= 200) return 18
  if (aqi >= 150) return 14
  if (aqi >= 100) return 11
  return 8
}

// ── Global Styles ──────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Arial, sans-serif;
      background: #010906; color: white; overflow-x: hidden;
      -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
    }
    textarea { font-family: inherit; }
    textarea::placeholder { color: rgba(255,255,255,0.22); }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: #010906; }
    ::-webkit-scrollbar-thumb { background: #15803d; border-radius: 4px; }
  `}</style>
)

// ── Forest + Aurora Background ─────────────────────────────
function ForestBackground({ scrollYProgress }) {
  const rawOpacity = useTransform(scrollYProgress, [0, 0.25, 0.8], [0.28, 1, 0.45])
  const rawSpread  = useTransform(scrollYProgress, [0, 0.35], [1, 1.7])
  const rawRayY    = useTransform(scrollYProgress, [0, 1], [0, 120])
  const rawLayer1Y = useTransform(scrollYProgress, [0, 1], [0, 80])
  const rawLayer2Y = useTransform(scrollYProgress, [0, 1], [0, 40])

  const rayOpacity = useSpring(rawOpacity, { stiffness: 80,  damping: 25 })
  const raySpread  = useSpring(rawSpread,  { stiffness: 50,  damping: 20 })
  const rayY       = useSpring(rawRayY,    { stiffness: 40,  damping: 20 })
  const layer1Y    = useSpring(rawLayer1Y, { stiffness: 30,  damping: 18 })
  const layer2Y    = useSpring(rawLayer2Y, { stiffness: 25,  damping: 16 })

  const RAYS = [
    { left: "5%",  rotate: -13, w: 52, op: 0.16, delay: 0.0 },
    { left: "13%", rotate: -7,  w: 32, op: 0.12, delay: 0.5 },
    { left: "21%", rotate: -1,  w: 78, op: 0.20, delay: 0.9 },
    { left: "30%", rotate:  5,  w: 44, op: 0.15, delay: 0.2 },
    { left: "39%", rotate: -4,  w: 92, op: 0.22, delay: 0.7 },
    { left: "48%", rotate:  8,  w: 58, op: 0.18, delay: 1.1 },
    { left: "57%", rotate: -2,  w: 40, op: 0.13, delay: 0.4 },
    { left: "65%", rotate:  6,  w: 72, op: 0.19, delay: 0.8 },
    { left: "74%", rotate: -9,  w: 48, op: 0.14, delay: 0.6 },
    { left: "83%", rotate:  4,  w: 82, op: 0.21, delay: 1.0 },
    { left: "91%", rotate: -5,  w: 36, op: 0.12, delay: 1.3 },
  ]

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#000805 0%,#011a08 18%,#02200d 35%,#041e0b 55%,#031508 75%,#010906 100%)" }} />

      <motion.div style={{ position: "absolute", top: "-10%", left: "-10%", width: "70%", height: "60%", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,255,80,0.16) 0%, rgba(0,255,80,0.05) 45%, transparent 70%)" }}
        animate={{ x: [0, 100, -45, 0], y: [0, 50, -22, 0], scale: [1, 1.22, 0.9, 1], opacity: [0.7, 1, 0.65, 0.7] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }} />

      <motion.div style={{ position: "absolute", top: "-15%", right: "-5%", width: "58%", height: "52%", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,130,255,0.13) 0%, rgba(0,130,255,0.04) 45%, transparent 70%)" }}
        animate={{ x: [0, -70, 32, 0], y: [0, 60, -32, 0], scale: [1, 0.84, 1.16, 1], opacity: [0.5, 0.88, 0.5, 0.5] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} />

      <motion.div style={{ position: "absolute", top: "5%", left: "28%", width: "46%", height: "40%", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,220,175,0.11) 0%, rgba(0,220,175,0.03) 45%, transparent 70%)" }}
        animate={{ x: [0, 50, -80, 0], y: [0, -35, 70, 0], opacity: [0.4, 0.85, 0.4, 0.4] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }} />

      <motion.div style={{ position: "absolute", inset: 0, backgroundImage: "url('https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80')", backgroundSize: "cover", backgroundPosition: "center top", opacity: 0.58, y: layer1Y, willChange: "transform" }} />
      <motion.div style={{ position: "absolute", inset: 0, backgroundImage: "url('https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80')", backgroundSize: "112%", backgroundPosition: "center 25%", opacity: 0.22, filter: "blur(2px) brightness(0.35)", y: layer2Y, willChange: "transform" }} />

      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,8,4,0) 0%, rgba(0,8,4,0.18) 32%, rgba(0,8,4,0.52) 62%, rgba(1,6,3,0.87) 84%, rgba(1,5,2,0.97) 100%)" }} />

      <motion.div style={{ position: "absolute", inset: 0, opacity: rayOpacity, y: rayY, willChange: "transform, opacity" }}>
        {RAYS.map((ray, i) => (
          <motion.div key={i} style={{
            position: "absolute", top: 0, left: ray.left, width: `${ray.w}px`, height: "100vh",
            background: `linear-gradient(180deg, rgba(200,255,200,${ray.op}) 0%, rgba(150,255,160,${ray.op * 0.68}) 28%, rgba(100,220,130,${ray.op * 0.38}) 58%, rgba(60,180,90,${ray.op * 0.14}) 82%, transparent 100%)`,
            transform: `rotate(${ray.rotate}deg) scaleX(${raySpread})`,
            transformOrigin: "top center", filter: "blur(15px)", willChange: "transform"
          }}
            animate={{ opacity: [ray.op, ray.op * 1.85, ray.op] }}
            transition={{ duration: 3 + i * 0.3, repeat: Infinity, ease: "easeInOut", delay: ray.delay }}
          />
        ))}
      </motion.div>

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "20%", background: "linear-gradient(0deg, rgba(8,30,15,0.96) 0%, rgba(4,18,8,0.55) 48%, transparent 100%)" }} />

      {Array.from({ length: 14 }, (_, i) => (
        <motion.div key={i} style={{
          position: "absolute", bottom: `${8 + (i * 11) % 36}%`, left: `${(i * 19 + 3) % 94}%`,
          width: i % 3 === 0 ? "4px" : "2px", height: i % 3 === 0 ? "4px" : "2px", borderRadius: "50%",
          background: i % 4 === 0 ? "#ffff88" : "#aaff88",
          boxShadow: i % 4 === 0 ? "0 0 8px #ffff88, 0 0 18px rgba(255,255,136,0.55)" : "0 0 6px #aaff88, 0 0 12px rgba(170,255,136,0.45)",
          willChange: "transform, opacity"
        }}
          animate={{ opacity: [0, 1, 0], x: [0, (i % 2 === 0 ? 1 : -1) * (18 + i % 28)], y: [0, -(8 + i % 22)], scale: [0, 1.5, 0] }}
          transition={{ duration: 1.6 + (i % 4) * 0.65, delay: (i * 0.5) % 8, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  )
}

// ── Falling Leaves ─────────────────────────────────────────
const LEAVES = ["🍃", "🌿", "🍀", "🌱"]
function FallingLeaves() {
  const leaves = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
    id: i, emoji: LEAVES[i % LEAVES.length], left: `${4 + i * 12}%`,
    size: 13 + (i % 4) * 6, duration: 11 + (i % 5) * 4,
    delay: i * 1.5, opacity: 0.18 + (i % 3) * 0.07
  })), [])
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1, overflow: "hidden" }}>
      {leaves.map(leaf => (
        <motion.div key={leaf.id} style={{ position: "absolute", left: leaf.left, top: "-60px", fontSize: leaf.size, opacity: leaf.opacity, willChange: "transform" }}
          animate={{ y: ["0px", "110vh"], rotate: [0, 360], x: [0, 20, -15, 10, 0] }}
          transition={{ duration: leaf.duration, delay: leaf.delay, repeat: Infinity, ease: "linear", x: { duration: leaf.duration, repeat: Infinity, ease: "easeInOut" } }}
        >{leaf.emoji}</motion.div>
      ))}
    </div>
  )
}

// ── Leaf Sweep ─────────────────────────────────────────────
function LeafSweep({ onDone }) {
  const sweepLeaves = useMemo(() => Array.from({ length: 26 }, (_, i) => ({
    id: i, emoji: LEAVES[i % LEAVES.length], top: `${(i * 3.9) % 100}vh`, size: 20 + (i % 5) * 10, delay: i * 0.05
  })), [])
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t) }, [])
  return (
    <motion.div style={{ position: "fixed", inset: 0, zIndex: 9999, overflow: "hidden", pointerEvents: "none" }}>
      <motion.div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#052e16,#14532d)" }}
        initial={{ x: "-100%" }} animate={{ x: ["-100%", "0%", "0%", "100%"] }}
        transition={{ duration: 2.2, times: [0, 0.28, 0.72, 1], ease: "easeInOut" }} />
      {sweepLeaves.map(leaf => (
        <motion.div key={leaf.id} style={{ position: "absolute", top: leaf.top, fontSize: leaf.size, left: "-80px" }}
          initial={{ x: "-80px" }} animate={{ x: "115vw", rotate: 520 }}
          transition={{ duration: 1.4, delay: leaf.delay, ease: "easeIn" }}
        >{leaf.emoji}</motion.div>
      ))}
      <motion.div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px" }}
        initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.2, times: [0, 0.18, 0.82, 1] }}>
        <motion.div style={{ fontSize: 80 }} animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}>🌍</motion.div>
        <p style={{ color: "#4ade80", fontSize: "18px", fontWeight: "bold", letterSpacing: "4px" }}>ANALYZING IMPACT...</p>
      </motion.div>
    </motion.div>
  )
}

// ── Scroll Reveal ──────────────────────────────────────────
function Reveal({ children, delay = 0, direction = "up" }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: false, margin: "-50px" })
  const variants = {
    hidden: { opacity: 0, y: direction === "up" ? 36 : direction === "down" ? -36 : 0, x: direction === "left" ? 40 : direction === "right" ? -40 : 0, scale: direction === "scale" ? 0.95 : 1 },
    visible: { opacity: 1, y: 0, x: 0, scale: 1 }
  }
  return (
    <motion.div ref={ref} variants={variants} initial="hidden" animate={inView ? "visible" : "hidden"}
      transition={{ duration: 0.55, delay, ease: [0.25, 0.46, 0.45, 0.94] }}>
      {children}
    </motion.div>
  )
}

// ── CO2 Counter ────────────────────────────────────────────
function CO2Counter() {
  const [count, setCount] = useState(42_180_000_000)
  useEffect(() => { const iv = setInterval(() => setCount(c => c + 1331), 1000); return () => clearInterval(iv) }, [])
  return (
    <div style={{ background: "rgba(255,40,40,0.06)", border: "1px solid rgba(255,100,100,0.18)", borderRadius: "16px", padding: "18px 24px", backdropFilter: "blur(16px)" }}>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "10px", letterSpacing: "2px", marginBottom: "6px" }}>CO₂ EMITTED THIS YEAR (TONS)</p>
      <p style={{ color: "#ff6b6b", fontSize: "26px", fontWeight: "bold", fontFamily: "monospace", margin: 0 }}>{count.toLocaleString()}</p>
      <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "10px", marginTop: "6px" }}>+1,331 tons every second globally</p>
    </div>
  )
}

// ── Speedometer Gauge ──────────────────────────────────────
function SpeedometerGauge({ value }) {
  const [animated, setAnimated] = useState(0)
  useEffect(() => {
    let start = null
    const step = ts => {
      if (!start) start = ts
      const p = Math.min((ts - start) / 1500, 1)
      setAnimated((1 - Math.pow(1 - p, 3)) * value)
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [value])

  const size = 220, cx = 110, cy = 130, r = 82, startAngle = -210, totalAngle = 240
  const toXY = (angle, radius) => ({ x: cx + radius * Math.cos((angle - 90) * Math.PI / 180), y: cy + radius * Math.sin((angle - 90) * Math.PI / 180) })
  const arc = (r, a1, a2, color, sw = 10) => {
    const s = toXY(a1, r), e = toXY(a2, r)
    return <path d={`M${s.x} ${s.y} A${r} ${r} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${e.x} ${e.y}`} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" />
  }
  const needle = toXY(startAngle + totalAngle * animated, r - 12)
  const zones = [{ a1: -210, a2: -150, color: "#ff2222" }, { a1: -150, a2: -90, color: "#ff7700" }, { a1: -90, a2: -30, color: "#ffdd00" }, { a1: -30, a2: 30, color: "#22cc44" }]
  const label = animated > 0.75 ? "Excellent" : animated > 0.5 ? "Good" : animated > 0.25 ? "Moderate" : "Poor"
  const labelColor = animated > 0.75 ? "#4ade80" : animated > 0.5 ? "#86efac" : animated > 0.25 ? "#ffdd00" : "#ff6b6b"
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", letterSpacing: "2px", marginBottom: "8px" }}>ECO IMPACT SCORE</p>
      <svg width={size} height={170} viewBox={`0 0 ${size} 170`}>
        {arc(r, startAngle, 30, "rgba(255,255,255,0.06)", 14)}
        {zones.map((z, i) => <g key={i}>{arc(r, z.a1, z.a2, z.color + "55", 14)}</g>)}
        {arc(r, startAngle, startAngle + totalAngle * animated, labelColor, 14)}
        {Array.from({ length: 11 }, (_, i) => {
          const a = startAngle + (totalAngle / 10) * i, o = toXY(a, r + 18), inn = toXY(a, r + 10)
          return <line key={i} x1={o.x} y1={o.y} x2={inn.x} y2={inn.y} stroke="rgba(255,255,255,0.2)" strokeWidth={i % 5 === 0 ? 2 : 1} />
        })}
        <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke="white" strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={6} fill="white" />
        <circle cx={cx} cy={cy} r={3} fill="#4ade80" />
        <text x={cx} y={cy + 28} textAnchor="middle" fill={labelColor} fontSize="15" fontWeight="bold" fontFamily="Arial">{label}</text>
        <text x={cx} y={cy + 46} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="11" fontFamily="Arial">{Math.round(animated * 100)}% eco score</text>
      </svg>
    </div>
  )
}

// ── Ecosystem Health Bars ──────────────────────────────────
function EcosystemRings({ isEco }) {
  const layers = [
    { name: "Air Quality",   value: isEco ? 82 : 28, color: "#4ade80", icon: "🌬️" },
    { name: "Carbon Output", value: isEco ? 75 : 35, color: "#22c55e", icon: "💨" },
    { name: "Energy Source", value: isEco ? 90 : 20, color: "#86efac", icon: "⚡" },
    { name: "Biodiversity",  value: isEco ? 68 : 42, color: "#6ee7b7", icon: "🌿" },
  ]
  return (
    <div>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", letterSpacing: "2px", marginBottom: "14px", textAlign: "center" }}>ECOSYSTEM HEALTH LAYERS</p>
      {layers.map((layer, i) => (
        <motion.div key={i} style={{ marginBottom: "12px" }}
          initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>{layer.icon} {layer.name}</span>
            <span style={{ color: layer.color, fontSize: "12px", fontWeight: "bold" }}>{layer.value}%</span>
          </div>
          <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
            <motion.div style={{ height: "100%", background: layer.color, borderRadius: "3px" }}
              initial={{ width: "0%" }} animate={{ width: `${layer.value}%` }}
              transition={{ duration: 1.0, delay: 0.4 + i * 0.1, ease: "easeOut" }} />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ── NASA Earth Globe ───────────────────────────────────────
function EarthMesh() {
  const earthRef  = useRef()
  const cloudsRef = useRef()
  const [colorMap, cloudsMap] = useLoader(TextureLoader, [
    "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg",
    "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png",
  ])
  useFrame((_, delta) => {
    if (earthRef.current)  earthRef.current.rotation.y  += delta * 0.08
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.10
  })
  return (
    <group>
      <mesh><sphereGeometry args={[1.08, 48, 48]} /><meshPhongMaterial color="#4488ff" transparent opacity={0.06} side={THREE.BackSide} /></mesh>
      <mesh ref={earthRef}><sphereGeometry args={[1, 48, 48]} /><meshPhongMaterial map={colorMap} specular={new THREE.Color(0x222222)} shininess={12} /></mesh>
      <mesh ref={cloudsRef}><sphereGeometry args={[1.012, 48, 48]} /><meshPhongMaterial map={cloudsMap} transparent opacity={0.38} depthWrite={false} /></mesh>
    </group>
  )
}

function GlobeScene() {
  return (
    <Canvas camera={{ position: [0, 0, 2.6], fov: 45 }} style={{ background: "transparent" }}
      dpr={Math.min(window.devicePixelRatio, 1.5)}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance", stencil: false }}
      frameloop="always">
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 3, 5]} intensity={1.9} />
      <pointLight position={[-4, -2, -4]} intensity={0.25} color="#4466ff" />
      <Stars radius={90} depth={40} count={1200} factor={3} fade speed={0.3} />
      <EarthMesh />
      <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={0.4} dampingFactor={0.08} enableDamping />
    </Canvas>
  )
}

function FixedGlobe({ scrollYProgress }) {
  const rawOpacity = useTransform(scrollYProgress, [0, 0.16, 0.30], [1, 0.65, 0])
  const rawScale   = useTransform(scrollYProgress, [0, 0.28], [1, 0.78])
  const rawY       = useTransform(scrollYProgress, [0, 0.28], [0, -40])
  const opacity = useSpring(rawOpacity, { stiffness: 120, damping: 28 })
  const scale   = useSpring(rawScale,   { stiffness: 100, damping: 26 })
  const y       = useSpring(rawY,       { stiffness: 100, damping: 26 })
  return (
    <motion.div style={{
      position: "fixed", top: "50%", right: "4%",
      translateY: "-50%",
      width: "min(42vw, 480px)", height: "min(42vw, 480px)",
      zIndex: 2, opacity, scale, y,
      pointerEvents: "none", willChange: "transform, opacity"
    }}>
      <GlobeScene />
      <motion.p style={{ textAlign: "center", color: "rgba(255,255,255,0.16)", fontSize: "11px", letterSpacing: "1px", marginTop: "6px" }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2, duration: 0.6 }}>
        Drag to rotate
      </motion.p>
    </motion.div>
  )
}

// ── Animated Number ────────────────────────────────────────
function AnimatedNumber({ target }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start = null
    const step = ts => {
      if (!start) start = ts
      const p = Math.min((ts - start) / 1200, 1)
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target])
  return <>{val}</>
}

// ── Confidence Ring ────────────────────────────────────────
function ConfidenceChart({ value }) {
  const pct = Math.round(value * 100)
  return (
    <div style={{ position: "relative", width: "100%", height: "150px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart innerRadius="65%" outerRadius="95%" data={[{ value: pct }]} startAngle={90} endAngle={-270}>
          <RadialBar dataKey="value" cornerRadius={8} fill="#4ade80" background={{ fill: "rgba(255,255,255,0.04)" }} isAnimationActive animationDuration={1000} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
        <span style={{ color: "#4ade80", fontSize: "28px", fontWeight: "bold", lineHeight: 1 }}><AnimatedNumber target={pct} />%</span>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", marginTop: "4px" }}>Confidence</span>
      </div>
    </div>
  )
}

// ── Keyword Chart ──────────────────────────────────────────
function KeywordChart({ text }) {
  const keywords = ["solar", "wind", "recycle", "green", "clean", "eco"]
  const data = keywords.map(k => ({ keyword: k, found: text.toLowerCase().includes(k) ? 1 : 0 }))
  return (
    <div style={{ width: "100%", height: "110px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <XAxis dataKey="keyword" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis hide domain={[0, 1]} />
          <Bar dataKey="found" radius={[5, 5, 0, 0]} isAnimationActive animationDuration={700} animationBegin={150}>
            {data.map((e, i) => <Cell key={i} fill={e.found ? "#4ade80" : "rgba(255,255,255,0.06)"} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Spinner ────────────────────────────────────────────────
function Spinner() {
  return (
    <motion.div style={{ width: 34, height: 34, border: "3px solid rgba(255,255,255,0.06)", borderTop: "3px solid #4ade80", borderRadius: "50%", margin: "16px auto", willChange: "transform" }}
      animate={{ rotate: 360 }} transition={{ duration: 0.75, repeat: Infinity, ease: "linear" }} />
  )
}

// ── Frosted Card ───────────────────────────────────────────
function FrostedCard({ children, style = {} }) {
  return (
    <div style={{ background: "rgba(4,18,8,0.78)", backdropFilter: "blur(36px)", WebkitBackdropFilter: "blur(36px)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05) inset", ...style }}>
      {children}
    </div>
  )
}

// ── Navbar ─────────────────────────────────────────────────
function Navbar() {
  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  return (
    <motion.nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", height: "56px", background: "rgba(2,10,5,0.72)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      initial={{ y: -56, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: "easeOut" }}>
      <div style={{ color: "#4ade80", fontWeight: "700", fontSize: "16px" }}>🌱 EcoAI</div>
      <div style={{ display: "flex", gap: "4px" }}>
        {[{ label: "Home", id: "hero" }, { label: "Analyzer", id: "analyzer" }, { label: "Map", id: "map" }].map(item => (
          <button key={item.id} onClick={() => scrollTo(item.id)}
            style={{ padding: "7px 16px", background: "transparent", color: "rgba(255,255,255,0.5)", border: "none", borderRadius: "20px", fontSize: "13px", cursor: "pointer", transition: "color 0.15s, background 0.15s" }}
            onMouseEnter={e => { e.target.style.color = "white"; e.target.style.background = "rgba(255,255,255,0.07)" }}
            onMouseLeave={e => { e.target.style.color = "rgba(255,255,255,0.5)"; e.target.style.background = "transparent" }}
          >{item.label}</button>
        ))}
      </div>
    </motion.nav>
  )
}

// ── Hero Section ───────────────────────────────────────────
function HeroSection() {
  return (
    <section id="hero" style={{ minHeight: "100vh", display: "flex", alignItems: "center", padding: "80px 60px 60px", position: "relative", zIndex: 10 }}>
      <div style={{ maxWidth: "50%", paddingRight: "40px" }}>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.55 }} style={{ marginBottom: "24px" }}>
          <span style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.22)", color: "#4ade80", padding: "6px 16px", borderRadius: "20px", fontSize: "11px", letterSpacing: "2px", fontWeight: "600" }}>AI-POWERED • ECO ANALYSIS</span>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38, duration: 0.6 }}
          style={{ fontSize: "clamp(34px, 4.2vw, 62px)", fontWeight: "700", lineHeight: 1.1, color: "white", marginBottom: "18px", letterSpacing: "-1.5px" }}>
          Understand Your
          <span style={{ display: "block", background: "linear-gradient(120deg, #4ade80, #22c55e, #86efac)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Environmental</span>
          Impact
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.55 }}
          style={{ color: "rgba(255,255,255,0.4)", fontSize: "15px", lineHeight: 1.8, marginBottom: "32px", maxWidth: "390px" }}>
          Describe any project or activity. Our AI instantly analyzes its ecological footprint and gives you an actionable impact score in real time.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.62, duration: 0.55 }} style={{ marginBottom: "32px" }}>
          <CO2Counter />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.74, duration: 0.55 }} style={{ display: "flex", gap: "12px" }}>
          <motion.button onClick={() => document.getElementById("analyzer")?.scrollIntoView({ behavior: "smooth" })}
            whileHover={{ scale: 1.03, boxShadow: "0 0 28px rgba(74,222,128,0.38)" }} whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            style={{ padding: "14px 28px", background: "linear-gradient(135deg, #15803d, #4ade80)", color: "white", border: "none", borderRadius: "14px", fontSize: "14px", fontWeight: "600", cursor: "pointer", boxShadow: "0 0 24px rgba(74,222,128,0.28)" }}>
            Start Analyzing →
          </motion.button>
          <motion.button onClick={() => document.getElementById("map")?.scrollIntoView({ behavior: "smooth" })}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            style={{ padding: "14px 28px", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", fontSize: "14px", cursor: "pointer" }}>
            World Map 🗺️
          </motion.button>
        </motion.div>
      </div>
      <motion.div style={{ position: "absolute", bottom: "28px", left: "50%", translateX: "-50%", zIndex: 10 }}
        animate={{ y: [0, 7, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
        <div style={{ width: "22px", height: "36px", border: "1px solid rgba(255,255,255,0.16)", borderRadius: "11px", display: "flex", justifyContent: "center", paddingTop: "5px" }}>
          <motion.div style={{ width: "3px", height: "7px", background: "#4ade80", borderRadius: "2px" }} animate={{ y: [0, 9, 0], opacity: [1, 0, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
        </div>
      </motion.div>
    </section>
  )
}

// ── Analyzer Section ───────────────────────────────────────
function AnalyzerSection() {
  const [text, setText]               = useState("")
  const [result, setResult]           = useState(null)
  const [loading, setLoading]         = useState(false)
  const [loadingText, setLoadingText] = useState("🌿 Analyzing...")
  const [sweeping, setSweeping]       = useState(false)
  const [error, setError]             = useState(null)

  async function analyze() {
    if (!text.trim() || loading) return
    setResult(null); setError(null); setSweeping(true); setLoading(true)
    setLoadingText("🌿 Analyzing...")
    const slowTimer = setTimeout(() => setLoadingText("Waking up AI servers (may take ~50s)..."), 5000)
    try {
      const res = await fetch(`${API_URL}/predict`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      clearTimeout(slowTimer)
      setTimeout(() => { setResult(data); setLoading(false) }, 2400)
    } catch (err) {
      clearTimeout(slowTimer)
      setTimeout(() => { setError(err.message); setLoading(false) }, 2400)
    }
  }

  const isEco = result?.label === "eco-friendly"

  return (
    <>
      <AnimatePresence>{sweeping && <LeafSweep onDone={() => setSweeping(false)} />}</AnimatePresence>
      <section id="analyzer" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 24px 80px", position: "relative", zIndex: 10 }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: "44px" }}>
            <p style={{ color: "#4ade80", fontSize: "11px", letterSpacing: "3px", marginBottom: "10px" }}>AI ANALYSIS</p>
            <h2 style={{ color: "white", fontSize: "clamp(26px,4vw,46px)", fontWeight: "700", letterSpacing: "-0.5px" }}>Analyze Your Impact</h2>
          </div>
        </Reveal>

        <div style={{ width: "100%", maxWidth: "960px", display: "flex", gap: "20px", alignItems: "flex-start", flexWrap: "wrap" }}>
          <Reveal delay={0.1} direction="left">
            <FrostedCard style={{ flex: "1", minWidth: "300px", padding: "30px" }}>
              <div style={{ marginBottom: "18px" }}>
                <h3 style={{ color: "white", fontSize: "17px", fontWeight: "600", marginBottom: "5px" }}>🌱 Eco Analyzer</h3>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>Describe your project or activity</p>
              </div>
              <textarea value={text} onChange={e => setText(e.target.value)}
                placeholder="e.g. our city uses solar panels and wind turbines to power all public buildings..."
                style={{ width: "100%", height: "120px", padding: "14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", color: "white", fontSize: "14px", resize: "none", outline: "none", lineHeight: "1.7", transition: "border 0.15s" }}
                onFocus={e => e.target.style.borderColor = "rgba(74,222,128,0.38)"}
                onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,0.07)"} />
              <motion.button onClick={analyze} disabled={loading || !text.trim()}
                whileHover={!loading && text.trim() ? { scale: 1.02, boxShadow: "0 0 28px rgba(74,222,128,0.38)" } : {}}
                whileTap={!loading && text.trim() ? { scale: 0.98 } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                style={{ marginTop: "12px", width: "100%", padding: "14px", background: loading || !text.trim() ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #15803d, #4ade80)", color: "white", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "600", cursor: loading || !text.trim() ? "not-allowed" : "pointer", boxShadow: loading || !text.trim() ? "none" : "0 0 18px rgba(74,222,128,0.2)" }}>
                {loading ? "Analyzing..." : "⚡ Analyze Impact"}
              </motion.button>

              <AnimatePresence>
                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} style={{ textAlign: "center" }}>
                    <Spinner />
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>{loadingText}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
                    style={{ marginTop: "12px", padding: "13px", background: "rgba(220,38,38,0.09)", border: "1px solid rgba(220,38,38,0.18)", borderRadius: "11px", color: "#fca5a5", fontSize: "13px" }}>
                    ⚠️ {error} — Visit /health to wake Render server first
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {result && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} style={{ marginTop: "18px" }}>
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px", letterSpacing: "2px", textAlign: "center", marginBottom: "6px" }}>ECO KEYWORDS DETECTED</p>
                    <KeywordChart text={text} />
                    <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                      {[
                        { icon: "⚡", label: "Response", value: result.cached ? "cached" : `${result.response_time_ms}ms` },
                        { icon: "📊", label: "Score",    value: `${Math.round(result.confidence * 100)}%` },
                        { icon: isEco ? "✅" : "❌", label: "Status", value: isEco ? "Pass" : "Fail" }
                      ].map((stat, i) => (
                        <motion.div key={i} style={{ flex: 1, textAlign: "center", padding: "10px 4px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08, duration: 0.3 }}>
                          <div style={{ fontSize: "14px" }}>{stat.icon}</div>
                          <div style={{ color: "white", fontSize: "12px", fontWeight: "600", marginTop: "3px" }}>{stat.value}</div>
                          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px" }}>{stat.label}</div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </FrostedCard>
          </Reveal>

          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.45, type: "spring", stiffness: 200, damping: 24 }}
                style={{ flex: "1", minWidth: "280px", display: "flex", flexDirection: "column", gap: "14px" }}>
                <FrostedCard style={{ padding: "22px", textAlign: "center" }}>
                  <motion.div initial={{ scale: 0.75, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 280, damping: 20 }}>
                    <div style={{ fontSize: "46px", marginBottom: "8px" }}>{isEco ? "🌍" : "🏭"}</div>
                    <h3 style={{ color: isEco ? "#4ade80" : "#fb923c", fontSize: "19px", fontWeight: "700", margin: 0 }}>{isEco ? "✅ Eco Friendly" : "⚠️ Needs Improvement"}</h3>
                  </motion.div>
                </FrostedCard>
                <FrostedCard style={{ padding: "18px 22px" }}><SpeedometerGauge value={result.confidence} /></FrostedCard>
                <FrostedCard style={{ padding: "18px 22px" }}><EcosystemRings isEco={isEco} /></FrostedCard>
                <FrostedCard style={{ padding: "14px 22px" }}><ConfidenceChart value={result.confidence} /></FrostedCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </>
  )
}

// ── World Map Section ──────────────────────────────────────
function WorldMapSection() {
  const [hoveredSpot, setHoveredSpot] = useState(null)

  return (
    <section id="map" style={{ minHeight: "100vh", padding: "100px 40px 80px", position: "relative", zIndex: 10 }}>
      <Reveal>
        <div style={{ textAlign: "center", marginBottom: "44px" }}>
          <p style={{ color: "#4ade80", fontSize: "11px", letterSpacing: "3px", marginBottom: "10px" }}>GLOBAL MONITORING</p>
          <h2 style={{ color: "white", fontSize: "clamp(26px,4vw,46px)", fontWeight: "700", letterSpacing: "-0.5px", marginBottom: "10px" }}>World Air Quality</h2>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>Pollution levels across major cities worldwide</p>
        </div>
      </Reveal>

      <Reveal delay={0.08}>
        <div style={{ display: "flex", justifyContent: "center", gap: "18px", flexWrap: "wrap", marginBottom: "24px" }}>
          {[{ color: "#00cc44", label: "Good" }, { color: "#ffee00", label: "Moderate" }, { color: "#ffaa00", label: "Unhealthy" }, { color: "#ff6600", label: "Very Unhealthy" }, { color: "#ff2020", label: "Hazardous" }].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: item.color, boxShadow: `0 0 7px ${item.color}88` }} />
              <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px" }}>{item.label}</span>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.16} direction="scale">
        <FrostedCard style={{ overflow: "hidden", marginBottom: "24px", height: "440px", position: "relative" }}>

          {/* ── SVG World Map ── */}
          <div style={{ width: "100%", height: "100%", position: "relative", backgroundColor: "#020d06", overflow: "hidden" }}>
            <svg viewBox="0 0 1000 500"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.45 }}
              preserveAspectRatio="xMidYMid meet">
              <rect width="1000" height="500" fill="#031408" />
              {Array.from({ length: 19 }, (_, i) => (
                <line key={`v${i}`} x1={i * 55.5} y1={0} x2={i * 55.5} y2={500} stroke="rgba(74,222,128,0.07)" strokeWidth={0.5} />
              ))}
              {Array.from({ length: 9 }, (_, i) => (
                <line key={`h${i}`} x1={0} y1={i * 62.5} x2={1000} y2={i * 62.5} stroke="rgba(74,222,128,0.07)" strokeWidth={0.5} />
              ))}
              <line x1={0} y1={250} x2={1000} y2={250} stroke="rgba(74,222,128,0.18)" strokeWidth={1} strokeDasharray="6 4" />
              <line x1={500} y1={0} x2={500} y2={500} stroke="rgba(74,222,128,0.1)" strokeWidth={0.5} strokeDasharray="4 4" />
              {/* North America */}
              <path d="M 80,60 L 180,50 L 220,70 L 230,110 L 210,140 L 240,150 L 250,180 L 220,200 L 200,220 L 170,260 L 140,280 L 100,260 L 80,220 L 60,180 L 50,130 L 60,90 Z" fill="#0d4020" stroke="rgba(74,222,128,0.35)" strokeWidth={1} />
              <path d="M 180,20 L 230,15 L 250,35 L 240,55 L 210,60 L 185,45 Z" fill="#0d4020" stroke="rgba(74,222,128,0.25)" strokeWidth={0.8} />
              <path d="M 170,260 L 200,265 L 205,280 L 185,295 L 165,285 Z" fill="#0d4020" stroke="rgba(74,222,128,0.25)" strokeWidth={0.8} />
              {/* South America */}
              <path d="M 180,295 L 240,285 L 290,300 L 310,340 L 320,380 L 300,430 L 270,450 L 240,440 L 210,410 L 190,370 L 175,330 Z" fill="#0d4020" stroke="rgba(74,222,128,0.35)" strokeWidth={1} />
              {/* Europe */}
              <path d="M 420,60 L 490,52 L 530,68 L 535,92 L 512,112 L 488,122 L 458,116 L 428,100 L 415,78 Z" fill="#0d4020" stroke="rgba(74,222,128,0.35)" strokeWidth={1} />
              <path d="M 450,28 L 482,22 L 502,40 L 490,66 L 462,70 L 444,54 Z" fill="#0d4020" stroke="rgba(74,222,128,0.25)" strokeWidth={0.8} />
              {/* Africa */}
              <path d="M 428,128 L 532,118 L 572,140 L 582,182 L 572,232 L 560,282 L 528,342 L 490,392 L 460,402 L 428,380 L 398,320 L 388,258 L 398,198 L 414,158 Z" fill="#0d4020" stroke="rgba(74,222,128,0.35)" strokeWidth={1} />
              {/* Middle East */}
              <path d="M 532,118 L 602,108 L 632,130 L 620,162 L 578,182 L 544,164 Z" fill="#0d4020" stroke="rgba(74,222,128,0.25)" strokeWidth={0.8} />
              {/* Russia */}
              <path d="M 510,28 L 700,18 L 855,32 L 872,68 L 820,98 L 758,108 L 678,104 L 598,108 L 538,94 L 510,68 Z" fill="#0d4020" stroke="rgba(74,222,128,0.35)" strokeWidth={1} />
              {/* South Asia */}
              <path d="M 598,108 L 702,104 L 732,130 L 722,172 L 692,202 L 660,212 L 630,196 L 610,166 L 598,134 Z" fill="#0d4020" stroke="rgba(74,222,128,0.35)" strokeWidth={1} />
              {/* Southeast Asia */}
              <path d="M 722,138 L 792,128 L 822,155 L 812,186 L 780,202 L 750,192 L 724,170 Z" fill="#0d4020" stroke="rgba(74,222,128,0.25)" strokeWidth={0.8} />
              {/* China / East Asia */}
              <path d="M 700,78 L 802,68 L 852,90 L 862,122 L 830,152 L 792,162 L 740,156 L 710,140 L 695,110 Z" fill="#0d4020" stroke="rgba(74,222,128,0.35)" strokeWidth={1} />
              {/* Japan */}
              <path d="M 845,83 L 866,78 L 876,96 L 864,108 L 847,102 Z" fill="#0d4020" stroke="rgba(74,222,128,0.2)" strokeWidth={0.8} />
              {/* Australia */}
              <path d="M 758,308 L 872,298 L 922,328 L 932,378 L 900,422 L 840,432 L 778,412 L 744,370 L 747,330 Z" fill="#0d4020" stroke="rgba(74,222,128,0.35)" strokeWidth={1} />
              {/* New Zealand */}
              <path d="M 928,398 L 950,388 L 956,410 L 940,422 Z" fill="#0d4020" stroke="rgba(74,222,128,0.2)" strokeWidth={0.8} />
              {/* UK */}
              <path d="M 415,55 L 432,50 L 438,62 L 428,70 L 415,65 Z" fill="#0d4020" stroke="rgba(74,222,128,0.2)" strokeWidth={0.7} />
            </svg>

            {/* Dark overlay for contrast */}
            <div style={{ position: "absolute", inset: 0, background: "rgba(1,9,4,0.42)", pointerEvents: "none", zIndex: 1 }} />

            {/* GLOBAL RADAR watermark */}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.05, pointerEvents: "none", userSelect: "none", zIndex: 2 }}>
              <span style={{ fontSize: "52px", fontWeight: "bold", color: "#4ade80", letterSpacing: "10px" }}>GLOBAL RADAR</span>
            </div>

            {/* City dots */}
            {POLLUTION_SPOTS.map((spot, i) => {
              const top  = `${50 - (spot.lat / 90) * 48}%`
              const left = `${50 + (spot.lng / 180) * 48}%`
              const isHovered = hoveredSpot === spot
              return (
                <div key={i}
                  onMouseEnter={() => setHoveredSpot(spot)}
                  onMouseLeave={() => setHoveredSpot(null)}
                  style={{
                    position: "absolute", top, left,
                    width: getMarkerSize(spot.aqi), height: getMarkerSize(spot.aqi),
                    background: getMarkerColor(spot.aqi), borderRadius: "50%",
                    transform: `translate(-50%, -50%) scale(${isHovered ? 1.5 : 1})`,
                    boxShadow: isHovered
                      ? `0 0 22px ${getMarkerColor(spot.aqi)}, 0 0 44px ${getMarkerColor(spot.aqi)}44`
                      : `0 0 10px ${getMarkerColor(spot.aqi)}88`,
                    cursor: "pointer", zIndex: isHovered ? 20 : 10,
                    transition: "all 0.18s ease-out"
                  }} />
              )
            })}

            {/* Hover tooltip */}
            <AnimatePresence>
              {hoveredSpot && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.92 }}
                  transition={{ duration: 0.14 }}
                  style={{
                    position: "absolute",
                    top:  `calc(${50 - (hoveredSpot.lat / 90) * 48}% - 14px)`,
                    left: `${50 + (hoveredSpot.lng / 180) * 48}%`,
                    transform: "translate(-50%, -100%)",
                    background: "rgba(4,18,8,0.97)",
                    border: `1px solid ${getMarkerColor(hoveredSpot.aqi)}`,
                    padding: "10px 14px", borderRadius: "10px",
                    color: "white", fontSize: "12px", zIndex: 30,
                    pointerEvents: "none", whiteSpace: "nowrap",
                    boxShadow: `0 8px 28px rgba(0,0,0,0.55), 0 0 14px ${getMarkerColor(hoveredSpot.aqi)}33`,
                    backdropFilter: "blur(12px)"
                  }}>
                  <strong style={{ display: "block", marginBottom: "3px", fontSize: "13px" }}>{hoveredSpot.city}</strong>
                  AQI: <span style={{ color: getMarkerColor(hoveredSpot.aqi), fontWeight: "bold" }}>{hoveredSpot.aqi}</span><br />
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px" }}>{hoveredSpot.level}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </FrostedCard>
      </Reveal>

      {/* City cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(145px, 1fr))", gap: "10px" }}>
        {POLLUTION_SPOTS.sort((a, b) => b.aqi - a.aqi).map((spot, i) => (
          <Reveal key={i} delay={i * 0.025} direction="up">
            <FrostedCard style={{ padding: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "7px" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: getMarkerColor(spot.aqi), boxShadow: `0 0 6px ${getMarkerColor(spot.aqi)}` }} />
                <span style={{ color: "white", fontSize: "12px", fontWeight: "600" }}>{spot.city}</span>
              </div>
              <div style={{ color: getMarkerColor(spot.aqi), fontSize: "22px", fontWeight: "700" }}>{spot.aqi}</div>
              <div style={{ color: "rgba(255,255,255,0.28)", fontSize: "10px", marginTop: "2px" }}>{spot.level}</div>
            </FrostedCard>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

// ── Footer ─────────────────────────────────────────────────
function Footer() {
  return (
    <Reveal>
      <footer style={{ position: "relative", zIndex: 10, textAlign: "center", padding: "44px 24px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <p style={{ color: "#4ade80", fontSize: "18px", marginBottom: "6px" }}>🌱 EcoAI</p>
        <p style={{ color: "rgba(255,255,255,0.18)", fontSize: "12px" }}>Built for a greener future • Hackathon 2025</p>
      </footer>
    </Reveal>
  )
}

// ── Root ───────────────────────────────────────────────────
export default function App() {
  const { scrollYProgress } = useScroll()
  return (
    <>
      <GlobalStyles />
      <ForestBackground scrollYProgress={scrollYProgress} />
      <FallingLeaves />
      <FixedGlobe scrollYProgress={scrollYProgress} />
      <div style={{ position: "relative", zIndex: 10 }}>
        <Navbar />
        <HeroSection />
        <AnalyzerSection />
        <WorldMapSection />
        <Footer />
      </div>
    </>
  )
}