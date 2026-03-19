import { useState, useEffect, useRef, Suspense } from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"
import { Canvas, useFrame } from "@react-three/fiber"
import { Sphere, useTexture, Stars, OrbitControls } from "@react-three/drei"
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet"
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Cell
} from "recharts"
import * as THREE from "three"
import "leaflet/dist/leaflet.css"
import "./App.css"

const API_URL = "https://hackathon-practice-w99t.onrender.com"

// ── Pollution Data ────────────────────────────────────────
const POLLUTION_SPOTS = [
  { city: "Delhi", lat: 28.6, lng: 77.2, aqi: 287, level: "Hazardous" },
  { city: "Beijing", lat: 39.9, lng: 116.4, aqi: 201, level: "Very Unhealthy" },
  { city: "Cairo", lat: 30.0, lng: 31.2, aqi: 178, level: "Unhealthy" },
  { city: "Jakarta", lat: -6.2, lng: 106.8, aqi: 156, level: "Unhealthy" },
  { city: "Lahore", lat: 31.5, lng: 74.3, aqi: 243, level: "Very Unhealthy" },
  { city: "Mumbai", lat: 19.0, lng: 72.8, aqi: 134, level: "Unhealthy" },
  { city: "Dhaka", lat: 23.7, lng: 90.4, aqi: 198, level: "Very Unhealthy" },
  { city: "London", lat: 51.5, lng: -0.1, aqi: 45, level: "Good" },
  { city: "New York", lat: 40.7, lng: -74.0, aqi: 52, level: "Moderate" },
  { city: "Tokyo", lat: 35.7, lng: 139.7, aqi: 48, level: "Good" },
  { city: "Sydney", lat: -33.9, lng: 151.2, aqi: 32, level: "Good" },
  { city: "São Paulo", lat: -23.5, lng: -46.6, aqi: 112, level: "Unhealthy" },
  { city: "Lagos", lat: 6.5, lng: 3.4, aqi: 189, level: "Unhealthy" },
  { city: "Paris", lat: 48.9, lng: 2.3, aqi: 42, level: "Good" },
  { city: "Berlin", lat: 52.5, lng: 13.4, aqi: 38, level: "Good" },
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

// ── Aurora Background ─────────────────────────────────────
function AuroraBackground() {
  return (
    <div style={{
      position: "fixed", inset: 0,
      zIndex: 0, overflow: "hidden",
      pointerEvents: "none"
    }}>
      {/* Base gradient */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, #020d06 0%, #041a0e 50%, #020a08 100%)"
      }} />

      {/* Aurora layer 1 */}
      <motion.div
        style={{
          position: "absolute",
          top: "-20%", left: "-10%",
          width: "70%", height: "60%",
          background: "radial-gradient(ellipse, rgba(0,255,100,0.12) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(40px)"
        }}
        animate={{
          x: [0, 80, -40, 0],
          y: [0, 40, -20, 0],
          scale: [1, 1.2, 0.9, 1],
          opacity: [0.6, 1, 0.7, 0.6]
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Aurora layer 2 */}
      <motion.div
        style={{
          position: "absolute",
          top: "-10%", right: "-10%",
          width: "60%", height: "50%",
          background: "radial-gradient(ellipse, rgba(0,150,255,0.10) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(50px)"
        }}
        animate={{
          x: [0, -60, 30, 0],
          y: [0, 50, -30, 0],
          scale: [1, 0.8, 1.1, 1],
          opacity: [0.5, 0.9, 0.6, 0.5]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Aurora layer 3 — teal */}
      <motion.div
        style={{
          position: "absolute",
          top: "10%", left: "30%",
          width: "50%", height: "40%",
          background: "radial-gradient(ellipse, rgba(0,220,180,0.08) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(60px)"
        }}
        animate={{
          x: [0, 40, -80, 0],
          y: [0, -30, 60, 0],
          opacity: [0.4, 0.8, 0.5, 0.4]
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Forest light rays */}
      {Array.from({ length: 6 }, (_, i) => (
        <motion.div
          key={i}
          style={{
            position: "absolute",
            top: 0,
            left: `${10 + i * 15}%`,
            width: "2px",
            height: "100vh",
            background: `linear-gradient(180deg,
              rgba(100,255,150,${0.03 + i * 0.01}) 0%,
              transparent 60%)`,
            transform: `rotate(${-8 + i * 3}deg)`,
            transformOrigin: "top center",
            filter: "blur(8px)"
          }}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.8
          }}
        />
      ))}
    </div>
  )
}

// ── Falling Leaves — BEHIND everything ───────────────────
const LEAVES = ["🍃", "🌿", "🍀", "🌱"]

function FallingLeaves() {
  const leaves = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    emoji: LEAVES[i % LEAVES.length],
    left: `${3 + i * 7}%`,
    size: 14 + (i % 4) * 6,
    duration: 10 + (i % 5) * 4,
    delay: i * 1.0,
    opacity: 0.25 + (i % 3) * 0.1
  }))

  return (
    // zIndex: 1 — above aurora (0) but below all content (10+)
    <div style={{
      position: "fixed", inset: 0,
      pointerEvents: "none",
      zIndex: 1,
      overflow: "hidden"
    }}>
      {leaves.map(leaf => (
        <motion.div
          key={leaf.id}
          style={{
            position: "absolute",
            left: leaf.left,
            top: "-60px",
            fontSize: leaf.size,
            opacity: leaf.opacity,
            filter: "blur(0.5px)"
          }}
          animate={{
            y: ["0px", "110vh"],
            rotate: [0, 180, 360],
            x: [0, 25, -20, 15, 0]
          }}
          transition={{
            duration: leaf.duration,
            delay: leaf.delay,
            repeat: Infinity,
            ease: "linear",
            x: {
              duration: leaf.duration,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        >
          {leaf.emoji}
        </motion.div>
      ))}
    </div>
  )
}

// ── Leaf Sweep ────────────────────────────────────────────
function LeafSweep({ onDone }) {
  const sweepLeaves = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    emoji: LEAVES[i % LEAVES.length],
    top: `${(i * 3.8) % 100}vh`,
    size: 20 + (i % 5) * 10,
    delay: i * 0.055
  }))

  useEffect(() => {
    const t = setTimeout(onDone, 2500)
    return () => clearTimeout(t)
  }, [])

  return (
    <motion.div style={{
      position: "fixed", inset: 0,
      zIndex: 9999, overflow: "hidden",
      pointerEvents: "none"
    }}>
      <motion.div
        style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, #052e16, #14532d)"
        }}
        initial={{ x: "-100%" }}
        animate={{ x: ["-100%", "0%", "0%", "100%"] }}
        transition={{ duration: 2.3, times: [0, 0.3, 0.7, 1], ease: "easeInOut" }}
      />
      {sweepLeaves.map(leaf => (
        <motion.div
          key={leaf.id}
          style={{
            position: "absolute", top: leaf.top,
            fontSize: leaf.size, left: "-80px"
          }}
          initial={{ x: "-80px", opacity: 1 }}
          animate={{ x: "115vw", rotate: 540 }}
          transition={{ duration: 1.5, delay: leaf.delay, ease: "easeIn" }}
        >
          {leaf.emoji}
        </motion.div>
      ))}
      <motion.div
        style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: "20px"
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.3, times: [0, 0.2, 0.8, 1] }}
      >
        <motion.div
          style={{ fontSize: 80 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        >
          🌍
        </motion.div>
        <p style={{
          color: "#4ade80", fontSize: "18px",
          fontWeight: "bold", letterSpacing: "4px"
        }}>
          ANALYZING IMPACT...
        </p>
      </motion.div>
    </motion.div>
  )
}

// ── Scroll Reveal Wrapper ─────────────────────────────────
function Reveal({ children, delay = 0, direction = "up" }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  const variants = {
    hidden: {
      opacity: 0,
      y: direction === "up" ? 50 : direction === "down" ? -50 : 0,
      x: direction === "left" ? 60 : direction === "right" ? -60 : 0,
      scale: direction === "scale" ? 0.92 : 1
    },
    visible: { opacity: 1, y: 0, x: 0, scale: 1 }
  }

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      transition={{ duration: 0.8, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  )
}

// ── CO2 Counter ───────────────────────────────────────────
function CO2Counter() {
  const [count, setCount] = useState(42_180_000_000)
  useEffect(() => {
    const interval = setInterval(() => {
      setCount(c => c + 1331)
    }, 1000)
    return () => clearInterval(interval)
  }, [])
  return (
    <div style={{
      background: "rgba(255,40,40,0.06)",
      border: "1px solid rgba(255,100,100,0.2)",
      borderRadius: "16px", padding: "18px 24px",
      backdropFilter: "blur(12px)"
    }}>
      <p style={{
        color: "rgba(255,255,255,0.4)",
        fontSize: "10px", letterSpacing: "2px", marginBottom: "6px"
      }}>
        CO₂ EMITTED THIS YEAR (TONS)
      </p>
      <motion.p
        key={Math.floor(count / 10000)}
        style={{
          color: "#ff6b6b", fontSize: "26px",
          fontWeight: "bold", fontFamily: "monospace",
          letterSpacing: "1px", margin: 0
        }}
      >
        {count.toLocaleString()}
      </motion.p>
      <p style={{
        color: "rgba(255,255,255,0.25)",
        fontSize: "10px", marginTop: "6px"
      }}>
        +1,331 tons every second
      </p>
    </div>
  )
}

// ── 3D Globe ──────────────────────────────────────────────
function EarthMesh() {
  const earthRef = useRef()
  const cloudsRef = useRef()
  const [colorMap, normalMap, specularMap, cloudsMap] = useTexture([
    "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg",
    "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg",
    "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg",
    "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png",
  ])
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (earthRef.current) earthRef.current.rotation.y = t * 0.09
    if (cloudsRef.current) cloudsRef.current.rotation.y = t * 0.11
  })
  return (
    <group>
      <Sphere args={[1.08, 64, 64]}>
        <meshPhongMaterial color="#4488ff" transparent opacity={0.07} side={THREE.BackSide} />
      </Sphere>
      <Sphere ref={earthRef} args={[1, 64, 64]}>
        <meshPhongMaterial
          map={colorMap} normalMap={normalMap} specularMap={specularMap}
          specular={new THREE.Color(0x333333)} shininess={15}
        />
      </Sphere>
      <Sphere ref={cloudsRef} args={[1.015, 64, 64]}>
        <meshPhongMaterial map={cloudsMap} transparent opacity={0.35} depthWrite={false} />
      </Sphere>
    </group>
  )
}

function Globe() {
  return (
    <Canvas
      camera={{ position: [0, 0, 2.8], fov: 42 }}
      style={{ background: "transparent" }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.25} />
      <directionalLight position={[5, 3, 5]} intensity={1.8} />
      <pointLight position={[-5, -3, -5]} intensity={0.3} color="#4466ff" />
      <Stars radius={100} depth={50} count={2500} factor={4} fade speed={0.4} />
      <Suspense fallback={null}>
        <EarthMesh />
      </Suspense>
      <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={0.35} />
    </Canvas>
  )
}

// ── Animated Number ───────────────────────────────────────
function AnimatedNumber({ target }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / 1400, 1)
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target])
  return <>{val}</>
}

// ── Confidence Chart ──────────────────────────────────────
function ConfidenceChart({ value }) {
  const pct = Math.round(value * 100)
  return (
    <div style={{ position: "relative", width: "100%", height: "160px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="65%" outerRadius="95%"
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
        alignItems: "center", justifyContent: "center",
        pointerEvents: "none"
      }}>
        <span style={{ color: "#4ade80", fontSize: "30px", fontWeight: "bold", lineHeight: 1 }}>
          <AnimatedNumber target={pct} />%
        </span>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", marginTop: "4px" }}>
          Confidence
        </span>
      </div>
    </div>
  )
}

// ── Keyword Chart ─────────────────────────────────────────
function KeywordChart({ text }) {
  const keywords = ["solar", "wind", "recycle", "green", "clean", "eco"]
  const data = keywords.map(k => ({
    keyword: k, found: text.toLowerCase().includes(k) ? 1 : 0
  }))
  return (
    <div style={{ width: "100%", height: "120px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <XAxis dataKey="keyword"
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
            axisLine={false} tickLine={false}
          />
          <YAxis hide domain={[0, 1]} />
          <Bar dataKey="found" radius={[5, 5, 0, 0]}
            isAnimationActive animationDuration={900} animationBegin={200}
          >
            {data.map((e, i) => (
              <Cell key={i} fill={e.found ? "#4ade80" : "rgba(255,255,255,0.06)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────
function Spinner() {
  return (
    <motion.div
      style={{
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

// ── Frosted Card ──────────────────────────────────────────
function FrostedCard({ children, style = {} }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      borderRadius: "24px",
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: `
        0 4px 24px rgba(0,0,0,0.4),
        0 1px 0 rgba(255,255,255,0.06) inset,
        0 -1px 0 rgba(0,0,0,0.3) inset
      `,
      ...style
    }}>
      {children}
    </div>
  )
}

// ── Navbar ────────────────────────────────────────────────
function Navbar() {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }
  return (
    <motion.nav
      style={{
        position: "fixed", top: 0, left: 0, right: 0,
        zIndex: 100,
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "0 40px",
        height: "60px",
        background: "rgba(2,13,6,0.7)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)"
      }}
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div style={{
        color: "#4ade80", fontWeight: "700",
        fontSize: "16px", letterSpacing: "0.5px"
      }}>
        🌱 EcoAI
      </div>
      <div style={{ display: "flex", gap: "4px" }}>
        {[
          { label: "Home", id: "hero" },
          { label: "Analyzer", id: "analyzer" },
          { label: "World Map", id: "map" }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => scrollTo(item.id)}
            style={{
              padding: "7px 16px",
              background: "transparent",
              color: "rgba(255,255,255,0.6)",
              border: "none", borderRadius: "20px",
              fontSize: "13px", cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseEnter={e => {
              e.target.style.color = "white"
              e.target.style.background = "rgba(255,255,255,0.07)"
            }}
            onMouseLeave={e => {
              e.target.style.color = "rgba(255,255,255,0.6)"
              e.target.style.background = "transparent"
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </motion.nav>
  )
}

// ── Hero Section ──────────────────────────────────────────
function HeroSection() {
  const scrollToAnalyzer = () => {
    document.getElementById("analyzer")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section id="hero" style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      padding: "80px 60px 60px",
      gap: "40px",
      position: "relative",
      zIndex: 10
    }}>
      {/* Left — Text */}
      <div style={{ flex: 1, maxWidth: "520px" }}>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          style={{ marginBottom: "28px" }}
        >
          <span style={{
            background: "rgba(74,222,128,0.1)",
            border: "1px solid rgba(74,222,128,0.25)",
            color: "#4ade80",
            padding: "6px 16px",
            borderRadius: "20px",
            fontSize: "11px",
            letterSpacing: "2px",
            fontWeight: "600"
          }}>
            AI-POWERED • ECO ANALYSIS
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.9 }}
          style={{
            fontSize: "clamp(36px, 5vw, 64px)",
            fontWeight: "700",
            lineHeight: 1.1,
            color: "white",
            marginBottom: "20px",
            letterSpacing: "-1px"
          }}
        >
          Understand Your
          <span style={{
            display: "block",
            background: "linear-gradient(120deg, #4ade80 0%, #22c55e 50%, #86efac 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}>
            Environmental
          </span>
          Impact
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: "16px",
            lineHeight: 1.8,
            marginBottom: "36px",
            maxWidth: "420px"
          }}
        >
          Describe any project or activity. Our AI instantly
          analyzes its ecological footprint and gives you
          an actionable impact score.
        </motion.p>

        {/* CO2 Counter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          style={{ marginBottom: "36px" }}
        >
          <CO2Counter />
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}
        >
          <motion.button
            onClick={scrollToAnalyzer}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: "14px 28px",
              background: "linear-gradient(135deg, #15803d, #4ade80)",
              color: "white", border: "none",
              borderRadius: "14px", fontSize: "14px",
              fontWeight: "600", cursor: "pointer",
              boxShadow: "0 0 24px rgba(74,222,128,0.3)",
              letterSpacing: "0.3px"
            }}
          >
            Start Analyzing →
          </motion.button>
          <motion.button
            onClick={() => document.getElementById("map")?.scrollIntoView({ behavior: "smooth" })}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: "14px 28px",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "14px", fontSize: "14px",
              cursor: "pointer", letterSpacing: "0.3px"
            }}
          >
            View World Map
          </motion.button>
        </motion.div>
      </div>

      {/* Right — Small Globe */}
      <motion.div
        style={{ flex: 1, height: "500px", maxWidth: "500px" }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 1.2, ease: "easeOut" }}
      >
        <Globe />
        <p style={{
          textAlign: "center",
          color: "rgba(255,255,255,0.2)",
          fontSize: "11px",
          marginTop: "8px",
          letterSpacing: "1px"
        }}>
          Drag to explore
        </p>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        style={{
          position: "absolute",
          bottom: "32px",
          left: "50%",
          transform: "translateX(-50%)"
        }}
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div style={{
          width: "24px", height: "38px",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: "12px",
          display: "flex",
          justifyContent: "center",
          paddingTop: "6px"
        }}>
          <motion.div
            style={{
              width: "3px", height: "8px",
              background: "#4ade80",
              borderRadius: "2px"
            }}
            animate={{ y: [0, 10, 0], opacity: [1, 0, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  )
}

// ── Analyzer Section ──────────────────────────────────────
function AnalyzerSection() {
  const [text, setText] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sweeping, setSweeping] = useState(false)
  const [error, setError] = useState(null)

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
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "100px 24px 80px",
        position: "relative",
        zIndex: 10
      }}>
        {/* Section heading */}
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <p style={{
              color: "#4ade80", fontSize: "11px",
              letterSpacing: "3px", marginBottom: "12px"
            }}>
              AI ANALYSIS
            </p>
            <h2 style={{
              color: "white", fontSize: "clamp(28px, 4vw, 48px)",
              fontWeight: "700", letterSpacing: "-0.5px"
            }}>
              Analyze Your Impact
            </h2>
          </div>
        </Reveal>

        <Reveal delay={0.2} direction="scale">
          <FrostedCard style={{ width: "100%", maxWidth: "560px", padding: "36px" }}>

            <div style={{ marginBottom: "24px" }}>
              <h3 style={{
                color: "white", fontSize: "18px",
                fontWeight: "600", marginBottom: "6px"
              }}>
                🌱 Eco Analyzer
              </h3>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px" }}>
                Describe your project or activity below
              </p>
            </div>

            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="e.g. our city uses solar panels and wind turbines to power all public buildings and transport..."
              style={{
                width: "100%", height: "120px", padding: "14px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "14px", color: "white",
                fontSize: "14px", resize: "none", outline: "none",
                fontFamily: "inherit", lineHeight: "1.7",
                transition: "border 0.2s"
              }}
              onFocus={e => e.target.style.borderColor = "rgba(74,222,128,0.4)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
            />

            <motion.button
              onClick={analyze}
              disabled={loading || !text.trim()}
              whileHover={!loading && text.trim() ? {
                scale: 1.02,
                boxShadow: "0 0 30px rgba(74,222,128,0.35)"
              } : {}}
              whileTap={!loading && text.trim() ? { scale: 0.98 } : {}}
              style={{
                marginTop: "14px", width: "100%", padding: "15px",
                background: loading || !text.trim()
                  ? "rgba(255,255,255,0.06)"
                  : "linear-gradient(135deg, #15803d, #4ade80)",
                color: "white", border: "none",
                borderRadius: "14px", fontSize: "14px",
                fontWeight: "600", cursor: loading || !text.trim()
                  ? "not-allowed" : "pointer",
                letterSpacing: "0.3px",
                boxShadow: loading || !text.trim()
                  ? "none" : "0 0 20px rgba(74,222,128,0.2)"
              }}
            >
              {loading ? "🌿 Analyzing..." : "⚡ Analyze Impact"}
            </motion.button>

            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
                    background: "rgba(220,38,38,0.1)",
                    border: "1px solid rgba(220,38,38,0.2)",
                    borderRadius: "12px", color: "#fca5a5", fontSize: "13px"
                  }}
                >
                  ⚠️ {error} — Wake your Render server first by visiting /health
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, type: "spring", bounce: 0.2 }}
                  style={{
                    marginTop: "24px", padding: "22px",
                    background: isEco
                      ? "rgba(74,222,128,0.06)"
                      : "rgba(251,146,60,0.06)",
                    border: `1px solid ${isEco
                      ? "rgba(74,222,128,0.15)"
                      : "rgba(251,146,60,0.15)"}`,
                    borderRadius: "18px"
                  }}
                >
                  <motion.div
                    style={{ textAlign: "center", marginBottom: "16px" }}
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", bounce: 0.4 }}
                  >
                    <div style={{ fontSize: "42px", marginBottom: "8px" }}>
                      {isEco ? "🌍" : "🏭"}
                    </div>
                    <h3 style={{
                      color: isEco ? "#4ade80" : "#fb923c",
                      fontSize: "18px", fontWeight: "600", margin: 0
                    }}>
                      {isEco ? "✅ Eco Friendly" : "⚠️ Needs Improvement"}
                    </h3>
                  </motion.div>

                  <ConfidenceChart value={result.confidence} />

                  <div style={{
                    height: "1px",
                    background: "rgba(255,255,255,0.06)",
                    margin: "14px 0"
                  }} />

                  <p style={{
                    color: "rgba(255,255,255,0.3)", fontSize: "10px",
                    letterSpacing: "2px", textAlign: "center", marginBottom: "6px"
                  }}>
                    ECO KEYWORDS DETECTED
                  </p>
                  <KeywordChart text={text} />

                  <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                    {[
                      { icon: "⚡", label: "Response", value: `${result.response_time_ms}ms` },
                      { icon: "📊", label: "Score", value: `${Math.round(result.confidence * 100)}%` },
                      { icon: isEco ? "✅" : "❌", label: "Status", value: isEco ? "Pass" : "Fail" }
                    ].map((stat, i) => (
                      <motion.div
                        key={i}
                        style={{
                          flex: 1, textAlign: "center", padding: "10px 6px",
                          background: "rgba(255,255,255,0.03)",
                          borderRadius: "10px",
                          border: "1px solid rgba(255,255,255,0.06)"
                        }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + i * 0.1 }}
                      >
                        <div style={{ fontSize: "14px" }}>{stat.icon}</div>
                        <div style={{
                          color: "white", fontSize: "12px",
                          fontWeight: "600", marginTop: "3px"
                        }}>
                          {stat.value}
                        </div>
                        <div style={{
                          color: "rgba(255,255,255,0.3)",
                          fontSize: "10px"
                        }}>
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
      </section>
    </>
  )
}

// ── World Map Section ─────────────────────────────────────
function WorldMapSection() {
  return (
    <section id="map" style={{
      minHeight: "100vh",
      padding: "100px 40px 80px",
      position: "relative",
      zIndex: 10
    }}>
      <Reveal>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p style={{
            color: "#4ade80", fontSize: "11px",
            letterSpacing: "3px", marginBottom: "12px"
          }}>
            GLOBAL MONITORING
          </p>
          <h2 style={{
            color: "white",
            fontSize: "clamp(28px, 4vw, 48px)",
            fontWeight: "700", letterSpacing: "-0.5px",
            marginBottom: "12px"
          }}>
            World Air Quality
          </h2>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "14px" }}>
            Live pollution levels across major cities
          </p>
        </div>
      </Reveal>

      {/* Legend */}
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
                background: item.color,
                boxShadow: `0 0 8px ${item.color}88`
              }} />
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Map */}
      <Reveal delay={0.2} direction="scale">
        <FrostedCard style={{
          overflow: "hidden",
          marginBottom: "32px",
          height: "460px"
        }}>
          <MapContainer
            center={[20, 10]} zoom={2}
            style={{ height: "100%", width: "100%" }}
            zoomControl
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution="&copy; CartoDB"
            />
            {POLLUTION_SPOTS.map((spot, i) => (
              <CircleMarker
                key={i}
                center={[spot.lat, spot.lng]}
                radius={getMarkerSize(spot.aqi)}
                pathOptions={{
                  color: getMarkerColor(spot.aqi),
                  fillColor: getMarkerColor(spot.aqi),
                  fillOpacity: 0.75, weight: 2
                }}
              >
                <Popup>
                  <strong>{spot.city}</strong><br />
                  AQI: {spot.aqi}<br />
                  {spot.level}
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </FrostedCard>
      </Reveal>

      {/* City grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
        gap: "12px"
      }}>
        {POLLUTION_SPOTS.sort((a, b) => b.aqi - a.aqi).map((spot, i) => (
          <Reveal key={i} delay={i * 0.04} direction="up">
            <FrostedCard style={{ padding: "16px" }}>
              <div style={{
                display: "flex", alignItems: "center",
                gap: "8px", marginBottom: "8px"
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: getMarkerColor(spot.aqi),
                  boxShadow: `0 0 6px ${getMarkerColor(spot.aqi)}`
                }} />
                <span style={{
                  color: "white", fontSize: "13px", fontWeight: "600"
                }}>
                  {spot.city}
                </span>
              </div>
              <div style={{
                color: getMarkerColor(spot.aqi),
                fontSize: "24px", fontWeight: "700",
                letterSpacing: "-0.5px"
              }}>
                {spot.aqi}
              </div>
              <div style={{
                color: "rgba(255,255,255,0.35)",
                fontSize: "10px", marginTop: "2px"
              }}>
                {spot.level}
              </div>
            </FrostedCard>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────
function Footer() {
  return (
    <Reveal>
      <footer style={{
        position: "relative", zIndex: 10,
        textAlign: "center",
        padding: "48px 24px",
        borderTop: "1px solid rgba(255,255,255,0.05)"
      }}>
        <p style={{ color: "#4ade80", fontSize: "20px", marginBottom: "8px" }}>
          🌱 EcoAI
        </p>
        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "12px" }}>
          Built for a greener future • Hackathon 2025
        </p>
      </footer>
    </Reveal>
  )
}

// ── Root ──────────────────────────────────────────────────
export default function App() {
  return (
    <>
      {/* Layer 0 — Aurora background */}
      <AuroraBackground />

      {/* Layer 1 — Falling leaves (behind content) */}
      <FallingLeaves />

      {/* Layer 10+ — All content */}
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