/**
 * Synthetic VHF radio sound & ATC simulation sound effects using Web Audio API
 */

export type RadioRole = 'ATC' | 'PILOT' | 'GROUND_CREW'

export interface QueuedTransmission {
  role: RadioRole
  text: string
  displayText?: string
}

class RadioSoundFX {
  private ctx: AudioContext | null = null
  private carrierGainNode: GainNode | null = null
  private carrierNoiseNode: AudioBufferSourceNode | null = null
  private carrierOsc1: OscillatorNode | null = null
  private carrierOsc2: OscillatorNode | null = null
  private isTransmitting = false
  private carrierTimeout: ReturnType<typeof setTimeout> | null = null

  // FIFO Radio Transmission Queue: Ensures ATC and Pilot transmissions never cut each other off
  private speechQueue: QueuedTransmission[] = []
  private isSpeaking = false
  private currentSpeaker: RadioRole | null = null
  private currentTransmittingText = ''
  private speakerSubscribers: Set<(speaker: RadioRole | null, text: string) => void> = new Set()

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices()
      }
    }
  }

  /**
   * Subscribe to real-time active radio speaker events ('ATC' | 'PILOT' | null)
   */
  subscribeSpeaker(callback: (speaker: RadioRole | null, text: string) => void): () => void {
    this.speakerSubscribers.add(callback)
    callback(this.currentSpeaker, this.currentTransmittingText)
    return () => {
      this.speakerSubscribers.delete(callback)
    }
  }

  private notifySpeakerSubscribers() {
    this.speakerSubscribers.forEach((cb) => {
      try {
        cb(this.currentSpeaker, this.currentTransmittingText)
      } catch {
        // Ignore subscriber errors
      }
    })
  }

  getCurrentSpeaker(): RadioRole | null {
    return this.currentSpeaker
  }

  getCurrentText(): string {
    return this.currentTransmittingText
  }

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
   * Continuous VHF Radio Carrier Hiss Bed
   * isCockpit = true adds the 400Hz cockpit alternator whine + 110Hz jet drone.
   * isCockpit = false produces the cleaner ground tower ATC headset sidetone.
   */
  startRadioCarrier(isCockpit = true) {
    try {
      const ctx = this.getContext()
      if (!ctx || this.isTransmitting) return
      this.isTransmitting = true

      // Master carrier gain with quick fade-in
      const masterGain = ctx.createGain()
      masterGain.gain.setValueAtTime(0.001, ctx.currentTime)
      masterGain.gain.exponentialRampToValueAtTime(isCockpit ? 0.03 : 0.018, ctx.currentTime + 0.04)

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
      bandpass.frequency.setValueAtTime(isCockpit ? 1450 : 1600, ctx.currentTime)
      bandpass.Q.setValueAtTime(isCockpit ? 1.2 : 1.4, ctx.currentTime)

      const highCut = ctx.createBiquadFilter()
      highCut.type = 'highshelf'
      highCut.frequency.setValueAtTime(2800, ctx.currentTime)
      highCut.gain.setValueAtTime(-14, ctx.currentTime)

      noise.connect(bandpass)
      bandpass.connect(highCut)
      highCut.connect(masterGain)
      noise.start()
      this.carrierNoiseNode = noise

      if (isCockpit) {
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
      }

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
   * Iconic VHF Airband "TUT-TUT" / PTT Radio Chirp (Dual-frequency aviation tone)
   */
  playRadioTutTut(reverse = false) {
    try {
      const ctx = this.getContext()
      if (!ctx) return

      const now = ctx.currentTime
      const f1 = reverse ? 1550 : 2180
      const f2 = reverse ? 2180 : 1620

      // First beep: "TUT"
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(f1, now)
      gain1.gain.setValueAtTime(0.15, now)
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.055)
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.start(now)
      osc1.stop(now + 0.055)

      // Second beep: "TUT"
      const t2 = now + 0.075
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(f2, t2)
      gain2.gain.setValueAtTime(0.15, t2)
      gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.065)
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start(t2)
      osc2.stop(t2 + 0.065)

      // Accompanied by airband mic squelch burst
      this.playSquelchBurst(0.06)
    } catch {
      // Ignore
    }
  }

  /**
   * Pilot Roger Roger double-tone ack beep ("TUT-TUT")
   */
  playRogerBeep() {
    this.playRadioTutTut(false)
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
   * Convert aircraft flight numbers & aviation abbreviations to natural English aviation radio phonetics
   */
  private formatRadioPhonetics(text: string): string {
    const digitWords: Record<string, string> = {
      '0': 'zero',
      '1': 'one',
      '2': 'two',
      '3': 'three',
      '4': 'four',
      '5': 'five',
      '6': 'six',
      '7': 'seven',
      '8': 'eight',
      '9': 'niner',
    }
    const spellDigits = (digits: string) =>
      digits
        .split('')
        .map((d) => digitWords[d] || d)
        .join(' ')

    return text
      .replace(/\bBTK(\d{3})\b/gi, (_, num) => `Batik Air ${spellDigits(num)}`)
      .replace(/\bGIA(\d{3})\b/gi, (_, num) => `Garuda ${spellDigits(num)}`)
      .replace(/\bLNI(\d{3})\b/gi, (_, num) => `Lion Air ${spellDigits(num)}`)
      .replace(/\bCTV(\d{3})\b/gi, (_, num) => `Citilink ${spellDigits(num)}`)
      .replace(/\bFL0(\d{2})\b/gi, (_, num) => `Flight Level ${spellDigits(num)}`)
      .replace(/\bFL(\d{3})\b/gi, (_, num) => `Flight Level ${spellDigits(num)}`)
      .replace(/\bRunway 09\b/gi, 'Runway zero niner')
      .replace(/\bRunway 27\b/gi, 'Runway two seven')
      .replace(/\bGate (\d+)\b/gi, (_, num) => `Gate ${spellDigits(num)}`)
  }

  /**
   * Enqueue ATC tower instruction (Female Voice) into the FIFO radio queue.
   */
  speakAtcVoice(text: string, displayText?: string) {
    this.enqueueTransmission('ATC', text, displayText)
  }

  /**
   * Enqueue pilot speech readback (Male Voice) into the FIFO radio queue.
   */
  speakPilotVoice(text: string, displayText?: string) {
    this.enqueueTransmission('PILOT', text, displayText)
  }

  /**
   * Enqueue ground engineer / maintenance crew transmission into the FIFO radio queue.
   */
  speakGroundCrewVoice(text: string, displayText?: string) {
    this.enqueueTransmission('GROUND_CREW', text, displayText)
  }

  private enqueueTransmission(role: RadioRole, text: string, displayText?: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    if (!text || text.trim().length === 0) return

    const trimmed = text.trim()
    const trimmedDisplay = displayText ? displayText.trim() : trimmed

    // Prevent duplicate identical transmissions in queue
    if (this.speechQueue.some((item) => item.role === role && item.text === trimmed)) return

    // Cap queue to max 2 transmissions to prevent audio clutter and never-ending radio backlog
    if (this.speechQueue.length >= 2) {
      this.speechQueue.shift()
    }

    const item: QueuedTransmission = { role, text: trimmed, displayText: trimmedDisplay }

    // Emergency transmissions jump to the front of the waiting queue
    if (trimmed.includes('MAYDAY') || trimmed.includes('emergency')) {
      this.speechQueue.unshift(item)
    } else {
      this.speechQueue.push(item)
    }

    if (!this.isSpeaking) {
      this.processNextTransmission()
    }
  }

  /**
   * Clear pending radio transmissions
   */
  clearSpeechQueue() {
    this.speechQueue = []
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    this.stopRadioCarrier()
    this.isSpeaking = false
    this.currentSpeaker = null
    this.currentTransmittingText = ''
    this.notifySpeakerSubscribers()
  }

  /**
   * Select authentic female English voice for ATC Tower Controller
   */
  private getAtcVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
    if (!voices || voices.length === 0) return undefined

    // 1. Common female voices on Windows (Zira, Jenny, Aria), macOS/iOS (Samantha, Victoria), and standard web
    const femaleKeywords = [
      'zira',
      'jenny',
      'aria',
      'hazel',
      'samantha',
      'victoria',
      'karen',
      'female',
      'susan',
      'moira',
      'sonia',
      'libby',
      'ana',
      'eva',
    ]
    const foundFemale = voices.find((v) => {
      if (!v.lang.startsWith('en')) return false
      const name = v.name.toLowerCase()
      return femaleKeywords.some((kw) => name.includes(kw))
    })
    if (foundFemale) return foundFemale

    // 2. Google US English (female default in Chromium on Windows/Linux)
    const googleVoice = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        v.name.includes('Google') &&
        !v.name.toLowerCase().includes('male')
    )
    if (googleVoice) return googleVoice

    // 3. Any English voice that does not match known male names
    const maleKeywords = ['david', 'mark', 'george', 'guy', 'male', 'richard', 'james', 'john', 'ryan', 'stefan']
    const nonMale = voices.find((v) => {
      if (!v.lang.startsWith('en')) return false
      const name = v.name.toLowerCase()
      return !maleKeywords.some((kw) => name.includes(kw))
    })
    if (nonMale) return nonMale

    return voices.find((v) => v.lang.startsWith('en-US')) || voices.find((v) => v.lang.startsWith('en'))
  }

  /**
   * Select authentic male English voice for Airline Captain
   */
  private getPilotVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
    if (!voices || voices.length === 0) return undefined

    const maleKeywords = ['david', 'mark', 'george', 'guy', 'male', 'richard', 'james', 'john', 'ryan', 'stefan']
    const foundMale = voices.find((v) => {
      if (!v.lang.startsWith('en')) return false
      const name = v.name.toLowerCase()
      return maleKeywords.some((kw) => name.includes(kw))
    })
    if (foundMale) return foundMale

    return voices.find((v) => v.lang.startsWith('en-US')) || voices.find((v) => v.lang.startsWith('en'))
  }

  /**
   * Process the next radio transmission in the FIFO queue
   */
  private processNextTransmission() {
    if (this.speechQueue.length === 0) {
      this.isSpeaking = false
      this.currentSpeaker = null
      this.currentTransmittingText = ''
      this.notifySpeakerSubscribers()
      return
    }

    this.isSpeaking = true
    const item = this.speechQueue.shift()!
    const { role, text } = item

    this.currentSpeaker = role
    this.currentTransmittingText = item.displayText || text
    this.notifySpeakerSubscribers()

    try {
      this.stopRadioCarrier()

      // 1. Play opening radio "TUT-TUT" PTT key-in tone
      this.playRadioTutTut(false)

      // 2. Start continuous VHF carrier bed (tower sidetone for ATC, cockpit whine for Pilot)
      setTimeout(() => {
        if (this.isSpeaking) {
          this.startRadioCarrier(role === 'PILOT')
        }
      }, 70)

      const spokenText = this.formatRadioPhonetics(text)
      const utterance = new SpeechSynthesisUtterance(spokenText)

      utterance.volume = 1.0
      const voices = window.speechSynthesis.getVoices()

      if (role === 'ATC') {
        // ATC Tower Controller: Professional, crisp, higher pitch female voice
        utterance.lang = 'en-US'
        utterance.pitch = 1.08
        utterance.rate = 1.16

        const atcVoice = this.getAtcVoice(voices)
        if (atcVoice) {
          utterance.voice = atcVoice
          utterance.lang = atcVoice.lang || 'en-US'
        }
      } else if (role === 'GROUND_CREW') {
        // Ground Engineer / Maintenance Crew: Direct, professional male voice
        utterance.lang = 'en-US'
        utterance.pitch = 0.88
        utterance.rate = 1.10

        const pilotVoice = this.getPilotVoice(voices)
        if (pilotVoice) {
          utterance.voice = pilotVoice
          utterance.lang = pilotVoice.lang || 'en-US'
        }
      } else {
        // Pilot Captain: Authoritative, steady, deeper male voice
        utterance.lang = 'en-US'
        utterance.pitch = 0.82
        utterance.rate = 1.12

        const pilotVoice = this.getPilotVoice(voices)
        if (pilotVoice) {
          utterance.voice = pilotVoice
          utterance.lang = pilotVoice.lang || 'en-US'
        }
      }

      let isCompleted = false
      const finishTransmission = () => {
        if (isCompleted) return
        isCompleted = true
        this.stopRadioCarrier()

        // Play trailing radio "TUT-TUT" roger release chirp
        setTimeout(() => this.playRadioTutTut(true), 20)

        // Clear active speaker after audio stops
        this.currentSpeaker = null
        this.currentTransmittingText = ''
        this.notifySpeakerSubscribers()

        // Natural radio gap pause (350ms dead air) before allowing the next speaker to transmit!
        setTimeout(() => {
          this.isSpeaking = false
          this.processNextTransmission()
        }, 350)
      }

      utterance.onend = finishTransmission
      utterance.onerror = () => {
        if (isCompleted) return
        isCompleted = true
        this.stopRadioCarrier()
        this.currentSpeaker = null
        this.currentTransmittingText = ''
        this.notifySpeakerSubscribers()
        setTimeout(() => {
          this.isSpeaking = false
          this.processNextTransmission()
        }, 200)
      }

      // Fallback safety timeout in case speech engine hangs
      const maxDuration = Math.max(3500, spokenText.length * 90)
      this.carrierTimeout = setTimeout(() => {
        if (!isCompleted) {
          finishTransmission()
        }
      }, maxDuration)

      // Slight offset so the opening TUT-TUT chirp is distinctly heard before speech starts!
      setTimeout(() => {
        if (this.isSpeaking) {
          window.speechSynthesis.speak(utterance)
        }
      }, 120)
    } catch {
      this.stopRadioCarrier()
      this.isSpeaking = false
      this.currentSpeaker = null
      this.currentTransmittingText = ''
      this.notifySpeakerSubscribers()
      setTimeout(() => this.processNextTransmission(), 200)
    }
  }
}

export const radioSound = new RadioSoundFX()
