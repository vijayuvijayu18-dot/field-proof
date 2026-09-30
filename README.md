# FIELD TEST VERIFICATION CONSOLE
### Digital Companion for Field Drug Testing
**Smart India Hackathon 2026 — Problem Statement ID: SIH26231**

> *"From subjective colour reading to verifiable digital records."*

---

## 1. Official Problem Context & Principles
Conventional field drug-testing kits rely on visual colorimetric reactions inside plastic test pouches or ampoules (e.g. Marquis, Scott, Mecke, Duquenois-Levine reagents).

### Critical Challenges in Field Operations:
1. **Subjective Visual Interpretation**: Ambient lighting conditions (e.g., streetlights, daylight, incandescent shadows) distort human perception of color shifts.
2. **Standardization Failure**: Different officers perceive and report borderline hues inconsistently.
3. **No Chain of Custody or Temporal Proof**: No tamper-evident digital record proves that a specific test was conducted at a specific place, time, or by a specific officer.
4. **Evidentiary Limitations**: Field test outcomes currently cannot be relied upon as verifiable documentary evidence.

### Statutory Boundary:
> **IMPORTANT FORENSIC NOTICE:** This application produces a **PRESUMPTIVE FIELD-TEST RESULT** and an integrity-protected digital audit record. It **DOES NOT** replace confirmatory laboratory testing (e.g., Gas Chromatography–Mass Spectrometry / GC-MS, FTIR). The cryptographic SHA-256 hash ensures **tamper-evident data integrity**, not chemical certification.

---

## 2. Core Architecture & Workflow

The platform operates through a 5-step operational pipeline:
```
CAPTURE ──► CALIBRATE ──► CLASSIFY ──► VERIFY ──► RECORD
```

1. **CAPTURE**: Live optical frame acquisition using mobile/device camera with HUD alignment guides for the test pouch and reference card.
2. **CALIBRATE**: Physical reference colour card detected in frame. White (100%), Mid-Gray (50%), Black (0%), and Primary patches are sampled to compute illuminant gain factors and eliminate ambient lighting bias.
3. **CLASSIFY**: Modular colorimetry engine measures reaction chromophore and calculates $\Delta E$ color distance against reagent standard spectra (Positive, Negative, or Inconclusive).
4. **VERIFY**: Real-time SHA-256 cryptographic digest generated over the raw optical image buffer.
5. **RECORD**: Tamper-evident field test dossier sealed with GPS coordinates, operator credentials, timestamp, calibration metrics, and cryptographic hash.

---

## 3. Signature Features

- **Reference Colour Card Engine**: Visually prominent optical calibration standard (`STD-CARD-V1`) with live patch sampling and automatic white-balance normalization.
- **Realistic Inconclusive Handling**: When the reference card is absent or lighting is degraded, the system issues an actionable **RECAPTURE REQUIRED** directive.
- **Live Cryptographic Integrity Validator**: Operators and supervisors can select any logged test or upload an arbitrary image to recompute its SHA-256 digest live and verify byte-for-byte fidelity.
- **Evidence Dossier & Field Receipt**: Printable forensic evidence receipts and JSON audit packages with full sequential process timelines.
- **Independent Python CLI Verifier**: `verify_integrity.py` provides standalone SHA-256 verification from terminal environments.

---

## 4. Running the Application

### Web Application
```bash
# Navigate to project directory
cd C:\Users\vijay\.gemini\antigravity\scratch\field-test-console

# Install dependencies (if not already installed)
npm install

# Start Vite development server
npm run dev -- --host 127.0.0.1 --port 5173
```
Open your browser at: **`http://127.0.0.1:5173/`**

### Standalone Python Integrity Verifier
```bash
python verify_integrity.py <path_to_evidence_package.json>
```

---

## 5. Technology Stack
- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, custom technical HUD overlays
- **Icons**: Lucide Icons
- **Colorimetry & Image Analysis**: HTML5 Canvas Pixel Buffer Processing, Delta-E Color Distance
- **Cryptographic Security**: Standard W3C Web Crypto API (`crypto.subtle.digest('SHA-256')`)
- **Geolocation**: W3C Geolocation API with accuracy indicators
- **Verification CLI**: Python 3 standard library (`hashlib`, `base64`, `json`)
