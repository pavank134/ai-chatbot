import { useState, useCallback, useRef } from 'react';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  [index: number]: {
    transcript: string;
    confidence: number;
    isFinal?: boolean;
  };
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

export const useVoice = (onTranscriptComplete: (text: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.log('Recognition already stopped or not running');
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Stop any existing recognition first
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.log('Stopping existing recognition');
      }
      recognitionRef.current = null;
    }

    stopSpeaking();
    
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      console.error('Speech recognition not supported in this browser. Please use Chrome or Edge.');
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge for voice input.');
      return;
    }

    // Check if we have microphone permissions
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => {
        const recognition = new SpeechRecognitionAPI();
        recognitionRef.current = recognition;

        recognition.continuous = false;
        recognition.interimResults = true; // Enable interim results for better feedback
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          console.log('Speech recognition started');
          setIsListening(true);
        };

        recognition.onend = () => {
          console.log('Speech recognition ended');
          setIsListening(false);
          recognitionRef.current = null;
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error, event.message);
          setIsListening(false);
          recognitionRef.current = null;
          
          // Provide user-friendly error messages
          switch(event.error) {
            case 'no-speech':
              console.log('No speech detected. Please try again.');
              break;
            case 'audio-capture':
              alert('Microphone access denied. Please allow microphone access and try again.');
              break;
            case 'not-allowed':
              alert('Microphone permission denied. Please allow microphone access to use voice input.');
              break;
            case 'network':
              alert('Network error. Please check your internet connection and try again.');
              break;
            case 'aborted':
              console.log('Speech recognition was aborted. This is normal when stopping or restarting.');
              // Don't show alert for aborted errors as they're normal
              break;
            default:
              console.log('Speech recognition error:', event.error);
          }
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          console.log('Speech recognition result received');
          const result = event.results[event.resultIndex];
          
          if (result.isFinal) {
            const transcript = result[0].transcript;
            const confidence = result[0].confidence;
            
            console.log('Final transcript:', transcript, 'Confidence:', confidence);
            
            // Lower confidence threshold and accept all results with reasonable confidence
            if (confidence > 0.5 || transcript.trim().length > 0) {
              onTranscriptComplete(transcript.trim());
            }
          }
        };

        try {
          recognition.start();
        } catch (error) {
          console.error('Failed to start speech recognition:', error);
          setIsListening(false);
          recognitionRef.current = null;
        }
      })
      .catch((error) => {
        console.error('Microphone access denied:', error);
        alert('Microphone access is required for voice input. Please allow microphone access and try again.');
        setIsListening(false);
      });
  }, [onTranscriptComplete, stopSpeaking]);

  const speak = useCallback((text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  return { 
    isListening, 
    startListening, 
    stopListening, 
    stopSpeaking, 
    speak 
  };
};