# ATC Aviation (Air Traffic Control Simulator)

An interactive, high-fidelity web-based **Air Traffic Control (ATC) Radar Simulator** built with **React**, **HTML5 Canvas (2D Context)**, **TailwindCSS**, **Zustand**, and the **Web Speech API** (SpeechRecognition & SpeechSynthesis).

---

## 🛫 Features Overview

1. **Split UI Layout (70% Radar / 30% Control Terminal)**:
   - **70% Viewport Canvas**: Circular radar scope, range rings (5, 10, 15, 20 NM), rotating radar sweep beam (24 RPM), Center Runway 09/27 with extended glideslope approach funnel, historical phosphor trails, and tactical data blocks.
   - **30% Viewport Sidebar**: Active Flight Strips cards, system telemetry (Survival time, Landed flights, Score, Mic status), Tactical vectoring panel, and real-time VHF Comms Log terminal with push-to-talk.

2. **Primary Control: Draw Path Mechanism**:
   - **Click & Drag**: Click on any cruising aircraft on the radar screen and drag to draw a custom vector flight path.
   - **Smooth Waypoint Navigation**: The aircraft automatically calculates heading bearings, adheres to realistic turn rates (~3.0°/frame via shortest arc), and follows waypoints sequentially.
   - **Active Visualization**: Glowing path line, waypoint diamond markers ($W1, W2\dots$), and path cancellation controls.

3. **Secondary Control: Voice Commands (Web Speech API)**:
   - **Push-to-Talk (PTT)**: Hold the `[SPACEBAR]` or click the mic button to transmit voice instructions over VHF frequency 124.850 MHz.
   - **Natural Language Parsing**: Understands both **English** and **Bahasa Indonesia** ATC phraseology:
     - *"Garuda satu dua tiga, heading dua tujuh nol"* (Turns `GIA123` to heading 270°)
     - *"Lion 456, speed 180 knots"* (Adjusts `LNI456` speed)
     - *"Garuda 123, descend to 3000 feet"*
     - *"Garuda 123, cleared to land runway 09"*
   - **Pilot Readback (`SpeechSynthesis`)**: The virtual cockpit pilot acknowledges the transmission with realistic radio squelch and double-tone Roger beeps.
   - **CLI Input Fallback**: A built-in terminal command input (`ATC> ...`) allowing full command testing even if microphone access is disabled.

4. **Realistic Air Traffic Rules & Failure Conditions**:
   - **Separation Loss / Mid-Air Collision**: If two aircraft violate the minimum Euclidean separation distance ($< 28$px), a mid-air collision occurs, triggering the emergency alert and Game Over sequence. Proximity warnings ($< 55$px) provide flashing TCAS collision alerts.
   - **Fuel Depletion**: Planes consume fuel continuously. Below 25% triggers a Low Fuel Emergency. Depletion to 0% causes a crash.
   - **Runway 09 Landing**: Guide aircraft to intercept the western approach corridor, align within $\pm 35^\circ$ of runway heading (090°), and touch down safely for +150 score points.
   - **Dynamic Traffic Spawning**: Automatic and manual traffic spawning for real-world airlines (Garuda Indonesia, Lion Air, Citilink, Batik Air, AirAsia, Super Air Jet).

---

## 🕹️ Controls Guide

| Action | Control |
|---|---|
| **Draw Vector Path** | `Click and Drag` from aircraft on radar screen |
| **Select Aircraft** | `Click` on aircraft or click its Flight Strip card |
| **Push-to-Talk (PTT)** | Hold `[SPACEBAR]` while speaking, or toggle Mic button |
| **Quick Heading Vectors** | Use `-30°`, `-10°`, `+10°`, `+30°` buttons in Tactical panel |
| **Speed Adjustment** | Use `SPD -20 KT` and `SPD +20 KT` buttons |
| **Type Commands** | Enter command in `ATC>` prompt at the bottom of the sidebar |
| **Pause / Resume** | Click the Play/Pause button in the sidebar header |
| **Spawn Traffic** | Click `+ TRAFFIC` in the flight strips header |

---

## 🗣️ Voice Phraseology Reference

### Bahasa Indonesia
- **Heading**: *"Garuda satu dua tiga, heading dua tujuh nol"*
- **Speed**: *"Lion empat lima enam, kecepatan seratus delapan puluh"*
- **Altitude**: *"Garuda satu dua tiga, turun ke tiga ribu kaki"*
- **Landing**: *"Garuda satu dua tiga, diizinkan mendarat runway nol sembilan"*

### English
- **Heading**: *"Garuda 123, fly heading 270"* or *"LNI456, turn heading 090"*
- **Speed**: *"GIA123, speed 180 knots"*
- **Altitude**: *"Lion 456, descend to 3000 feet"*
- **Landing**: *"Garuda 123, cleared to land runway 09"*

---

## 🛠️ Technology Stack

- **Framework**: [React 19](https://react.dev/) + [Vite 8](https://vite.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Styling**: [TailwindCSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Audio & Speech**: HTML5 Web Audio API (synthetic VHF radio sounds) + Web Speech API (`SpeechRecognition` & `SpeechSynthesis`)
- **Deployment**: [Cloudflare Pages](https://pages.cloudflare.com/) with GitHub Actions CI/CD

---

## 🚀 Getting Started Locally

```bash
# Clone the repository
git clone https://github.com/Gustyx-Power/ATC-Aviation.git
cd ATC-Aviation

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production

```bash
npm run build
```

The production-ready static assets will be output to the `dist/` directory.

---

## 🌐 Cloudflare Pages CI/CD

Automated deployment is configured via `.github/workflows/deploy.yml`. When pushed to `main`, GitHub Actions automatically builds the Vite application and deploys it to Cloudflare Pages.
