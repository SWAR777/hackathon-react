import { useState, useEffect, useRef, Suspense } from "react"
import {
  motion, AnimatePresence,
  useScroll, useTransform, useInView, useSpring
} from "framer-motion"
import { Canvas, useFrame } from "@react-three/fiber"
import { Sphere, useTexture, Stars, OrbitControls } from "@react-three/drei"
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet"
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Cell,
  PieChart, Pie
} from "recharts"
import * as THREE from "three"
import "leaflet/dist/leaflet.css"
import "./App.css"

const API_URL = "https://hackathon-practice-w99t.onrender.com"

// ── Pollution Data ─────────────────────────────────────────
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

// ── Forest Background ──────────────────────────────────────
function ForestBackground({ scrollYProgress }) {
  // Light rays get stronger as you scroll
  const rayOpacity  = useTransform(scrollYProgress, [0, 0.3, 1], [0.3, 1, 0.5])
  const raySpread   = useTransform(scrollYProgress, [0, 0.4], [1, 1.8])
  const rayY        = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])
  // Parallax layers
  const layer1Y     = useTransform(scrollYProgress, [0, 1], ["0%", "20%"])
  const layer2Y     = useTransform(scrollYProgress, [0, 1], ["0%", "10%"])
  const layer3Y     = useTransform(scrollYProgress, [0, 1], ["0%", "5%"])

  const smoothRayOpacity = useSpring(rayOpacity,  { stiffness: 60, damping: 20 })
  const smoothRaySpread  = useSpring(raySpread,   { stiffness: 40, damping: 18 })

  return (
    <div style={{
      position: "fixed", inset: 0,
      zIndex: 0, overflow: "hidden",
      pointerEvents: "none"
    }}>
      {/* Sky — aurora colors */}
      <div style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(
          180deg,
          #000805 0%,
          #011a08 18%,
          #02200d 35%,
          #041e0b 55%,
          #031508 75%,
          #010906 100%
        )`
      }} />

      {/* Aurora 1 — green */}
      <motion.div style={{
        position: "absolute", top: "-10%", left: "-10%",
        width: "70%", height: "60%",
        background: "radial-gradient(ellipse, rgba(0,255,80,0.20) 0%, transparent 68%)",
        filter: "blur(50px)", borderRadius: "50%"
      }}
        animate={{ x: [0, 110, -50, 0], y: [0, 55, -25, 0], scale: [1, 1.25, 0.88, 1], opacity: [0.7, 1, 0.65, 0.7] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Aurora 2 — blue */}
      <motion.div style={{
        position: "absolute", top: "-15%", right: "-5%",
        width: "60%", height: "55%",
        background: "radial-gradient(ellipse, rgba(0,130,255,0.16) 0%, transparent 68%)",
        filter: "blur(55px)", borderRadius: "50%"
      }}
        animate={{ x: [0, -75, 35, 0], y: [0, 65, -35, 0], scale: [1, 0.82, 1.18, 1], opacity: [0.5, 0.9, 0.5, 0.5] }}
        transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Aurora 3 — teal */}
      <motion.div style={{
        position: "absolute", top: "5%", left: "28%",
        width: "48%", height: "42%",
        background: "radial-gradient(ellipse, rgba(0,220,175,0.13) 0%, transparent 68%)",
        filter: "blur(60px)", borderRadius: "50%"
      }}
        animate={{ x: [0, 55, -85, 0], y: [0, -38, 75, 0], opacity: [0.4, 0.88, 0.4, 0.4] }}
        transition={{ duration: 23, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Real forest photo — layer 1 (back) */}
      <motion.div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url('https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80')`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
        opacity: 0.55,
        y: layer1Y
      }} />

      {/* Darker forest overlay — layer 2 (mid) */}
      <motion.div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url('https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80')`,
        backgroundSize: "110%",
        backgroundPosition: "center 20%",
        opacity: 0.25,
        filter: "blur(1px) brightness(0.4)",
        y: layer2Y
      }} />

      {/* Top gradient — sky blends into forest */}
      <div style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(
          180deg,
          rgba(0,8,4,0.0)  0%,
          rgba(0,8,4,0.2)  35%,
          rgba(0,8,4,0.55) 65%,
          rgba(1,6,3,0.88) 85%,
          rgba(1,5,2,0.97) 100%
        )`
      }} />

      {/* VOLUMETRIC LIGHT RAYS — grow on scroll */}
      <motion.div style={{
        position: "absolute", inset: 0,
        opacity: smoothRayOpacity,
        y: rayY
      }}>
        {[
          { left: "6%",  rotate: -14, w: 55,  baseOpacity: 0.22, delay: 0.0 },
          { left: "14%", rotate: -7,  w: 35,  baseOpacity: 0.17, delay: 0.4 },
          { left: "22%", rotate: -2,  w: 75,  baseOpacity: 0.28, delay: 0.9 },
          { left: "31%", rotate: 4,   w: 45,  baseOpacity: 0.20, delay: 0.2 },
          { left: "40%", rotate: -5,  w: 90,  baseOpacity: 0.32, delay: 0.7 },
          { left: "50%", rotate: 7,   w: 60,  baseOpacity: 0.25, delay: 1.2 },
          { left: "59%", rotate: -3,  w: 40,  baseOpacity: 0.18, delay: 0.5 },
          { left: "68%", rotate: 9,   w: 70,  baseOpacity: 0.26, delay: 1.0 },
          { left: "77%", rotate: -9,  w: 50,  baseOpacity: 0.21, delay: 0.3 },
          { left: "86%", rotate: 5,   w: 80,  baseOpacity: 0.29, delay: 0.8 },
          { left: "93%", rotate: -6,  w: 42,  baseOpacity: 0.19, delay: 1.3 },
        ].map((ray, i) => (
          <motion.div key={i} style={{
            position: "absolute", top: 0,
            left: ray.left,
            width: `${ray.w}px`,
            height: "100vh",
            background: `linear-gradient(
              180deg,
              rgba(200,255,200,${ray.baseOpacity}) 0%,
              rgba(150,255,160,${ray.baseOpacity * 0.7}) 25%,
              rgba(100,220,130,${ray.baseOpacity * 0.4}) 55%,
              rgba(60,180,90,${ray.baseOpacity * 0.15}) 80%,
              transparent 100%
            )`,
            transform: `rotate(${ray.rotate}deg) scaleX(${smoothRaySpread})`,
            transformOrigin: "top center",
            filter: "blur(14px)"
          }}
            animate={{ opacity: [ray.baseOpacity, ray.baseOpacity * 1.9, ray.baseOpacity] }}
            transition={{ duration: 3 + i * 0.35, repeat: Infinity, ease: "easeInOut", delay: ray.delay }}
          />
        ))}
      </motion.div>

      {/* Ground fog */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "22%",
        background: `linear-gradient(0deg, rgba(8,30,15,0.95) 0%, rgba(4,18,8,0.6) 45%, transparent 100%)`,
        filter: "blur(3px)"
      }} />

      {/* Fireflies */}
      {Array.from({ length: 22 }, (_, i) => (
        <motion.div key={i} style={{
          position: "absolute",
          bottom: `${8 + (i * 13) % 38}%`,
          left: `${(i * 17 + 5) % 95}%`,
          width: i % 3 === 0 ? "4px" : "2px",
          height: i % 3 === 0 ? "4px" : "2px",
          borderRadius: "50%",
          background: i % 4 === 0 ? "#ffff88" : "#aaff88",
          boxShadow: i % 4 === 0
            ? "0 0 8px #ffff88, 0 0 16px rgba(255,255,136,0.6)"
            : "0 0 6px #aaff88, 0 0 12px rgba(170,255,136,0.5)"
        }}
          animate={{
            opacity: [0, 1, 0],
            x: [0, (i % 2 === 0 ? 1 : -1) * (20 + i % 30)],
            y: [0, -(10 + i % 25)],
            scale: [0, 1.4, 0]
          }}
          transition={{
            duration: 1.8 + (i % 4) * 0.7,
            delay: (i * 0.45) % 7,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

// ── Falling Leaves — zIndex 1 (behind content) ─────────────
const LEAVES = ["🍃", "🌿", "🍀", "🌱"]
function FallingLeaves() {
  const leaves = Array.from({ length: 12 }, (_, i) => ({
    id: i, emoji: LEAVES[i % LEAVES.length],
    left: `${4 + i * 8}%`, size: 13 + (i % 4) * 6,
    duration: 11 + (i % 5) * 4, delay: i * 1.2,
    opacity: 0.18 + (i % 3) * 0.07
  }))
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1, overflow: "hidden" }}>
      {leaves.map(leaf => (
        <motion.div key={leaf.id} style={{
          position: "absolute", left: leaf.left, top: "-60px",
          fontSize: leaf.size, opacity: leaf.opacity, filter: "blur(0.3px)"
        }}
          animate={{ y: ["0px", "110vh"], rotate: [0, 360], x: [0, 22, -18, 12, 0] }}
          transition={{
            duration: leaf.duration, delay: leaf.delay,
            repeat: Infinity, ease: "linear",
            x: { duration: leaf.duration, repeat: Infinity, ease: "easeInOut" }
          }}
        >{leaf.emoji}</motion.div>
      ))}
    </div>
  )
}

// ── Leaf Sweep ─────────────────────────────────────────────
function LeafSweep({ onDone }) {
  const sweepLeaves = Array.from({ length: 28 }, (_, i) => ({
    id: i, emoji: LEAVES[i % LEAVES.length],
    top: `${(i * 3.8) % 100}vh`,
    size: 20 + (i % 5) * 10, delay: i * 0.055
  }))
  useEffect(() => {
    const t = setTimeout(onDone, 2500)
    return () => clearTimeout(t)
  }, [])
  return (
    <motion.div style={{ position: "fixed", inset: 0, zIndex: 9999, overflow: "hidden", pointerEvents: "none" }}>
      <motion.div
        style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#052e16,#14532d)" }}
        initial={{ x: "-100%" }}
        animate={{ x: ["-100%", "0%", "0%", "100%"] }}
        transition={{ duration: 2.3, times: [0, 0.3, 0.7, 1], ease: "easeInOut" }}
      />
      {sweepLeaves.map(leaf => (
        <motion.div key={leaf.id} style={{
          position: "absolute", top: leaf.top, fontSize: leaf.size, left: "-80px"
        }}
          initial={{ x: "-80px" }}
          animate={{ x: "115vw", rotate: 540 }}
          transition={{ duration: 1.5, delay: leaf.delay, ease: "easeIn" }}
        >{leaf.emoji}</motion.div>
      ))}
      <motion.div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: "20px"
      }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.3, times: [0, 0.2, 0.8, 1] }}
      >
        <motion.div style={{ fontSize: 80 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        >🌍</motion.div>
        <p style={{ color: "#4ade80", fontSize: "18px", fontWeight: "bold", letterSpacing: "4px" }}>
          ANALYZING IMPACT...
        </p>
      </motion.div>
    </motion.div>
  )
}

// ── Scroll Reveal ──────────────────────────────────────────
function Reveal({ children, delay = 0, direction = "up" }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: false, margin: "-60px" })
  const variants = {
    hidden: {
      opacity: 0,
      y: direction === "up" ? 48 : direction === "down" ? -48 : 0,
      x: direction === "left" ? 56 : direction === "right" ? -56 : 0,
      scale: direction === "scale" ? 0.93 : 1
    },
    visible: { opacity: 1, y: 0, x: 0, scale: 1 }
  }
  return (
    <motion.div ref={ref} variants={variants} initial="hidden"
      animate={inView ? "visible" : "hidden"}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    >{children}</motion.div>
  )
}

// ── CO2 Counter ────────────────────────────────────────────
function CO2Counter() {
  const [count, setCount] = useState(42_180_000_000)
  useEffect(() => {
    const iv = setInterval(() => setCount(c => c + 1331), 1000)
    return () => clearInterval(iv)
  }, [])
  return (
    <div style={{
      background: "rgba(255,40,40,0.06)",
      border: "1px solid rgba(255,100,100,0.18)",
      borderRadius: "16px", padding: "18px 24px",
      backdropFilter: "blur(12px)"
    }}>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "10px", letterSpacing: "2px", marginBottom: "6px" }}>
        CO₂ EMITTED THIS YEAR (TONS)
      </p>
      <p style={{ color: "#ff6b6b", fontSize: "26px", fontWeight: "bold", fontFamily: "monospace", margin: 0 }}>
        {count.toLocaleString()}
      </p>
      <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "10px", marginTop: "6px" }}>
        +1,331 tons every second globally
      </p>
    </div>
  )
}

// ── CO2 Speedometer Gauge ──────────────────────────────────
function SpeedometerGauge({ value }) {
  // value = 0 to 1 (confidence score)
  const [animated, setAnimated] = useState(0)

  useEffect(() => {
    let start = null
    const target = value
    const step = ts => {
      if (!start) start = ts
      const p = Math.min((ts - start) / 1600, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setAnimated(eased * target)
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [value])

  const size = 220
  const cx = size / 2
  const cy = size / 2 + 20
  const r = 82
  const startAngle = -210
  const endAngle   = 30
  const totalAngle = endAngle - startAngle
  const needleAngle = startAngle + totalAngle * animated

  // Arc helper
  const polarToXY = (angle, radius) => {
    const rad = (angle - 90) * Math.PI / 180
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad)
    }
  }

  const arcPath = (r, start, end, color, strokeWidth = 10) => {
    const s = polarToXY(start, r)
    const e = polarToXY(end,   r)
    const large = (end - start) > 180 ? 1 : 0
    return (
      <path
        d={`M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`}
        fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    )
  }

  const needle = polarToXY(needleAngle, r - 10)

  const zones = [
    { start: -210, end: -150, color: "#ff2222" },
    { start: -150, end: -90,  color: "#ff7700" },
    { start: -90,  end: -30,  color: "#ffdd00" },
    { start: -30,  end: 30,   color: "#22cc44" },
  ]

  const label = animated > 0.75 ? "Excellent"
    : animated > 0.5  ? "Good"
    : animated > 0.25 ? "Moderate"
    : "Poor"

  const labelColor = animated > 0.75 ? "#4ade80"
    : animated > 0.5  ? "#86efac"
    : animated > 0.25 ? "#ffdd00"
    : "#ff6b6b"

  return (
    <div style={{ textAlign: "center" }}>
      <p style={{
        color: "rgba(255,255,255,0.4)", fontSize: "10px",
        letterSpacing: "2px", marginBottom: "8px"
      }}>
        ECO IMPACT SCORE
      </p>
      <svg width={size} height={size * 0.75} viewBox={`0 0 ${size} ${size * 0.75}`}>
        {/* Background arc */}
        {arcPath(r, startAngle, endAngle, "rgba(255,255,255,0.06)", 14)}

        {/* Colored zones */}
        {zones.map((z, i) => (
          <g key={i}>{arcPath(r, z.start, z.end, z.color + "55", 14)}</g>
        ))}

        {/* Animated fill arc */}
        {arcPath(r, startAngle, startAngle + totalAngle * animated,
          animated > 0.75 ? "#4ade80"
          : animated > 0.5 ? "#86efac"
          : animated > 0.25 ? "#ffdd00" : "#ff6b6b", 14)}

        {/* Tick marks */}
        {Array.from({ length: 11 }, (_, i) => {
          const angle = startAngle + (totalAngle / 10) * i
          const outer = polarToXY(angle, r + 18)
          const inner = polarToXY(angle, r + 10)
          return (
            <line key={i}
              x1={outer.x} y1={outer.y}
              x2={inner.x} y2={inner.y}
              stroke="rgba(255,255,255,0.2)" strokeWidth={i % 5 === 0 ? 2 : 1}
            />
          )
        })}

        {/* Needle */}
        <line
          x1={cx} y1={cy}
          x2={needle.x} y2={needle.y}
          stroke="white" strokeWidth={2.5} strokeLinecap="round"
        />
        {/* Needle pivot */}
        <circle cx={cx} cy={cy} r={6} fill="white" />
        <circle cx={cx} cy={cy} r={3} fill="#4ade80" />

        {/* Center label */}
        <text x={cx} y={cy + 30}
          textAnchor="middle" fill={labelColor}
          fontSize="16" fontWeight="bold" fontFamily="Arial"
        >
          {label}
        </text>
        <text x={cx} y={cy + 48}
          textAnchor="middle" fill="rgba(255,255,255,0.35)"
          fontSize="11" fontFamily="Arial"
        >
          {Math.round(animated * 100)}% eco score
        </text>
      </svg>
    </div>
  )
}

// ── Ecosystem Health Rings ─────────────────────────────────
function EcosystemRings({ isEco }) {
  const layers = [
    { name: "Air Quality",    value: isEco ? 82 : 28, color: "#4ade80", icon: "🌬️" },
    { name: "Carbon Output",  value: isEco ? 75 : 35, color: "#22c55e", icon: "💨" },
    { name: "Energy Source",  value: isEco ? 90 : 20, color: "#86efac", icon: "⚡" },
    { name: "Biodiversity",   value: isEco ? 68 : 42, color: "#6ee7b7", icon: "🌿" },
  ]

  return (
    <div style={{ padding: "0 4px" }}>
      <p style={{
        color: "rgba(255,255,255,0.4)", fontSize: "10px",
        letterSpacing: "2px", marginBottom: "14px", textAlign: "center"
      }}>
        ECOSYSTEM HEALTH LAYERS
      </p>
      {layers.map((layer, i) => (
        <motion.div key={i}
          style={{ marginBottom: "12px" }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 + i * 0.12, duration: 0.6 }}
        >
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: "5px"
          }}>
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>
              {layer.icon} {layer.name}
            </span>
            <span style={{ color: layer.color, fontSize: "12px", fontWeight: "bold" }}>
              {layer.value}%
            </span>
          </div>
          <div style={{
            height: "6px", background: "rgba(255,255,255,0.06)",
            borderRadius: "3px", overflow: "hidden"
          }}>
            <motion.div
              style={{ height: "100%", background: layer.color, borderRadius: "3px" }}
              initial={{ width: "0%" }}
              animate={{ width: `${layer.value}%` }}
              transition={{ duration: 1.2, delay: 0.5 + i * 0.12, ease: "easeOut" }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ── 3D Globe ───────────────────────────────────────────────
function EarthMesh() {
  const earthRef  = useRef()
  const cloudsRef = useRef()
  const [colorMap, normalMap, specularMap, cloudsMap] = useTexture([
    "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg",
    "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg",
    "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg",
    "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png",
  ])
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (earthRef.current)  earthRef.current.rotation.y  = t * 0.09
    if (cloudsRef.current) cloudsRef.current.rotation.y = t * 0.11
  })
  return (
    <group>
      <Sphere args={[1.08, 64, 64]}>
        <meshPhongMaterial color="#4488ff" transparent opacity={0.07} side={THREE.BackSide} />
      </Sphere>
      <Sphere ref={earthRef} args={[1, 64, 64]}>
        <meshPhongMaterial map={colorMap} normalMap={normalMap}
          specularMap={specularMap} specular={new THREE.Color(0x333333)} shininess={15} />
      </Sphere>
      <Sphere ref={cloudsRef} args={[1.015, 64, 64]}>
        <meshPhongMaterial map={cloudsMap} transparent opacity={0.35} depthWrite={false} />
      </Sphere>
    </group>
  )
}

function Globe() {
  return (
    <Canvas camera={{ position: [0, 0, 2.8], fov: 42 }}
      style={{ background: "transparent" }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.25} />
      <directionalLight position={[5, 3, 5]} intensity={1.8} />
      <pointLight position={[-5, -3, -5]} intensity={0.3} color="#4466ff" />
      <Stars radius={100} depth={50} count={2000} factor={4} fade speed={0.4} />
      <Suspense fallback={null}><EarthMesh /></Suspense>
      <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={0.35} />
    </Canvas>
  )
}

// ── Fixed Globe ────────────────────────────────────────────
function FixedGlobe({ scrollYProgress }) {
  const opacity = useTransform(scrollYProgress, [0, 0.18, 0.32], [1, 0.6, 0])
  const scale   = useTransform(scrollYProgress, [0, 0.3],  [1, 0.75])
  const y       = useTransform(scrollYProgress, [0, 0.3],  [0, -50])
  return (
    <motion.div style={{
      position: "fixed",
      top: "50%", right: "5%",
      translateY: "-50%",
      width: "40vw", height: "40vw",
      maxWidth: "500px", maxHeight: "500px",
      zIndex: 2, opacity, scale, y,
      pointerEvents: "none"
    }}>
      <Globe />
      <motion.p style={{
        textAlign: "center", color: "rgba(255,255,255,0.18)",
        fontSize: "11px", letterSpacing: "1px", marginTop: "6px"
      }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
      >
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
      const p = Math.min((ts - start) / 1400, 1)
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
        <RadialBarChart innerRadius="65%" outerRadius="95%"
          data={[{ value: pct }]} startAngle={90} endAngle={-270}
        >
          <RadialBar dataKey="value" cornerRadius={8} fill="#4ade80"
            background={{ fill: "rgba(255,255,255,0.04)" }}
            isAnimationActive animationDuration={1200}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", pointerEvents: "none"
      }}>
        <span style={{ color: "#4ade80", fontSize: "28px", fontWeight: "bold", lineHeight: 1 }}>
          <AnimatedNumber target={pct} />%
        </span>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", marginTop: "4px" }}>
          Confidence
        </span>
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
          <XAxis dataKey="keyword"
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
            axisLine={false} tickLine={false}
          />
          <YAxis hide domain={[0, 1]} />
          <Bar dataKey="found" radius={[5, 5, 0, 0]} isAnimationActive animationDuration={900} animationBegin={200}>
            {data.map((e, i) => (
              <Cell key={i} fill={e.found ? "#4ade80" : "rgba(255,255,255,0.06)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Spinner ────────────────────────────────────────────────
function Spinner() {
  return (
    <motion.div style={{
      width: 36, height: 36,
      border: "3px solid rgba(255,255,255,0.06)",
      borderTop: "3px solid #4ade80",
      borderRadius: "50%", margin: "16px auto"
    }}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
    />
  )
}

// ── Frosted Card ───────────────────────────────────────────
function FrostedCard({ children, style = {} }) {
  return (
    <div style={{
      background: "rgba(4,18,8,0.6)",
      backdropFilter: "blur(30px)",
      WebkitBackdropFilter: "blur(30px)",
      borderRadius: "24px",
      border: "1px solid rgba(255,255,255,0.07)",
      boxShadow: `
        0 8px 40px rgba(0,0,0,0.65),
        0 1px 0 rgba(255,255,255,0.05) inset,
        0 0 60px rgba(0,100,40,0.07)
      `,
      ...style
    }}>
      {children}
    </div>
  )
}

// ── Navbar ─────────────────────────────────────────────────
function Navbar() {
  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  return (
    <motion.nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 40px", height: "56px",
      background: "rgba(2,10,5,0.7)",
      backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255,255,255,0.05)"
    }}
      initial={{ y: -56, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div style={{ color: "#4ade80", fontWeight: "700", fontSize: "16px" }}>
        🌱 EcoAI
      </div>
      <div style={{ display: "flex", gap: "4px" }}>
        {[
          { label: "Home",     id: "hero" },
          { label: "Analyzer", id: "analyzer" },
          { label: "Map",      id: "map" }
        ].map(item => (
          <button key={item.id} onClick={() => scrollTo(item.id)}
            style={{
              padding: "7px 16px", background: "transparent",
              color: "rgba(255,255,255,0.5)", border: "none",
              borderRadius: "20px", fontSize: "13px", cursor: "pointer",
              transition: "all 0.2s"
            }}
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
    <section id="hero" style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center",
      padding: "80px 60px 60px",
      position: "relative", zIndex: 10
    }}>
      <div style={{ maxWidth: "50%", paddingRight: "40px" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          style={{ marginBottom: "24px" }}
        >
          <span style={{
            background: "rgba(74,222,128,0.1)",
            border: "1px solid rgba(74,222,128,0.2)",
            color: "#4ade80", padding: "6px 16px",
            borderRadius: "20px", fontSize: "11px",
            letterSpacing: "2px", fontWeight: "600"
          }}>
            AI-POWERED • ECO ANALYSIS
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.9 }}
          style={{
            fontSize: "clamp(36px, 4.5vw, 64px)",
            fontWeight: "700", lineHeight: 1.1,
            color: "white", marginBottom: "20px", letterSpacing: "-1.5px"
          }}
        >
          Understand Your
          <span style={{
            display: "block",
            background: "linear-gradient(120deg, #4ade80, #22c55e, #86efac)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>Environmental</span>
          Impact
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          style={{
            color: "rgba(255,255,255,0.4)", fontSize: "16px",
            lineHeight: 1.8, marginBottom: "36px", maxWidth: "400px"
          }}
        >
          Describe any project or activity. Our AI instantly
          analyzes its ecological footprint and gives you
          an actionable impact score in real time.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }} style={{ marginBottom: "36px" }}
        >
          <CO2Counter />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          style={{ display: "flex", gap: "12px" }}
        >
          <motion.button
            onClick={() => document.getElementById("analyzer")?.scrollIntoView({ behavior: "smooth" })}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            style={{
              padding: "14px 28px",
              background: "linear-gradient(135deg, #15803d, #4ade80)",
              color: "white", border: "none", borderRadius: "14px",
              fontSize: "14px", fontWeight: "600", cursor: "pointer",
              boxShadow: "0 0 28px rgba(74,222,128,0.3)"
            }}
          >Start Analyzing →</motion.button>
          <motion.button
            onClick={() => document.getElementById("map")?.scrollIntoView({ behavior: "smooth" })}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            style={{
              padding: "14px 28px",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.65)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "14px", fontSize: "14px", cursor: "pointer"
            }}
          >World Map 🗺️</motion.button>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div style={{
        position: "absolute", bottom: "32px", left: "50%",
        transform: "translateX(-50%)", zIndex: 10
      }}
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div style={{
          width: "24px", height: "38px",
          border: "1px solid rgba(255,255,255,0.18)",
          borderRadius: "12px",
          display: "flex", justifyContent: "center", paddingTop: "6px"
        }}>
          <motion.div style={{ width: "3px", height: "8px", background: "#4ade80", borderRadius: "2px" }}
            animate={{ y: [0, 10, 0], opacity: [1, 0, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  )
}

// ── Analyzer Section ───────────────────────────────────────
function AnalyzerSection() {
  const [text, setText]         = useState("")
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [sweeping, setSweeping] = useState(false)
  const [error, setError]       = useState(null)

  async function analyze() {
    if (!text.trim() || loading) return
    setResult(null); setError(null)
    setSweeping(true); setLoading(true)
    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      setTimeout(() => { setResult(data); setLoading(false) }, 2400)
    } catch (err) {
      setTimeout(() => { setError(err.message); setLoading(false) }, 2400)
    }
  }

  const isEco = result?.label === "eco-friendly"

  return (
    <>
      <AnimatePresence>
        {sweeping && <LeafSweep onDone={() => setSweeping(false)} />}
      </AnimatePresence>

      <section id="analyzer" style={{
        minHeight: "100vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "120px 24px 80px",
        position: "relative", zIndex: 10
      }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <p style={{ color: "#4ade80", fontSize: "11px", letterSpacing: "3px", marginBottom: "12px" }}>
              AI ANALYSIS
            </p>
            <h2 style={{
              color: "white", fontSize: "clamp(28px,4vw,48px)",
              fontWeight: "700", letterSpacing: "-0.5px"
            }}>
              Analyze Your Impact
            </h2>
          </div>
        </Reveal>

        {/* Two column layout when result is shown */}
        <div style={{
          width: "100%", maxWidth: "960px",
          display: "flex", gap: "20px",
          alignItems: "flex-start",
          flexWrap: "wrap"
        }}>
          {/* Left — input card */}
          <Reveal delay={0.15} direction="left">
            <FrostedCard style={{ flex: "1", minWidth: "300px", padding: "32px" }}>
              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ color: "white", fontSize: "18px", fontWeight: "600", marginBottom: "6px" }}>
                  🌱 Eco Analyzer
                </h3>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>
                  Describe your project or activity
                </p>
              </div>

              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="e.g. our city uses solar panels and wind turbines to power all public buildings..."
                style={{
                  width: "100%", height: "120px", padding: "14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "14px", color: "white",
                  fontSize: "14px", resize: "none", outline: "none",
                  fontFamily: "inherit", lineHeight: "1.7",
                  transition: "border 0.2s"
                }}
                onFocus={e => e.target.style.borderColor = "rgba(74,222,128,0.35)"}
                onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,0.07)"}
              />

              <motion.button
                onClick={analyze}
                disabled={loading || !text.trim()}
                whileHover={!loading && text.trim() ? { scale: 1.02, boxShadow: "0 0 32px rgba(74,222,128,0.4)" } : {}}
                whileTap={!loading && text.trim() ? { scale: 0.98 } : {}}
                style={{
                  marginTop: "14px", width: "100%", padding: "15px",
                  background: loading || !text.trim()
                    ? "rgba(255,255,255,0.05)"
                    : "linear-gradient(135deg, #15803d, #4ade80)",
                  color: "white", border: "none", borderRadius: "14px",
                  fontSize: "14px", fontWeight: "600",
                  cursor: loading || !text.trim() ? "not-allowed" : "pointer",
                  boxShadow: loading || !text.trim() ? "none" : "0 0 20px rgba(74,222,128,0.2)"
                }}
              >
                {loading ? "🌿 Analyzing..." : "⚡ Analyze Impact"}
              </motion.button>

              <AnimatePresence>
                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ textAlign: "center" }}
                  >
                    <Spinner />
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>
                      Running analysis...
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{
                      marginTop: "14px", padding: "14px",
                      background: "rgba(220,38,38,0.09)",
                      border: "1px solid rgba(220,38,38,0.18)",
                      borderRadius: "12px", color: "#fca5a5", fontSize: "13px"
                    }}
                  >
                    ⚠️ {error} — Wake Render server first via /health
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Keyword chart always visible after result */}
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{ marginTop: "20px" }}
                  >
                    <p style={{
                      color: "rgba(255,255,255,0.3)", fontSize: "10px",
                      letterSpacing: "2px", textAlign: "center", marginBottom: "6px"
                    }}>
                      ECO KEYWORDS DETECTED
                    </p>
                    <KeywordChart text={text} />

                    <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                      {[
                        { icon: "⚡", label: "Response", value: `${result.response_time_ms}ms` },
                        { icon: "📊", label: "Score",    value: `${Math.round(result.confidence * 100)}%` },
                        { icon: isEco ? "✅" : "❌", label: "Status", value: isEco ? "Pass" : "Fail" }
                      ].map((stat, i) => (
                        <motion.div key={i}
                          style={{
                            flex: 1, textAlign: "center", padding: "10px 4px",
                            background: "rgba(255,255,255,0.03)",
                            borderRadius: "10px",
                            border: "1px solid rgba(255,255,255,0.05)"
                          }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 + i * 0.1 }}
                        >
                          <div style={{ fontSize: "14px" }}>{stat.icon}</div>
                          <div style={{ color: "white", fontSize: "12px", fontWeight: "600", marginTop: "3px" }}>
                            {stat.value}
                          </div>
                          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px" }}>
                            {stat.label}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </FrostedCard>
          </Reveal>

          {/* Right — graphics cards (appear after result) */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.7, type: "spring", bounce: 0.2 }}
                style={{ flex: "1", minWidth: "280px", display: "flex", flexDirection: "column", gap: "16px" }}
              >
                {/* Result badge */}
                <FrostedCard style={{ padding: "24px", textAlign: "center" }}>
                  <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                  >
                    <div style={{ fontSize: "48px", marginBottom: "10px" }}>
                      {isEco ? "🌍" : "🏭"}
                    </div>
                    <h3 style={{
                      color: isEco ? "#4ade80" : "#fb923c",
                      fontSize: "20px", fontWeight: "700", margin: 0
                    }}>
                      {isEco ? "✅ Eco Friendly" : "⚠️ Needs Improvement"}
                    </h3>
                  </motion.div>
                </FrostedCard>

                {/* Speedometer */}
                <FrostedCard style={{ padding: "20px 24px" }}>
                  <SpeedometerGauge value={result.confidence} />
                </FrostedCard>

                {/* Ecosystem health rings */}
                <FrostedCard style={{ padding: "20px 24px" }}>
                  <EcosystemRings isEco={isEco} />
                </FrostedCard>

                {/* Confidence ring */}
                <FrostedCard style={{ padding: "16px 24px" }}>
                  <ConfidenceChart value={result.confidence} />
                </FrostedCard>
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
  return (
    <section id="map" style={{
      minHeight: "100vh", padding: "100px 40px 80px",
      position: "relative", zIndex: 10
    }}>
      <Reveal>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p style={{ color: "#4ade80", fontSize: "11px", letterSpacing: "3px", marginBottom: "12px" }}>
            GLOBAL MONITORING
          </p>
          <h2 style={{
            color: "white", fontSize: "clamp(28px,4vw,48px)",
            fontWeight: "700", letterSpacing: "-0.5px", marginBottom: "12px"
          }}>
            World Air Quality
          </h2>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>
            Pollution levels across major cities worldwide
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div style={{
          display: "flex", justifyContent: "center",
          gap: "20px", flexWrap: "wrap", marginBottom: "28px"
        }}>
          {[
            { color: "#00cc44", label: "Good" },
            { color: "#ffee00", label: "Moderate" },
            { color: "#ffaa00", label: "Unhealthy" },
            { color: "#ff6600", label: "Very Unhealthy" },
            { color: "#ff2020", label: "Hazardous" }
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: item.color, boxShadow: `0 0 8px ${item.color}88`
              }} />
              <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px" }}>{item.label}</span>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.2} direction="scale">
        <FrostedCard style={{ overflow: "hidden", marginBottom: "28px", height: "450px" }}>
          <MapContainer center={[20, 10]} zoom={2} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution="&copy; CartoDB"
            />
            {POLLUTION_SPOTS.map((spot, i) => (
              <CircleMarker key={i} center={[spot.lat, spot.lng]}
                radius={getMarkerSize(spot.aqi)}
                pathOptions={{
                  color: getMarkerColor(spot.aqi),
                  fillColor: getMarkerColor(spot.aqi),
                  fillOpacity: 0.75, weight: 2
                }}
              >
                <Popup>
                  <strong>{spot.city}</strong><br />
                  AQI: {spot.aqi}<br />{spot.level}
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </FrostedCard>
      </Reveal>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))",
        gap: "12px"
      }}>
        {POLLUTION_SPOTS.sort((a, b) => b.aqi - a.aqi).map((spot, i) => (
          <Reveal key={i} delay={i * 0.03} direction="up">
            <FrostedCard style={{ padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: getMarkerColor(spot.aqi),
                  boxShadow: `0 0 6px ${getMarkerColor(spot.aqi)}`
                }} />
                <span style={{ color: "white", fontSize: "13px", fontWeight: "600" }}>{spot.city}</span>
              </div>
              <div style={{ color: getMarkerColor(spot.aqi), fontSize: "24px", fontWeight: "700" }}>
                {spot.aqi}
              </div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px", marginTop: "2px" }}>
                {spot.level}
              </div>
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
      <footer style={{
        position: "relative", zIndex: 10, textAlign: "center",
        padding: "48px 24px", borderTop: "1px solid rgba(255,255,255,0.04)"
      }}>
        <p style={{ color: "#4ade80", fontSize: "20px", marginBottom: "8px" }}>🌱 EcoAI</p>
        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "12px" }}>
          Built for a greener future • Hackathon 2025
        </p>
      </footer>
    </Reveal>
  )
}

// ── Root ───────────────────────────────────────────────────
export default function App() {
  const { scrollYProgress } = useScroll()

  return (
    <>
      {/* Layer 0 — Forest + aurora (fixed) */}
      <ForestBackground scrollYProgress={scrollYProgress} />

      {/* Layer 1 — Falling leaves behind content */}
      <FallingLeaves />

      {/* Layer 2 — Fixed globe fades on scroll */}
      <FixedGlobe scrollYProgress={scrollYProgress} />

      {/* Layer 10 — All page content */}
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