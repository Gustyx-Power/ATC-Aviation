/**
 * Synthetic VHF radio sound & ATC simulation sound effects using Web Audio API
 */

class RadioSoundFX {
  private ctx: AudioContext | null = null

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
   * Mic click / PTT open squelch burst
   */
  playMicClick() {
    try {
      const ctx = this.getContext()
      if (!ctx) return

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(800, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.04)

      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + 0.05)
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

      gain.gain.setValueAtTime(0.06, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(now + 0.12)
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

      gain.gain.setValueAtTime(0.1, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(now + 0.6)
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
   * Speak Pilot voice readback aloud through speakers with VHF radio effects
   */
  speakPilotVoice(text: string) {
    // 1. Play opening radio squelch beep
    this.playRogerBeep()

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    try {
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.05
      utterance.pitch = 0.95
      utterance.volume = 1.0

      // Find suitable Indonesian or English voice
      const voices = window.speechSynthesis.getVoices()
      const indonesianVoice = voices.find((v) => v.lang.startsWith('id') || v.name.includes('Indonesia'))
      const englishMaleVoice = voices.find((v) => v.lang.startsWith('en') && (v.name.includes('David') || v.name.includes('Male') || v.name.includes('George') || v.name.includes('Natural')))
      
      if (indonesianVoice) {
        utterance.voice = indonesianVoice
        utterance.lang = 'id-ID'
      } else if (englishMaleVoice) {
        utterance.voice = englishMaleVoice
        utterance.lang = 'en-US'
      }

      utterance.onend = () => {
        // Radio mic unclick on transmission complete
        this.playMicClick()
      }

      window.speechSynthesis.speak(utterance)
    } catch {
      // Fallback
    }
  }
}

export const radioSound = new RadioSoundFX()
