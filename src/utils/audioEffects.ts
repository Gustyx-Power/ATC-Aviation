/**
 * Synthetic VHF radio sound & ATC simulation sound effects using Web Audio API
 */

class RadioSoundFX {
  private ctx: AudioContext | null = null
  private carrierGainNode: GainNode | null = null
  private carrierNoiseNode: AudioBufferSourceNode | null = null
  private carrierOsc1: OscillatorNode | null = null
  private carrierOsc2: OscillatorNode | null = null
  private isTransmitting = false
  private carrierTimeout: ReturnType<typeof setTimeout> | null = null

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    return this.ctx
  }

  /**
   * Continuous VHF Radio Carrier Hiss + 400Hz Cockpit Alternator Hum Bed
   * Recreates the authentic live airband background during pilot/ATC transmissions
   */
  startRadioCarrier() {
    try {
      const ctx = this.getContext()
      if (!ctx || this.isTransmitting) return
      this.isTransmitting = true

      // Master carrier gain with quick fade-in
      const masterGain = ctx.createGain()
      masterGain.gain.setValueAtTime(0.001, ctx.currentTime)
      masterGain.gain.exponentialRampToValueAtTime(0.045, ctx.currentTime + 0.04)

      // 1. Airband VHF White/Pink Noise (Bandpass filtered 350Hz - 2900Hz)
      const bufferSize = ctx.sampleRate * 2
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const output = noiseBuffer.getChannelData(0)
      let b0 = 0, b1 = 0, b2 = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        b0 = 0.99765 * b0 + white * 0.099046
        b1 = 0.963 * b1 + white * 0.14732
        b2 = 0.57 * b2 + white * 0.55
        output[i] = (b0 + b1 + b2 + white * 0.12) * 0.22
      }

      const noise = ctx.createBufferSource()
      noise.buffer = noiseBuffer
      noise.loop = true

      const bandpass = ctx.createBiquadFilter()
      bandpass.type = 'bandpass'
      bandpass.frequency.setValueAtTime(1450, ctx.currentTime)
      bandpass.Q.setValueAtTime(1.2, ctx.currentTime)

      const highCut = ctx.createBiquadFilter()
      highCut.type = 'highshelf'
      highCut.frequency.setValueAtTime(2800, ctx.currentTime)
      highCut.gain.setValueAtTime(-14, ctx.currentTime)

      noise.connect(bandpass)
      bandpass.connect(highCut)
      highCut.connect(masterGain)
      noise.start()
      this.carrierNoiseNode = noise

      // 2. Cockpit 400Hz Electrical Alternator Bus Whine (Cockpit headset signature)
      const oscWhine = ctx.createOscillator()
      const oscWhineGain = ctx.createGain()
      oscWhine.type = 'sine'
      oscWhine.frequency.setValueAtTime(400, ctx.currentTime)
      oscWhineGain.gain.setValueAtTime(0.007, ctx.currentTime)
      oscWhine.connect(oscWhineGain)
      oscWhineGain.connect(masterGain)
      oscWhine.start()
      this.carrierOsc1 = oscWhine

      // 3. Cockpit Jet Turbine Low-Frequency Drone (110Hz)
      const oscDrone = ctx.createOscillator()
      const oscDroneGain = ctx.createGain()
      oscDrone.type = 'triangle'
      oscDrone.frequency.setValueAtTime(110, ctx.currentTime)
      oscDroneGain.gain.setValueAtTime(0.012, ctx.currentTime)
      oscDrone.connect(oscDroneGain)
      oscDroneGain.connect(masterGain)
      oscDrone.start()
      this.carrierOsc2 = oscDrone

      masterGain.connect(ctx.destination)
      this.carrierGainNode = masterGain
    } catch {
      // Ignore audio context errors
    }
  }

  /**
   * Stop VHF Carrier Bed and clean up audio graph
   */
  stopRadioCarrier() {
    try {
      if (this.carrierTimeout) {
        clearTimeout(this.carrierTimeout)
        this.carrierTimeout = null
      }
      if (!this.isTransmitting) return
      this.isTransmitting = false

      const ctx = this.getContext()
      if (ctx && this.carrierGainNode) {
        this.carrierGainNode.gain.setValueAtTime(this.carrierGainNode.gain.value, ctx.currentTime)
        this.carrierGainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03)

        setTimeout(() => {
          try {
            this.carrierNoiseNode?.stop()
            this.carrierNoiseNode?.disconnect()
            this.carrierOsc1?.stop()
            this.carrierOsc1?.disconnect()
            this.carrierOsc2?.stop()
            this.carrierOsc2?.disconnect()
            this.carrierGainNode?.disconnect()
          } catch {
            // Ignore
          }
          this.carrierNoiseNode = null
          this.carrierOsc1 = null
          this.carrierOsc2 = null
          this.carrierGainNode = null
        }, 40)
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Realistic VHF Squelch Burst (White/Pink noise burst on keying mic)
   */
  playSquelchBurst(duration = 0.08) {
    try {
      const ctx = this.getContext()
      if (!ctx) return

      const bufferSize = Math.floor(ctx.sampleRate * duration)
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4))
      }

      const noise = ctx.createBufferSource()
      noise.buffer = buffer

      // Airband VHF Bandpass Filter (300Hz - 3200Hz)
      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(1600, ctx.currentTime)
      filter.Q.setValueAtTime(1.4, ctx.currentTime)

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.09, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

      noise.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      noise.start()
    } catch {
      // Ignore
    }
  }

  /**
   * Mic click / PTT open squelch burst
   */
  playMicClick() {
    this.playSquelchBurst(0.06)
    try {
      const ctx = this.getContext()
      if (!ctx) return

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(900, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.035)

      gain.gain.setValueAtTime(0.06, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + 0.04)
    } catch {
      // Ignore
    }
  }

  /**
   * Pilot Roger Roger double-tone ack beep
   */
  playRogerBeep() {
    try {
      const ctx = this.getContext()
      if (!ctx) return

      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(1200, now)
      osc.frequency.setValueAtTime(1800, now + 0.05)

      gain.gain.setValueAtTime(0.05, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(now + 0.11)
      this.playSquelchBurst(0.05)
    } catch {
      // Ignore
    }
  }

  /**
   * Air Traffic Conflict Alert / TCAS warning siren (pulsing high-low alert)
   */
  playConflictAlert() {
    try {
      const ctx = this.getContext()
      if (!ctx) return

      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(880, now)
      osc.frequency.setValueAtTime(440, now + 0.1)
      osc.frequency.setValueAtTime(880, now + 0.2)
      osc.frequency.setValueAtTime(440, now + 0.3)

      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(now + 0.4)
    } catch {
      // Ignore
    }
  }

  /**
   * Successful Runway Touchdown chime
   */
  playTouchdown() {
    try {
      const ctx = this.getContext()
      if (!ctx) return

      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(523.25, now) // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1) // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2) // G5
      osc.frequency.setValueAtTime(1046.5, now + 0.3) // C6

      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(now + 0.5)
    } catch {
      // Ignore
    }
  }

  /**
   * Mid-Air Collision explosion rumble
   */
  playExplosion() {
    try {
      const ctx = this.getContext()
      if (!ctx) return

      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(140, now)
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.8)

      gain.gain.setValueAtTime(0.2, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(now + 0.9)
    } catch {
      // Ignore
    }
  }

  /**
   * Convert aircraft flight numbers & aviation abbreviations to natural radio phonetics
   */
  private formatRadioPhonetics(text: string): string {
    return text
      .replace(/GIA123/gi, 'Garuda satu dua tiga')
      .replace(/LNI456/gi, 'Lion Air empat lima enam')
      .replace(/CTV789/gi, 'Citilink tujuh delapan sembilan')
      .replace(/BTK204/gi, 'Batik Air dua nol empat')
      .replace(/\bFL035\b/gi, 'Flight Level tiga puluh lima')
      .replace(/\bFL050\b/gi, 'Flight Level lima puluh')
      .replace(/\bRunway 09\b/gi, 'Runway nol sembilan')
      .replace(/\bRunway 27\b/gi, 'Runway dua tujuh')
  }

  /**
   * Speak Pilot voice readback aloud with authentic VHF radio carrier hiss,
   * PTT squelch keying, deep cockpit pitch, and trailing roger chirp
   */
  speakPilotVoice(text: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    try {
      window.speechSynthesis.cancel()
      this.stopRadioCarrier()

      // 1. Play opening PTT mic click & squelch burst
      this.playMicClick()
      this.playSquelchBurst(0.1)

      // 2. Start continuous VHF carrier noise bed
      this.startRadioCarrier()

      const spokenText = this.formatRadioPhonetics(text)
      const utterance = new SpeechSynthesisUtterance(spokenText)

      // Authentic cockpit radio voice parameters:
      // Deep authoritative pitch (0.78), brisk ATC radio cadence (1.16)
      utterance.pitch = 0.78
      utterance.rate = 1.16
      utterance.volume = 1.0

      // Select best male cockpit pilot voice if available
      const voices = window.speechSynthesis.getVoices()
      const cockpitVoice =
        voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('David') ||
              v.name.includes('Mark') ||
              v.name.includes('George') ||
              v.name.includes('Natural') ||
              v.name.includes('Male'))
        ) ||
        voices.find((v) => v.lang.startsWith('id') || v.name.includes('Indonesia')) ||
        voices.find((v) => v.lang.startsWith('en'))

      if (cockpitVoice) {
        utterance.voice = cockpitVoice
        utterance.lang = cockpitVoice.lang
      }

      const finishTransmission = () => {
        this.stopRadioCarrier()
        // Radio mic unclick, trailing squelch cut and roger chirp
        this.playSquelchBurst(0.08)
        setTimeout(() => this.playRogerBeep(), 30)
      }

      utterance.onend = finishTransmission
      utterance.onerror = () => {
        this.stopRadioCarrier()
      }

      // Fallback safety timeout in case speech engine hangs
      const maxDuration = Math.max(3500, spokenText.length * 90)
      this.carrierTimeout = setTimeout(() => {
        if (this.isTransmitting) {
          this.stopRadioCarrier()
        }
      }, maxDuration)

      window.speechSynthesis.speak(utterance)
    } catch {
      this.stopRadioCarrier()
    }
  }
}

export const radioSound = new RadioSoundFX()
