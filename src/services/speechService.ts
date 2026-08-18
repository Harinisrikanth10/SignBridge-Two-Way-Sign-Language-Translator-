// Web Speech API service for Speech-to-Text (SpeechRecognition) and Text-to-Speech (speechSynthesis)

export interface SpeechRecognitionHandlers {
  onResult: (transcript: string) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}

class SpeechService {
  private recognition: any = null;
  private isListening: boolean = false;

  constructor() {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      this.recognition = new SpeechRecognitionAPI();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
    }
  }

  public isSpeechRecognitionSupported(): boolean {
    return this.recognition !== null;
  }

  public startListening(handlers: SpeechRecognitionHandlers): boolean {
    if (!this.recognition) {
      handlers.onError('Speech Recognition is not supported in this browser. Please use Chrome or Edge.');
      return false;
    }

    if (this.isListening) {
      this.stopListening();
    }

    try {
      this.isListening = true;

      this.recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        handlers.onResult(currentTranscript);
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        handlers.onError(event.error || 'Speech recognition error occurred');
      };

      this.recognition.onend = () => {
        this.isListening = false;
        handlers.onEnd();
      };

      this.recognition.start();
      return true;
    } catch (err: any) {
      this.isListening = false;
      handlers.onError(err.message || 'Failed to start microphone');
      return false;
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (_) {}
      this.isListening = false;
    }
  }

  public speak(text: string, onEnd?: () => void): boolean {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech Synthesis is not supported in this browser');
      return false;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    if (!text.trim()) return false;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // Slightly clear & distinct rate
    utterance.pitch = 1.0;

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = () => onEnd();
    }

    window.speechSynthesis.speak(utterance);
    return true;
  }

  public stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const speechService = new SpeechService();
