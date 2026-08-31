import { sfx } from './audioSynthesizer';

/**
 * Robust Audio Controller for Taiwanese Voice Pronunciation
 * Prevents overlap, handles errors gracefully, and converts Google Drive URLs.
 */
class VoiceAudioManager {
  private currentAudio: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;
  private volume: number = 1.0;
  private timeoutTimer: number | null = null;

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.currentAudio) {
      this.currentAudio.volume = this.volume;
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  /**
   * Automatically convert various Google Drive, MoE, or cloud links to direct playable MP3 streams
   */
  public normalizeAudioUrl(rawUrl: string): string {
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    let url = rawUrl.trim();

    // Google Drive share link handler
    // e.g., https://drive.google.com/file/d/1A2B3C.../view?usp=sharing
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      return `https://docs.google.com/uc?export=download&id=${driveMatch[1]}`;
    }

    // Google Drive open?id= handler
    const driveIdMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
    if (driveIdMatch && driveIdMatch[1]) {
      return `https://docs.google.com/uc?export=download&id=${driveIdMatch[1]}`;
    }

    // Handle protocol-relative URLs
    if (url.startsWith('//')) {
      url = 'https:' + url;
    }

    return url;
  }

  /**
   * Play target pronunciation audio with automatic fallback if loading fails or times out
   */
  public async playVoice(
    url: string,
    fallbackText?: { taiwanese: string; prompt?: string },
    onStart?: () => void,
    onEnded?: () => void
  ): Promise<boolean> {
    this.stop();

    const normalizedUrl = this.normalizeAudioUrl(url);

    if (!normalizedUrl) {
      // No audio URL available -> use speech synth fallback
      this.speakFallback(fallbackText?.taiwanese || '', onStart, onEnded);
      return false;
    }

    return new Promise((resolve) => {
      try {
        const audio = new Audio();
        this.currentAudio = audio;
        audio.volume = this.volume;
        // Do NOT set audio.crossOrigin = 'anonymous', as third-party audio (sutian / S3) plays seamlessly without CORS

        let hasResolved = false;

        const cleanup = () => {
          if (this.timeoutTimer) {
            window.clearTimeout(this.timeoutTimer);
            this.timeoutTimer = null;
          }
          this.isPlaying = false;
        };

        const handleSuccessEnd = () => {
          cleanup();
          if (onEnded) onEnded();
        };

        const handleErrorFallback = () => {
          if (hasResolved) return;
          hasResolved = true;
          cleanup();
          // Fallback if audio url fails
          sfx.playHit(0.2);
          this.speakFallback(fallbackText?.taiwanese || '', onStart, onEnded);
          resolve(false);
        };

        audio.addEventListener('play', () => {
          this.isPlaying = true;
          if (onStart) onStart();
        });

        audio.addEventListener('ended', handleSuccessEnd);
        audio.addEventListener('error', handleErrorFallback);

        // 5-second timeout protection
        this.timeoutTimer = window.setTimeout(() => {
          if (!this.isPlaying && !hasResolved) {
            console.warn('[Audio] Load timeout on url:', normalizedUrl);
            handleErrorFallback();
          }
        }, 5000);

        audio.src = normalizedUrl;
        audio.load();

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              if (!hasResolved) {
                hasResolved = true;
                resolve(true);
              }
            })
            .catch((err) => {
              console.warn('[Audio] play() catch error:', err);
              handleErrorFallback();
            });
        }
      } catch (err) {
        console.error('[Audio] Exception during playVoice:', err);
        if (onStart) onStart();
        if (onEnded) onEnded();
        resolve(false);
      }
    });
  }

  public stop() {
    if (this.timeoutTimer) {
      window.clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {
        // ignore
      }
      this.currentAudio = null;
    }
    this.isPlaying = false;
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
  }

  private speakFallback(text: string, onStart?: () => void, onEnded?: () => void) {
    if (!text || !window.speechSynthesis) {
      if (onStart) onStart();
      setTimeout(() => {
        if (onEnded) onEnded();
      }, 500);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const voices = window.speechSynthesis.getVoices();
      
      // Look for a genuine Taiwanese / Hokkien / Min-Nan voice
      const taiwaneseVoice = voices.find(
        (v) =>
          v.lang === 'nan' ||
          v.lang === 'nan-TW' ||
          v.lang === 'zh-min-nan' ||
          v.name.toLowerCase().includes('taiwanese') ||
          v.name.toLowerCase().includes('hokkien') ||
          v.name.includes('閩南') ||
          v.name.includes('台語')
      );

      if (taiwaneseVoice) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = taiwaneseVoice;
        utterance.lang = taiwaneseVoice.lang;
        utterance.rate = 0.85;
        utterance.volume = this.volume;

        utterance.onstart = () => {
          if (onStart) onStart();
        };
        utterance.onend = () => {
          if (onEnded) onEnded();
        };
        utterance.onerror = () => {
          if (onEnded) onEnded();
        };

        window.speechSynthesis.speak(utterance);
      } else {
        // No Taiwanese TTS engine in browser -> avoid speaking Mandarin (to prevent confusing students)
        // Play a prompt tone instead
        sfx.playHit(0.25);
        if (onStart) onStart();
        setTimeout(() => {
          if (onEnded) onEnded();
        }, 500);
      }
    } catch {
      if (onStart) onStart();
      if (onEnded) onEnded();
    }
  }
}

export const voicePlayer = new VoiceAudioManager();
