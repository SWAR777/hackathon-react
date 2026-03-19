import { useState, useEffect, useRef, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Canvas, useFrame } from "@react-three/fiber"
import { Sphere, useTexture, Stars, OrbitControls } from "@react-three/drei"
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Cell
} from "recharts"
import * as THREE from "three"
import "./App.css"

const API_URL = "https://hackathon-practice-w99t.onrender.com"

// ── Earth Globe ───────────────────────────────────────────
function EarthMesh() {
  const earthRef = useRef()
  const cloudsRef = useRef()
  const glowRef = useRef()

  // Real NASA texture maps
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
      {/* Atmosphere glow */}
      <Sphere args={[1.08, 64, 64]}>
        <meshPhongMaterial
          color="#4488ff"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Earth surface */}
      <Sphere ref={earthRef} args={[1, 64, 64]}>
        <meshPhongMaterial
          map={colorMap}
          normalMap={normalMap}
          specularMap={specularMap}
          specular={new THREE.Color(0x333333)}
          shininess={15}
        />
      </Sphere>

      {/* Cloud layer */}
      <Sphere ref={cloudsRef} args={[1.01, 64, 64]}>
        <meshPhongMaterial
          map={cloudsMap}
          transparent
          opacity={0.4}
          depthWrite={false}
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
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[5, 3, 5]}
        intensity={1.8}
        color="#ffffff"
      />
      <pointLight position={[-5, -3, -5]} intensity={0.3} color="#4466ff" />

      {/* Stars background */}
      <Stars
        radius={100}
        depth={50}
        count={3000}
        factor={4}
        fade
        speed={0.5}
      />

      {/* Earth */}
      <Suspense fallback={null}>
        <EarthMesh />
      </Suspense>

      {/* Allow mouse drag to rotate */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={false}
        rotateSpeed={0.4}
      />
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
      pointerEvents: "none", zIndex: 0,
      overflow: "hidden"
    }}>
      {leaves.map(leaf => (
        <motion.div
          key={leaf.id}
          style={{
            position: "absolute",
            left: leaf.left,
            fontSize: leaf.size,
            top: "-50px"
          }}
          animate={{
            y: ["0px", "110vh"],
            rotate: [0, 360],
            x: [0, 20, -15, 10, 0]
          }}
          transition={{
            duration: leaf.duration,
            delay: leaf.delay,
            repeat: Infinity,
            ease: "linear"
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
  const sweepLeaves = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    emoji: LEAVES[i % LEAVES.length],
    top: `${(i * 4) % 100}vh`,
    size: 22 + (i % 4) * 10,
    delay: i * 0.06
  }))

  useEffect(() => {
    const t = setTimeout(onDone, 2400)
    return () => clearTimeout(t)
  }, [])

  return (
    <motion.div style={{
      position: "fixed", inset: 0,
      zIndex: 999, overflow: "hidden",
      pointerEvents: "none"
    }}>
      <motion.div
        style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, #14532d, #166534)"
        }}
        initial={{ x: "-100%" }}
        animate={{ x: ["-100%", "0%", "0%", "100%"] }}
        transition={{ duration: 2.2, times: [0, 0.3, 0.7, 1], ease: "easeInOut" }}
      />
      {sweepLeaves.map(leaf => (
        <motion.div
          key={leaf.id}
          style={{
            position: "absolute",
            top: leaf.top,
            fontSize: leaf.size,
            left: "-60px"
          }}
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
        <p style={{
          color: "#4ade80", fontSize: "20px",
          fontWeight: "bold", letterSpacing: "3px"
        }}>
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
    const duration = 1400
    const step = (ts) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
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
          data={[{ value: pct }]}
          startAngle={90} endAngle={-270}
        >
          <RadialBar
            dataKey="value" cornerRadius={8} fill="#4ade80"
            background={{ fill: "rgba(255,255,255,0.05)" }}
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
    keyword: k,
    found: text.toLowerCase().includes(k) ? 1 : 0
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

// ── Main App ──────────────────────────────────────────────
export default function App() {
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
      <FloatingLeaves />

      <AnimatePresence>
        {sweeping && <LeafSweep onDone={() => setSweeping(false)} />}
      </AnimatePresence>

      {/* Full page two-column layout */}
      <div style={{
        position: "relative",
        zIndex: 1,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch"
      }}>

        {/* LEFT — 3D Globe */}
        <div style={{
          width: "50%",
          minHeight: "100vh",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }}>
          {/* Globe fills the entire left side */}
          <div style={{
            width: "100%",
            height: "100vh",
            position: "sticky",
            top: 0
          }}>
            <Globe />
          </div>

          {/* Text overlay on top of globe */}
          <motion.div
            style={{
              position: "absolute",
              bottom: "60px",
              left: 0, right: 0,
              textAlign: "center",
              padding: "0 24px",
              pointerEvents: "none"
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            <h2 style={{
              color: "white",
              fontSize: "22px",
              fontWeight: "bold",
              textShadow: "0 2px 20px rgba(0,0,0,0.8)",
              marginBottom: "8px"
            }}>
              Our Planet Needs You
            </h2>
            <p style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "13px",
              textShadow: "0 1px 8px rgba(0,0,0,0.8)"
            }}>
              Drag to explore • AI-powered eco analysis
            </p>
          </motion.div>
        </div>

        {/* RIGHT — Analysis Panel */}
        <div style={{
          width: "50%",
          minHeight: "100vh",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "48px 32px 60px",
          overflowY: "auto"
        }}>
          <motion.div
            style={{
              width: "100%",
              maxWidth: "480px",
              background: "rgba(255,255,255,0.06)",
              backdropFilter: "blur(20px)",
              borderRadius: "24px",
              border: "1px solid rgba(255,255,255,0.1)",
              padding: "32px",
              boxShadow: "0 8px 40px rgba(0,0,0,0.5)"
            }}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
          >
            {/* Header */}
            <div style={{ marginBottom: "24px" }}>
              <h1 style={{
                color: "white", fontSize: "24px",
                fontWeight: "bold", marginBottom: "6px",
                textShadow: "0 0 20px rgba(74,222,128,0.3)"
              }}>
                🌱 Eco AI Analyzer
              </h1>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
                Describe your project — AI analyzes its environmental impact
              </p>
            </div>

            {/* Textarea */}
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="e.g. our city uses solar panels and wind turbines to power all public buildings..."
              style={{
                width: "100%", height: "110px", padding: "14px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "12px", color: "white",
                fontSize: "14px", resize: "none", outline: "none",
                fontFamily: "Arial", lineHeight: "1.6", display: "block"
              }}
            />

            {/* Button */}
            <motion.button
              onClick={analyze}
              disabled={loading || !text.trim()}
              whileHover={!loading && text.trim()
                ? { scale: 1.02, boxShadow: "0 0 25px rgba(74,222,128,0.4)" }
                : {}}
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

            {/* Spinner */}
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

            {/* Error */}
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

            {/* Result */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, type: "spring", bounce: 0.25 }}
                  style={{
                    marginTop: "24px", padding: "20px",
                    background: isEco
                      ? "rgba(74,222,128,0.07)"
                      : "rgba(251,146,60,0.07)",
                    border: `1px solid ${isEco
                      ? "rgba(74,222,128,0.2)"
                      : "rgba(251,146,60,0.2)"}`,
                    borderRadius: "18px"
                  }}
                >
                  {/* Label */}
                  <motion.div
                    style={{ textAlign: "center", marginBottom: "12px" }}
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                  >
                    <div style={{ fontSize: "40px", marginBottom: "6px" }}>
                      {isEco ? "🌍" : "🏭"}
                    </div>
                    <h2 style={{
                      color: isEco ? "#4ade80" : "#fb923c",
                      fontSize: "18px", margin: 0
                    }}>
                      {isEco ? "✅ Eco Friendly" : "⚠️ Needs Improvement"}
                    </h2>
                  </motion.div>

                  <ConfidenceChart value={result.confidence} />

                  <div style={{
                    height: "1px",
                    background: "rgba(255,255,255,0.07)",
                    margin: "12px 0"
                  }} />

                  <p style={{
                    color: "rgba(255,255,255,0.35)", fontSize: "10px",
                    letterSpacing: "1px", textAlign: "center", marginBottom: "4px"
                  }}>
                    ECO KEYWORDS DETECTED
                  </p>
                  <KeywordChart text={text} />

                  {/* Stats */}
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
      </div>
    </>
  )
}