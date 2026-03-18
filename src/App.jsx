import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Cell
} from "recharts"
import "./App.css"

const API_URL = "https://hackathon-practice-w99t.onrender.com"

// ── Floating Leaves Background ────────────────────────────
const LEAVES = ["🍃", "🌿", "🍀", "🌱"]

function FloatingLeaves() {
  const leaves = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    emoji: LEAVES[i % LEAVES.length],
    left: `${5 + (i * 8)}%`,
    size: 18 + (i % 3) * 8,
    duration: 8 + (i % 4) * 3,
    delay: (i % 6) * 1.5
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
            rotate: [0, 180, 360],
            x: [0, 20, -15, 10, 0]
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
  const sweepLeaves = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    emoji: LEAVES[i % LEAVES.length],
    top: `${(i * 4) % 100}vh`,
    size: 22 + (i % 4) * 10,
    delay: (i % 8) * 0.08
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
      {/* Green wave */}
      <motion.div
        style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, #14532d, #166534)"
        }}
        initial={{ x: "-100%" }}
        animate={{ x: ["-100%", "0%", "0%", "100%"] }}
        transition={{
          duration: 2.2,
          times: [0, 0.3, 0.7, 1],
          ease: "easeInOut"
        }}
      />

      {/* Flying leaves */}
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
          transition={{
            duration: 1.4,
            delay: leaf.delay,
            ease: "easeIn"
          }}
        >
          {leaf.emoji}
        </motion.div>
      ))}

      {/* Center content */}
      <motion.div
        style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: "16px"
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
          color: "#4ade80",
          fontSize: "20px",
          fontWeight: "bold",
          letterSpacing: "3px"
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

    const step = (timestamp) => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
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
  const data = [{ value: pct }]

  return (
    <div style={{ position: "relative", width: "100%", height: "180px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="65%"
          outerRadius="95%"
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar
            dataKey="value"
            cornerRadius={8}
            fill="#4ade80"
            background={{ fill: "rgba(255,255,255,0.05)" }}
            isAnimationActive
            animationDuration={1200}
          />
        </RadialBarChart>
      </ResponsiveContainer>

      {/* Centered text overlay */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none"
      }}>
        <span style={{
          color: "#4ade80",
          fontSize: "32px",
          fontWeight: "bold",
          lineHeight: 1
        }}>
          <AnimatedNumber target={pct} />%
        </span>
        <span style={{
          color: "rgba(255,255,255,0.5)",
          fontSize: "12px",
          marginTop: "4px"
        }}>
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
    <div style={{ width: "100%", height: "130px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
        >
          <XAxis
            dataKey="keyword"
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide domain={[0, 1]} />
          <Bar
            dataKey="found"
            radius={[5, 5, 0, 0]}
            isAnimationActive
            animationDuration={900}
            animationBegin={200}
          >
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.found
                  ? "#4ade80"
                  : "rgba(255,255,255,0.07)"}
              />
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
        width: 40, height: 40,
        border: "3px solid rgba(255,255,255,0.08)",
        borderTop: "3px solid #4ade80",
        borderRadius: "50%",
        margin: "20px auto"
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
      setTimeout(() => {
        setResult(data)
        setLoading(false)
      }, 2300)
    } catch (err) {
      setTimeout(() => {
        setError(err.message)
        setLoading(false)
      }, 2300)
    }
  }

  const isEco = result?.label === "eco-friendly"

  return (
    <>
      {/* Background leaves — always visible */}
      <FloatingLeaves />

      {/* Leaf sweep on analyze */}
      <AnimatePresence>
        {sweeping && (
          <LeafSweep onDone={() => setSweeping(false)} />
        )}
      </AnimatePresence>

      {/* Page content */}
      <div style={{
        position: "relative",
        zIndex: 1,
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "40px 16px 60px"
      }}>
        <motion.div
          style={{
            width: "100%",
            maxWidth: "560px",
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px)",
            borderRadius: "24px",
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "32px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.5)"
          }}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, type: "spring", bounce: 0.3 }}
        >

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <motion.div
              style={{ fontSize: "52px", marginBottom: "12px" }}
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              🌍
            </motion.div>
            <h1 style={{
              color: "white",
              fontSize: "26px",
              fontWeight: "bold",
              marginBottom: "6px",
              textShadow: "0 0 20px rgba(74,222,128,0.3)"
            }}>
              🌱 Eco AI Analyzer
            </h1>
            <p style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "13px"
            }}>
              Describe your project — AI analyzes its environmental impact
            </p>
          </div>

          {/* Textarea */}
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="e.g. our city uses solar panels and wind turbines to power all public buildings..."
            style={{
              width: "100%",
              height: "110px",
              padding: "14px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "12px",
              color: "white",
              fontSize: "14px",
              resize: "none",
              outline: "none",
              fontFamily: "Arial",
              lineHeight: "1.6",
              display: "block"
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
              marginTop: "14px",
              width: "100%",
              padding: "14px",
              background: loading || !text.trim()
                ? "rgba(255,255,255,0.07)"
                : "linear-gradient(90deg, #15803d, #4ade80)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "15px",
              fontWeight: "bold",
              cursor: loading || !text.trim() ? "not-allowed" : "pointer",
              display: "block",
              boxShadow: loading || !text.trim()
                ? "none"
                : "0 0 16px rgba(74,222,128,0.25)"
            }}
          >
            {loading ? "🌿 Analyzing..." : "⚡ Analyze Impact"}
          </motion.button>

          {/* Spinner */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ textAlign: "center" }}
              >
                <Spinner />
                <p style={{
                  color: "rgba(255,255,255,0.35)",
                  fontSize: "13px"
                }}>
                  Running eco analysis...
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  marginTop: "14px",
                  padding: "14px",
                  background: "rgba(220,38,38,0.12)",
                  border: "1px solid rgba(220,38,38,0.3)",
                  borderRadius: "10px",
                  color: "#fca5a5",
                  fontSize: "13px"
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
                  marginTop: "24px",
                  padding: "24px",
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
                  style={{ textAlign: "center", marginBottom: "16px" }}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                  <div style={{ fontSize: "44px", marginBottom: "8px" }}>
                    {isEco ? "🌍" : "🏭"}
                  </div>
                  <h2 style={{
                    color: isEco ? "#4ade80" : "#fb923c",
                    fontSize: "20px",
                    margin: 0
                  }}>
                    {isEco ? "✅ Eco Friendly" : "⚠️ Needs Improvement"}
                  </h2>
                </motion.div>

                {/* Confidence chart */}
                <ConfidenceChart value={result.confidence} />

                {/* Divider */}
                <div style={{
                  height: "1px",
                  background: "rgba(255,255,255,0.07)",
                  margin: "16px 0"
                }} />

                {/* Keyword chart */}
                <p style={{
                  color: "rgba(255,255,255,0.35)",
                  fontSize: "11px",
                  letterSpacing: "1px",
                  textAlign: "center",
                  marginBottom: "6px"
                }}>
                  ECO KEYWORDS DETECTED
                </p>
                <KeywordChart text={text} />

                {/* Stats */}
                <div style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "16px"
                }}>
                  {[
                    { icon: "⚡", label: "Response", value: `${result.response_time_ms}ms` },
                    { icon: "📊", label: "Score", value: `${Math.round(result.confidence * 100)}%` },
                    { icon: isEco ? "✅" : "❌", label: "Status", value: isEco ? "Pass" : "Fail" }
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      style={{
                        flex: 1,
                        textAlign: "center",
                        padding: "10px 6px",
                        background: "rgba(255,255,255,0.04)",
                        borderRadius: "10px",
                        border: "1px solid rgba(255,255,255,0.07)"
                      }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                    >
                      <div style={{ fontSize: "16px" }}>{stat.icon}</div>
                      <div style={{
                        color: "white",
                        fontSize: "13px",
                        fontWeight: "bold",
                        marginTop: "4px"
                      }}>
                        {stat.value}
                      </div>
                      <div style={{
                        color: "rgba(255,255,255,0.35)",
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
        </motion.div>
      </div>
    </>
  )
}