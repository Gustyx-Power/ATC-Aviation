import { useEffect, useRef, useState, useCallback } from 'react'
import { useGameStore } from '../store/useGameStore'
import { radioSound } from '../utils/audioEffects'
import { parseVoiceCommand, type ParsedVoiceCommand } from '../utils/voiceParser'

// Web Speech API interfaces
interface ISpeechRecognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onstart: (() => void) | null
  onresult: ((event: any) => void) | null
  onerror: ((event: any) => void) | null
  onend: (() => void) | null
}

interface IWindow extends Window {
  SpeechRecognition?: new () => ISpeechRecognition
  webkitSpeechRecognition?: new () => ISpeechRecognition
}

export const useVoiceCommand = () => {
  const aircrafts = useGameStore((state) => state.aircrafts)
  const selectedAircraftId = useGameStore((state) => state.selectedAircraftId)
  const micActive = useGameStore((state) => state.micActive)
  const setMicActive = useGameStore((state) => state.setMicActive)
  const setAircraftHeading = useGameStore((state) => state.setAircraftHeading)
  const setAircraftSpeed = useGameStore((state) => state.setAircraftSpeed)
  const setAircraftAltitude = useGameStore((state) => state.setAircraftAltitude)
  const setWaypoints = useGameStore((state) => state.setWaypoints)
  const addCommLog = useGameStore((state) => state.addCommLog)

  const [transcript, setTranscript] = useState<string>('')
  const [isSupported, setIsSupported] = useState<boolean>(true)
  const [lastParsed, setLastParsed] = useState<ParsedVoiceCommand | null>(null)

  const recognitionRef = useRef<ISpeechRecognition | null>(null)
  const isListeningRef = useRef<boolean>(false)


  // Pilot Voice Readback via authentic VHF Radio Sound Engine
  const speakPilotReadback = useCallback((text: string) => {
    radioSound.speakPilotVoice(text)
  }, [])

  // Execute a parsed voice command
  const executeCommand = useCallback(
    (parsed: ParsedVoiceCommand) => {
      setLastParsed(parsed)

      // 1. Log ATC transmission
      addCommLog({
        sender: 'ATC',
        callsign: parsed.targetAircraftId || undefined,
        message: `"${parsed.rawText}"`,
        type: 'command',
      })

      if (parsed.isSuccess && parsed.targetAircraftId) {
        const targetId = parsed.targetAircraftId

        switch (parsed.command) {
          case 'HEADING':
            if (parsed.value !== undefined) {
              setAircraftHeading(targetId, parsed.value)
            }
            break

          case 'SPEED':
            if (parsed.value !== undefined) {
              // Convert knots (120-300) to simulation speed (1.2 - 3.0 px/frame)
              setAircraftSpeed(targetId, parsed.value / 100)
            }
            break

          case 'ALTITUDE':
            if (parsed.value !== undefined) {
              setAircraftAltitude(targetId, parsed.value)
            }
            break

          case 'LAND':
            // Will be used for approach / cleared to land
            setAircraftHeading(targetId, 90) // runway 09 alignment
            break

          case 'CANCEL':
            setWaypoints(targetId, [])
            break
        }

        // 2. Pilot readback acknowledgement
        addCommLog({
          sender: 'PILOT',
          callsign: targetId,
          message: parsed.pilotReadback,
          type: 'ack',
        })
      } else {
        // Pilot or System alert
        addCommLog({
          sender: 'PILOT',
          callsign: parsed.targetAircraftId || undefined,
          message: parsed.pilotReadback,
          type: 'alert',
        })
      }

      // Voice response
      speakPilotReadback(parsed.pilotReadback)
    },
    [
      addCommLog,
      setAircraftHeading,
      setAircraftSpeed,
      setAircraftAltitude,
      setWaypoints,
      speakPilotReadback,
    ]
  )

  // Direct manual command processing (for CLI terminal input fallback)
  const processManualCommand = useCallback(
    (commandText: string) => {
      if (!commandText.trim()) return
      const parsed = parseVoiceCommand(commandText, aircrafts, selectedAircraftId)
      executeCommand(parsed)
    },
    [aircrafts, selectedAircraftId, executeCommand]
  )

  // Initialize SpeechRecognition
  useEffect(() => {
    if (typeof window === 'undefined') return

    const win = window as IWindow
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition

    if (!SpeechRecognitionClass) {
      setIsSupported(false)
      return
    }

    try {
      const recognition = new SpeechRecognitionClass()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US' // Can handle both English and Indonesian numbers nicely

      recognition.onstart = () => {
        isListeningRef.current = true
        setMicActive(true)
        radioSound.playMicClick()
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let currentString = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i]
          currentString += item[0].transcript
        }
        setTranscript(currentString)

        // If recognition detected a final sentence
        const lastResult = event.results[event.results.length - 1]
        if (lastResult.isFinal) {
          const finalText = lastResult[0].transcript.trim()
          if (finalText.length > 0) {
            const parsed = parseVoiceCommand(finalText, aircrafts, selectedAircraftId)
            executeCommand(parsed)
            setTranscript('')
          }
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        // Handle common speech errors gracefully
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn('SpeechRecognition error:', event.error)
        }
      }

      recognition.onend = () => {
        isListeningRef.current = false
        setMicActive(false)
        radioSound.playMicClick()
      }

      recognitionRef.current = recognition
    } catch (e) {
      console.warn('Failed to initialize SpeechRecognition:', e)
      setIsSupported(false)
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [aircrafts, selectedAircraftId, executeCommand, setMicActive])

  // Start listening
  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListeningRef.current) return
    try {
      recognitionRef.current.start()
    } catch {
      // Ignore duplicate start errors
    }
  }, [])

  // Stop listening
  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListeningRef.current) return
    try {
      recognitionRef.current.stop()
    } catch {
      // Ignore
    }
  }, [])

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListeningRef.current) {
      stopListening()
    } else {
      startListening()
    }
  }, [startListening, stopListening])

  // Push-to-Talk via Spacebar (PRD Section 3.B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const targetTag = (e.target as HTMLElement)?.tagName
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA') return

      if (e.code === 'Space' && !e.repeat && !isListeningRef.current) {
        e.preventDefault()
        startListening()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA') return

      if (e.code === 'Space' && isListeningRef.current) {
        e.preventDefault()
        stopListening()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [startListening, stopListening])

  return {
    transcript,
    isSupported,
    micActive,
    lastParsed,
    startListening,
    stopListening,
    toggleListening,
    processManualCommand,
  }
}
