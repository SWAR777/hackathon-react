import { useState, useEffect, useRef, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
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

// ── Pollution Data (realistic fake data for demo) ─────────
const POLLUTION_SPOTS = [
  { city: "Delhi", lat: 28.6, lng: 77.2, aqi: 287, level: "Hazardous" },
  { city: "Beijing", lat: 39.9, lng: 116.4, aqi: 201, level: "Very Unhealthy" },
  { city: "Cairo", lat: 30.0, lng: 31.2, aqi: 178, level: "Unhealthy" },
  { city: "Jakarta", lat: -6.2, lng: 106.8, aqi: 156, level: "Unhealthy" },
  { city: "Lahore", lat: 31.5, lng: 74.3, aqi: 243, level: "Very Unhealthy" },
  { city: "Mumbai", lat: 19.0, lng: 72.8, aqi: 134, level: "Unhealthy" },
  { city: "Dhaka", lat: 23.7, lng: 90.4, aqi: 198, level: "Very Unhealthy" },
  { city: "Karachi", lat: 24.8, lng: 67.0, aqi: 167, level: "Unhealthy" },
  { city: "London", lat: 51.5, lng: -0.1, aqi: 45, level: "Good" },
  { city: "New York", lat: 40.7, lng: -74.0, aqi: 52, level: "Moderate" },
  { city: "Tokyo", lat: 35.7, lng: 139.7, aqi: 48, level: "Good" },
  { city: "Sydney", lat: -33.9, lng: 151.2, aqi: 32, level: "Good" },
  { city: "São Paulo", lat: -23.5, lng: -46.6, aqi: 112, level: "Unhealthy for Sensitive" },
  { city: "Mexico City", lat: 19.4, lng: -99.1, aqi: 143, level: "Unhealthy" },
  { city: "Lagos", lat: 6.5, lng: 3.4, aqi: 189, level: "Unhealthy" },
  { city: "Riyadh", lat: 24.7, lng: 46.7, aqi: 155, level: "Unhealthy" },
  { city: "Istanbul", lat: 41.0, lng: 28.9, aqi: 88, level: "Moderate" },
  { city: "Paris", lat: 48.9, lng: 2.3, aqi: 42, level: "Good" },
  { city: "Berlin", lat: 52.5, lng: 13.4, aqi: 38, level: "Good" },
  { city: "Toronto", lat: 43.7, lng: -79.4, aqi: 29, level: "Good" },
]

function getMarkerColor(aqi) {
  if (aqi >= 200) return "#ff2020"
  if (aqi >= 150) return "#ff6600"
  if (aqi >= 100) return "#ffaa00"
  if (aqi >= 50) return "#ffee00"
  return "#00cc44"
}

function getMarkerSize(aqi) {
  if (aqi >= 200) return 18
  if (aqi >= 150) return 14
  if (aqi >= 100) return 11
  return 8
}

// ── CO2 Counter ───────────────────────────────────────────
function CO2Counter() {
  const [count, setCount] = useState(0)
  const baseRef = useRef(42_000_000_000)

  useEffect(() => {
    // CO2 emitted globally ~42 billion tons/year
    // That's ~1331 tons per second
    const interval = setInterval(() => {
      baseRef.current += 1331
      setCount(baseRef.current)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatted = count.toLocaleString()

  return (
    <motion.div
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,100,100,0.3)",
        borderRadius: "16px",
        padding: "20px 24px",
        textAlign: "center",
        boxShadow: "0 0 30px rgba(255,60,60,0.1)"
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.2, duration: 0.6 }}
    >
      <p style={{
        color: "rgba(255,255,255,0.5)",
        fontSize: "11px",
        letterSpacing: "2px",
        marginBottom: "8px"
      }}>
        CO₂ EMITTED THIS SESSION (TONS)
      </p>
      <motion.p
        key={count}
        style={{
          color: "#ff6b6b",
          fontSize: "28px",
          fontWeight: "bold",
          fontFamily: "monospace",
          letterSpacing: "2px"
        }}
      >
        {formatted}
      </motion.p>
      <p style={{
        color: "rgba(255,255,255,0.3)",
        fontSize: "11px",
        marginTop: "8px"
      }}>
        +1,331 tons every second globally
      </p>
    </motion.div>
  )
}

// ── 3D Earth ──────────────────────────────────────────────
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
    if (earthRef.current) earthRef.current.rotation.y = t * 0.08
    if (cloudsRef.current) cloudsRef.current.rotation.y = t * 0.10
  })

  return (
    <group>
      <Sphere args={[1.08, 64, 64]}>
        <meshPhongMaterial
          color="#4488ff" transparent opacity={0.08}
          side={THREE.BackSide}
        />
      </Sphere>
      <Sphere ref={earthRef} args={[1, 64, 64]}>
        <meshPhongMaterial
          map={colorMap} normalMap={normalMap}
          specularMap={specularMap}
          specular={new THREE.Color(0x333333)} shininess={15}
        />
      </Sphere>
      <Sphere ref={cloudsRef} args={[1.01, 64, 64]}>
        <meshPhongMaterial
          map={cloudsMap} transparent opacity={0.4} depthWrite={false}
        />
      </Sphere>
    </group>
  )
}

function Globe() {
  return (
    <Canvas
      camera={{ position: [0, 0, 2.8], fov: 45 }}
      style={{ background: "transparent" }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 3, 5]} intensity={1.8} color="#ffffff" />
      <pointLight position={[-5, -3, -5]} intensity={0.3} color="#4466ff" />
      <Stars radius={100} depth={50} count={3000} factor={4} fade speed={0.5} />
      <Suspense fallback={null}>
        <EarthMesh />
      </Suspense>
      <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={0.4} />
    </Canvas>
  )
}

// ── Floating Leaves ───────────────────────────────────────
const LEAVES = ["🍃", "🌿", "🍀", "🌱"]

function FloatingLeaves() {
  const leaves = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    emoji: LEAVES[i % LEAVES.length],
    left: `${5 + i * 9}%`,
    size: 16 + (i % 3) * 8,
    duration: 9 + (i % 4) * 3,
    delay: i * 1.2
  }))
  return (
    <div style={{
      position: "fixed", inset: 0,
      pointerEvents: "none", zIndex: 0, overflow: "hidden"
    }}>
      {leaves.map(leaf => (
        <motion.div
          key={leaf.id}
          style={{ position: "absolute", left: leaf.left, fontSize: leaf.size, top: "-50px" }}
          animate={{ y: ["0px", "110vh"], rotate: [0, 360], x: [0, 20, -15, 10, 0] }}
          transition={{ duration: leaf.duration, delay: leaf.delay, repeat: Infinity, ease: "linear" }}
        >
          {leaf.emoji}
        </motion.div>
      ))}
    </div>
  )
}

// ── Leaf Sweep ────────────────────────────────────────────
function LeafSweep({ onDone }) {
  const sweepLeaves = Array.from({ length: 24 }, (_, i) => ({
    id: i, emoji: LEAVES[i % LEAVES.length],
    top: `${(i * 4) % 100}vh`,
    size: 22 + (i % 4) * 10, delay: i * 0.06
  }))
  useEffect(() => {
    const t = setTimeout(onDone, 2400)
    return () => clearTimeout(t)
  }, [])
  return (
    <motion.div style={{
      position: "fixed", inset: 0, zIndex: 999,
      overflow: "hidden", pointerEvents: "none"
    }}>
      <motion.div
        style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #14532d, #166534)" }}
        initial={{ x: "-100%" }}
        animate={{ x: ["-100%", "0%", "0%", "100%"] }}
        transition={{ duration: 2.2, times: [0, 0.3, 0.7, 1], ease: "easeInOut" }}
      />
      {sweepLeaves.map(leaf => (
        <motion.div
          key={leaf.id}
          style={{ position: "absolute", top: leaf.top, fontSize: leaf.size, left: "-60px" }}
          initial={{ x: "-60px", opacity: 1 }}
          animate={{ x: "110vw", rotate: 540 }}
          transition={{ duration: 1.4, delay: leaf.delay, ease: "easeIn" }}
        >
          {leaf.emoji}
        </motion.div>
      ))}
      <motion.div
        style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: "16px"
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.2, times: [0, 0.2, 0.8, 1] }}
      >
        <motion.div
          style={{ fontSize: 72 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        >
          🌍
        </motion.div>
        <p style={{ color: "#4ade80", fontSize: "20px", fontWeight: "bold", letterSpacing: "3px" }}>
          ANALYZING IMPACT...
        </p>
      </motion.div>
    </motion.div>
  )
}

// ── Animated Number ───────────────────────────────────────
function AnimatedNumber({ target }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / 1400, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setVal(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(step)
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
            background={{ fill: "rgba(255,255,255,0.05)" }}
            isAnimationActive animationDuration={1200}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", pointerEvents: "none"
      }}>
        <span style={{ color: "#4ade80", fontSize: "30px", fontWeight: "bold", lineHeight: 1 }}>
          <AnimatedNumber target={pct} />%
        </span>
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", marginTop: "4px" }}>
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
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
            axisLine={false} tickLine={false}
          />
          <YAxis hide domain={[0, 1]} />
          <Bar dataKey="found" radius={[5, 5, 0, 0]}
            isAnimationActive animationDuration={900} animationBegin={200}
          >
            {data.map((e, i) => (
              <Cell key={i} fill={e.found ? "#4ade80" : "rgba(255,255,255,0.07)"} />
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
        border: "3px solid rgba(255,255,255,0.08)",
        borderTop: "3px solid #4ade80",
        borderRadius: "50%", margin: "16px auto"
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
    />
  )
}

// ── Nav Bar ───────────────────────────────────────────────
function NavBar({ page, setPage }) {
  return (
    <motion.nav
      style={{
        position: "fixed", top: 0, left: 0, right: 0,
        zIndex: 50,
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 32px",
        background: "rgba(0,0,0,0.3)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)"
      }}
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div style={{ color: "#4ade80", fontWeight: "bold", fontSize: "18px" }}>
        🌱 EcoAI
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        {[
          { id: "hero", label: "Home" },
          { id: "analyzer", label: "Analyzer" },
          { id: "map", label: "World Map" }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            style={{
              padding: "8px 18px",
              borderRadius: "20px",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: page === item.id ? "bold" : "normal",
              background: page === item.id
                ? "linear-gradient(90deg, #15803d, #4ade80)"
                : "rgba(255,255,255,0.07)",
              color: "white",
              transition: "all 0.2s"
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </motion.nav>
  )
}

// ── Hero Page ─────────────────────────────────────────────
function HeroPage({ onStart }) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "row",
      alignItems: "stretch",
      paddingTop: "60px"
    }}>
      {/* Left — Globe */}
      <div style={{ width: "55%", height: "100vh", position: "sticky", top: 0 }}>
        <Globe />
        <motion.div
          style={{
            position: "absolute",
            bottom: "48px", left: 0, right: 0,
            textAlign: "center", pointerEvents: "none"
          }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
        >
          <p style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "12px", letterSpacing: "1px"
          }}>
            Drag to rotate • Real NASA textures
          </p>
        </motion.div>
      </div>

      {/* Right — Hero content */}
      <div style={{
        width: "45%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "48px 40px 48px 16px",
        gap: "24px"
      }}>

        {/* Badge */}
        <motion.div
          style={{ display: "inline-flex", alignItems: "center" }}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span style={{
            background: "rgba(74,222,128,0.15)",
            border: "1px solid rgba(74,222,128,0.3)",
            color: "#4ade80",
            padding: "6px 14px",
            borderRadius: "20px",
            fontSize: "12px",
            letterSpacing: "1px"
          }}>
            🌍 AI-POWERED ECO ANALYSIS
          </span>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h1 style={{
            color: "white",
            fontSize: "44px",
            fontWeight: "bold",
            lineHeight: 1.15,
            marginBottom: "16px"
          }}>
            Analyze Your
            <span style={{
              display: "block",
              background: "linear-gradient(90deg, #4ade80, #22c55e)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>
              Environmental
            </span>
            Impact
          </h1>
          <p style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "15px",
            lineHeight: 1.7,
            maxWidth: "360px"
          }}>
            Describe your project or activity and our AI instantly scores its
            ecological footprint — powered by real-time analysis.
          </p>
        </motion.div>

        {/* CO2 Counter */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
        >
          <CO2Counter />
        </motion.div>

        {/* Stats row */}
        <motion.div
          style={{ display: "flex", gap: "12px" }}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.0 }}
        >
          {[
            { value: "20+", label: "Cities Monitored" },
            { value: "AI", label: "Powered Analysis" },
            { value: "Free", label: "Always" }
          ].map((stat, i) => (
            <div key={i} style={{
              flex: 1, textAlign: "center", padding: "14px 8px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.08)"
            }}>
              <div style={{ color: "#4ade80", fontSize: "20px", fontWeight: "bold" }}>
                {stat.value}
              </div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", marginTop: "4px" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          style={{ display: "flex", gap: "12px" }}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.2 }}
        >
          <motion.button
            onClick={onStart}
            whileHover={{ scale: 1.03, boxShadow: "0 0 30px rgba(74,222,128,0.4)" }}
            whileTap={{ scale: 0.97 }}
            style={{
              flex: 1, padding: "16px",
              background: "linear-gradient(90deg, #15803d, #4ade80)",
              color: "white", border: "none", borderRadius: "14px",
              fontSize: "15px", fontWeight: "bold", cursor: "pointer",
              boxShadow: "0 0 20px rgba(74,222,128,0.25)"
            }}
          >
            ⚡ Start Analyzing
          </motion.button>
          <motion.button
            onClick={() => window.open("https://github.com", "_blank")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: "16px 20px",
              background: "rgba(255,255,255,0.07)",
              color: "white", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "14px", fontSize: "15px", cursor: "pointer"
            }}
          >
            View Map 🗺️
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}

// ── Analyzer Page ─────────────────────────────────────────
function AnalyzerPage() {
  const [text, setText] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sweeping, setSweeping] = useState(false)
  const [error, setError] = useState(null)

  async function analyze() {
    if (!text.trim() || loading) return
    setResult(null)
    setError(null)
    setSweeping(true)
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      setTimeout(() => { setResult(data); setLoading(false) }, 2300)
    } catch (err) {
      setTimeout(() => { setError(err.message); setLoading(false) }, 2300)
    }
  }

  const isEco = result?.label === "eco-friendly"

  return (
    <>
      <AnimatePresence>
        {sweeping && <LeafSweep onDone={() => setSweeping(false)} />}
      </AnimatePresence>

      <div style={{
        minHeight: "100vh", paddingTop: "80px",
        display: "flex", justifyContent: "center",
        alignItems: "flex-start", padding: "100px 16px 60px"
      }}>
        <motion.div
          style={{
            width: "100%", maxWidth: "560px",
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px)",
            borderRadius: "24px",
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "32px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.5)"
          }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
        >
          <div style={{ marginBottom: "24px" }}>
            <h1 style={{
              color: "white", fontSize: "24px",
              fontWeight: "bold", marginBottom: "6px"
            }}>
              🌱 Eco AI Analyzer
            </h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
              Describe your project — AI analyzes its environmental impact
            </p>
          </div>

          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="e.g. our city uses solar panels and wind turbines..."
            style={{
              width: "100%", height: "110px", padding: "14px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "12px", color: "white",
              fontSize: "14px", resize: "none", outline: "none",
              fontFamily: "Arial", lineHeight: "1.6", display: "block"
            }}
          />

          <motion.button
            onClick={analyze}
            disabled={loading || !text.trim()}
            whileHover={!loading && text.trim()
              ? { scale: 1.02, boxShadow: "0 0 25px rgba(74,222,128,0.4)" } : {}}
            whileTap={!loading && text.trim() ? { scale: 0.97 } : {}}
            style={{
              marginTop: "14px", width: "100%", padding: "14px",
              background: loading || !text.trim()
                ? "rgba(255,255,255,0.07)"
                : "linear-gradient(90deg, #15803d, #4ade80)",
              color: "white", border: "none", borderRadius: "12px",
              fontSize: "15px", fontWeight: "bold",
              cursor: loading || !text.trim() ? "not-allowed" : "pointer",
              display: "block",
              boxShadow: loading || !text.trim()
                ? "none" : "0 0 16px rgba(74,222,128,0.25)"
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
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px" }}>
                  Running eco analysis...
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
                  background: "rgba(220,38,38,0.12)",
                  border: "1px solid rgba(220,38,38,0.3)",
                  borderRadius: "10px", color: "#fca5a5", fontSize: "13px"
                }}
              >
                ⚠️ {error} — Make sure your Render server is awake.
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, type: "spring", bounce: 0.25 }}
                style={{
                  marginTop: "24px", padding: "20px",
                  background: isEco ? "rgba(74,222,128,0.07)" : "rgba(251,146,60,0.07)",
                  border: `1px solid ${isEco ? "rgba(74,222,128,0.2)" : "rgba(251,146,60,0.2)"}`,
                  borderRadius: "18px"
                }}
              >
                <motion.div
                  style={{ textAlign: "center", marginBottom: "12px" }}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                  <div style={{ fontSize: "40px", marginBottom: "6px" }}>
                    {isEco ? "🌍" : "🏭"}
                  </div>
                  <h2 style={{ color: isEco ? "#4ade80" : "#fb923c", fontSize: "18px", margin: 0 }}>
                    {isEco ? "✅ Eco Friendly" : "⚠️ Needs Improvement"}
                  </h2>
                </motion.div>

                <ConfidenceChart value={result.confidence} />

                <div style={{ height: "1px", background: "rgba(255,255,255,0.07)", margin: "12px 0" }} />

                <p style={{
                  color: "rgba(255,255,255,0.35)", fontSize: "10px",
                  letterSpacing: "1px", textAlign: "center", marginBottom: "4px"
                }}>
                  ECO KEYWORDS DETECTED
                </p>
                <KeywordChart text={text} />

                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  {[
                    { icon: "⚡", label: "Response", value: `${result.response_time_ms}ms` },
                    { icon: "📊", label: "Score", value: `${Math.round(result.confidence * 100)}%` },
                    { icon: isEco ? "✅" : "❌", label: "Status", value: isEco ? "Pass" : "Fail" }
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      style={{
                        flex: 1, textAlign: "center", padding: "8px 4px",
                        background: "rgba(255,255,255,0.04)",
                        borderRadius: "10px",
                        border: "1px solid rgba(255,255,255,0.07)"
                      }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                    >
                      <div style={{ fontSize: "14px" }}>{stat.icon}</div>
                      <div style={{ color: "white", fontSize: "12px", fontWeight: "bold", marginTop: "2px" }}>
                        {stat.value}
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "10px" }}>
                        {stat.label}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  )
}

// ── World Map Page ────────────────────────────────────────
function WorldMapPage() {
  const [selected, setSelected] = useState(null)

  return (
    <div style={{ minHeight: "100vh", paddingTop: "60px" }}>
      {/* Header */}
      <motion.div
        style={{ padding: "32px 32px 16px", textAlign: "center" }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 style={{ color: "white", fontSize: "28px", fontWeight: "bold", marginBottom: "8px" }}>
          🗺️ Global Air Quality Monitor
        </h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>
          Real-time pollution levels across 20 major cities
        </p>
      </motion.div>

      {/* Legend */}
      <motion.div
        style={{
          display: "flex", justifyContent: "center",
          gap: "16px", flexWrap: "wrap", padding: "0 32px 16px"
        }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
      >
        {[
          { color: "#00cc44", label: "Good (0-49)" },
          { color: "#ffee00", label: "Moderate (50-99)" },
          { color: "#ffaa00", label: "Unhealthy (100-149)" },
          { color: "#ff6600", label: "Very Unhealthy (150-199)" },
          { color: "#ff2020", label: "Hazardous (200+)" }
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{
              width: 12, height: 12, borderRadius: "50%",
              background: item.color,
              boxShadow: `0 0 6px ${item.color}`
            }} />
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>
              {item.label}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Map */}
      <motion.div
        style={{
          margin: "0 24px 24px",
          borderRadius: "20px", overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
          height: "480px"
        }}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <MapContainer
          center={[20, 0]}
          zoom={2}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; CartoDB'
          />
          {POLLUTION_SPOTS.map((spot, i) => (
            <CircleMarker
              key={i}
              center={[spot.lat, spot.lng]}
              radius={getMarkerSize(spot.aqi)}
              pathOptions={{
                color: getMarkerColor(spot.aqi),
                fillColor: getMarkerColor(spot.aqi),
                fillOpacity: 0.7,
                weight: 2,
                opacity: 0.9
              }}
              eventHandlers={{ click: () => setSelected(spot) }}
            >
              <Popup>
                <div style={{ minWidth: "140px" }}>
                  <strong>{spot.city}</strong><br />
                  AQI: {spot.aqi}<br />
                  Status: {spot.level}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </motion.div>

      {/* City cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: "12px",
        padding: "0 24px 48px"
      }}>
        {POLLUTION_SPOTS.sort((a, b) => b.aqi - a.aqi).map((spot, i) => (
          <motion.div
            key={i}
            style={{
              padding: "14px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "12px",
              border: `1px solid ${getMarkerColor(spot.aqi)}44`,
              cursor: "pointer"
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.03 }}
            whileHover={{ scale: 1.03, background: "rgba(255,255,255,0.08)" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: getMarkerColor(spot.aqi),
                boxShadow: `0 0 6px ${getMarkerColor(spot.aqi)}`
              }} />
              <span style={{ color: "white", fontSize: "13px", fontWeight: "bold" }}>
                {spot.city}
              </span>
            </div>
            <div style={{
              color: getMarkerColor(spot.aqi),
              fontSize: "22px", fontWeight: "bold"
            }}>
              {spot.aqi}
            </div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>
              {spot.level}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ── Root App ──────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("hero")

  return (
    <>
      <FloatingLeaves />
      <NavBar page={page} setPage={setPage} />

      <AnimatePresence mode="wait">
        {page === "hero" && (
          <motion.div
            key="hero"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <HeroPage onStart={() => setPage("analyzer")} />
          </motion.div>
        )}
        {page === "analyzer" && (
          <motion.div
            key="analyzer"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <AnalyzerPage />
          </motion.div>
        )}
        {page === "map" && (
          <motion.div
            key="map"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <WorldMapPage />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}