import Link from "next/link";

const STATS = [
  { value: "2,200+", label: "Συναλλαγές στο dataset" },
  { value: "12.3%", label: "Μέσο σφάλμα εκτίμησης (MAPE)" },
  { value: "5", label: "Επαρχίες Κύπρου" },
  { value: "< 2s", label: "Χρόνος εκτίμησης" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Συμπλήρωσε τα στοιχεία",
    desc: "Περιοχή, τετραγωνικά, υπνοδωμάτια, χαρακτηριστικά. Γρήγορα — δεν χρειάζεσαι email ή εγγραφή.",
  },
  {
    step: "02",
    title: "Το μοντέλο αναλύει",
    desc: "Το XGBoost model αναλύει 22+ παράγοντες και συγκρίνει με παρόμοιες πωλήσεις στην ίδια περιοχή.",
  },
  {
    step: "03",
    title: "Παίρνεις τη σωστή εκτίμηση",
    desc: "Εκτιμώμενη αξία με εύρος τιμών, τιμή/τμ, ανάλυση παραγόντων και σύγκριση με αγορά.",
  },
];

const FEATURES = [
  {
    icon: "📊",
    title: "Πραγματικά δεδομένα",
    desc: "Βασισμένο σε πραγμα­τικές συναλλαγές, όχι σε τιμές αγγελιών που μπορεί να απέχουν 20-40% από την πραγματικότητα.",
  },
  {
    icon: "🔑",
    title: "Τίτλος ιδιοκτησίας",
    desc: "Το μόνο AVM που λαμβάνει υπόψη το μοναδικό κυπριακό πρόβλημα τίτλων — διαφορά ±18% στην αξία.",
  },
  {
    icon: "🏖",
    title: "Θέα θάλασσα",
    desc: "Ποσοτικοποιεί το premium της θαλάσσιας θέας που είναι κρίσιμος παράγοντας για αγοραστές.",
  },
  {
    icon: "⚡",
    title: "Άμεση απάντηση",
    desc: "Σε λιγότερο από 2 δευτερόλεπτα. Όχι 48 ώρες αναμονή για εκτιμητή.",
  },
  {
    icon: "💡",
    title: "Εξήγηση παραγόντων",
    desc: "Δεν δίνει μόνο αριθμό — εξηγεί ποιοι παράγοντες ανεβάζουν ή κατεβάζουν την αξία.",
  },
  {
    icon: "🎯",
    title: "Confidence interval",
    desc: "Εύρος εκτίμησης με επίπεδο εμπιστοσύνης για κάθε περιοχή — διαφάνεια στα αποτελέσματα.",
  },
];

const DEMO_OUTPUT = {
  property: "Διαμέρισμα · Αγία Ζώνη, Λεμεσός · 85τμ · 2υδ · 3ος",
  estimate: 197_000,
  range_low: 173_000,
  range_high: 221_000,
  price_per_sqm: 2318,
  area_median: 2180,
  diff_pct: "+6.3%",
  comparables: 34,
  confidence: 85,
  positives: ["Θέα θάλασσα (+€19,200 κατά μέσο)", "Σχετικά νέο κτίριο (2015)"],
  negatives: ["Κοντά σε κεντρικό δρόμο (−€3,800)"],
};

export default function HomePage() {
  return (
    <div>
      {/* ===== HERO ===== */}
      <section
        style={{
          position: "relative",
          minHeight: "calc(100vh - 64px)",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          background: "var(--gradient-hero)",
        }}
      >
        <div className="hero-bg" />

        {/* Glow orbs */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            right: "10%",
            width: 600,
            height: 600,
            background: "radial-gradient(circle, rgba(45,212,191,0.07) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "15%",
            left: "5%",
            width: 400,
            height: 400,
            background: "radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div className="container" style={{ position: "relative", zIndex: 1, paddingTop: 80, paddingBottom: 80 }}>
          <div style={{ maxWidth: 700 }}>
            <div className="badge badge-accent" style={{ marginBottom: 24 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
              Πρώτο AVM για την Κύπρο
            </div>

            <h1
              style={{
                fontSize: "clamp(36px, 5vw, 60px)",
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                marginBottom: 24,
              }}
            >
              Μάθε πόσο αξίζει{" "}
              <span className="text-gradient">το ακίνητό σου</span>{" "}
              στην Κύπρο — σε 2 δευτερόλεπτα
            </h1>

            <p
              style={{
                fontSize: "clamp(16px, 2vw, 19px)",
                color: "var(--text-secondary)",
                lineHeight: 1.7,
                marginBottom: 40,
                maxWidth: 560,
              }}
            >
              Επαγγελματική εκτίμηση βασισμένη σε πραγματικές πωλήσεις, 22+ παράγοντες,
              και το μοναδικό σύστημα που κατανοεί την κυπριακή αγορά.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/estimate" id="hero-cta-primary" className="btn btn-primary btn-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                Δωρεάν Εκτίμηση
              </Link>
              <Link href="/market" id="hero-cta-secondary" className="btn btn-secondary btn-lg">
                Στατιστικά Αγοράς
              </Link>
            </div>

            {/* Trust indicators */}
            <p style={{ marginTop: 24, fontSize: 13, color: "var(--text-muted)" }}>
              Χωρίς εγγραφή · Χωρίς κόστος · Αποτέλεσμα σε &lt;2 δευτερόλεπτα
            </p>
          </div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 0,
              padding: "32px 0",
            }}
          >
            {STATS.map((s, i) => (
              <div
                key={s.label}
                style={{
                  textAlign: "center",
                  padding: "16px",
                  borderLeft: i > 0 ? "1px solid var(--border)" : "none",
                }}
              >
                <div
                  className="stat-value text-gradient"
                  style={{ fontSize: "clamp(22px, 3vw, 32px)" }}
                >
                  {s.value}
                </div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== DEMO OUTPUT ===== */}
      <section className="section">
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 48,
              alignItems: "center",
            }}
          >
            {/* Left — explanation */}
            <div>
              <div className="badge badge-gold" style={{ marginBottom: 20 }}>
                Demo Output
              </div>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", marginBottom: 16 }}>
                Όχι απλώς έναν αριθμό —<br />
                <span className="text-gradient">ολόκληρη ανάλυση</span>
              </h2>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 24 }}>
                Κάθε εκτίμηση περιλαμβάνει εύρος τιμών, τιμή/τμ vs αγορά,
                ανάλυση παραγόντων, και αριθμό συγκριτικών πωλήσεων.
                Ακριβώς ό,τι δείχνει ένας επαγγελματίας εκτιμητής.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  "Πραγματική τιμή αγοράς, όχι τιμή αγγελίας",
                  "Εξηγεί ποιοι παράγοντες ανεβάζουν/κατεβάζουν",
                  "Λαμβάνει υπόψη τίτλο ιδιοκτησίας",
                  "Συγκρίνει με παρόμοιες πρόσφατες πωλήσεις",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ color: "var(--accent)", marginTop: 2, fontSize: 14 }}>✓</span>
                    <span style={{ color: "var(--text-secondary)", fontSize: 15 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — demo card */}
            <div className="card card-glow" style={{ padding: 28 }}>
              <div style={{ marginBottom: 8, fontSize: 12, color: "var(--text-muted)" }}>
                {DEMO_OUTPUT.property}
              </div>

              <div
                style={{
                  fontSize: "clamp(32px, 4vw, 44px)",
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                  marginBottom: 6,
                }}
                className="text-gradient"
              >
                €{DEMO_OUTPUT.estimate.toLocaleString("el-GR")}
              </div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>
                €{DEMO_OUTPUT.range_low.toLocaleString("el-GR")} —{" "}
                €{DEMO_OUTPUT.range_high.toLocaleString("el-GR")}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 20,
                  padding: "16px",
                  background: "var(--bg-glass)",
                  borderRadius: 10,
                }}
              >
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>Τιμή/τμ</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>
                    €{DEMO_OUTPUT.price_per_sqm.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>Μέση περιοχής</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>
                    €{DEMO_OUTPUT.area_median.toLocaleString()}
                    <span style={{ fontSize: 13, color: "var(--accent)", marginLeft: 6 }}>
                      {DEMO_OUTPUT.diff_pct}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Εμπιστοσύνη</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>
                    {DEMO_OUTPUT.confidence}%
                  </span>
                </div>
                <div className="confidence-bar">
                  <div
                    className="confidence-fill"
                    style={{ width: `${DEMO_OUTPUT.confidence}%` }}
                  />
                </div>
              </div>

              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
                Βασίστηκε σε{" "}
                <strong style={{ color: "var(--text-secondary)" }}>
                  {DEMO_OUTPUT.comparables}
                </strong>{" "}
                παρόμοιες αγοραπωλησίες
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {DEMO_OUTPUT.positives.map((f) => (
                  <div key={f} className="badge badge-success" style={{ width: "fit-content", fontSize: 12 }}>
                    ↑ {f}
                  </div>
                ))}
                {DEMO_OUTPUT.negatives.map((f) => (
                  <div key={f} className="badge badge-error" style={{ width: "fit-content", fontSize: 12 }}>
                    ↓ {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="section" style={{ background: "var(--bg-secondary)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", marginBottom: 12 }}>
              Πώς λειτουργεί
            </h2>
            <p style={{ color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto" }}>
              Τρία βήματα για επαγγελματική εκτίμηση σε δευτερόλεπτα
            </p>
          </div>

          <div className="grid-3">
            {HOW_IT_WORKS.map((item) => (
              <div
                key={item.step}
                className="card"
                style={{ padding: 28 }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    fontFamily: "'DM Mono', monospace",
                    color: "var(--accent)",
                    marginBottom: 14,
                    letterSpacing: "0.05em",
                  }}
                >
                  {item.step}
                </div>
                <h3 style={{ fontSize: 18, marginBottom: 10 }}>{item.title}</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", marginBottom: 12 }}>
              Γιατί είναι διαφορετικό
            </h2>
            <p style={{ color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto" }}>
              Σχεδιασμένο αποκλειστικά για τις ιδιαιτερότητες της κυπριακής αγοράς
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
            }}
          >
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="card"
                style={{ padding: 24 }}
              >
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontSize: 16, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.65 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="section" style={{ background: "var(--bg-secondary)" }}>
        <div className="container">
          <div
            className="card card-glow"
            style={{
              padding: "60px 48px",
              textAlign: "center",
              background: "linear-gradient(135deg, rgba(45,212,191,0.06) 0%, rgba(14,21,37,0.95) 100%)",
            }}
          >
            <h2 style={{ fontSize: "clamp(24px, 3vw, 40px)", marginBottom: 16, maxWidth: 600, margin: "0 auto 16px" }}>
              Μάθε την αξία του ακινήτου σου σήμερα
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: 36, maxWidth: 440, margin: "0 auto 36px" }}>
              Δωρεάν, χωρίς εγγραφή. Το αποτέλεσμα σε λιγότερο από 2 δευτερόλεπτα.
            </p>
            <Link href="/estimate" id="bottom-cta" className="btn btn-primary btn-lg">
              Ξεκίνα Τώρα — Δωρεάν
            </Link>

            <div style={{ marginTop: 24, display: "flex", gap: 32, justifyContent: "center", fontSize: 14, color: "var(--text-muted)" }}>
              <span>✓ Χωρίς email</span>
              <span>✓ Χωρίς πιστωτική</span>
              <span>✓ Αποτέλεσμα σε 2 δευτερόλεπτα</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "32px 0",
          textAlign: "center",
        }}
      >
        <div className="container">
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            © 2025 CyprusAVM · Automated Valuation Model για την κυπριακή αγορά ακινήτων ·{" "}
            <span style={{ color: "var(--accent)" }}>Beta</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
