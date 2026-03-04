/**
 * Inline Video Player Component
 * Handles Vimeo videos in [data-video-el="vimeo"] elements
 * - Lazy loads videos when they come into view
 * - Plays/pauses video on click or via dedicated toggle button
 */
import type { VimeoUrl } from '@vimeo/player';

class InlineVimeoPlayer {
  private readonly VIDEO_WRAP_SELECTOR = '[data-video-el="vimeo"]';
  private readonly TOGGLE_BUTTON_SELECTOR = '[data-video-el="toggle"]';
  private readonly VIDEO_URL_ATTR = 'data-video-url';
  private readonly VIDEO_LOOP_ATTR = 'data-video-loop';
  private readonly VIDEO_AUTOPLAY_ATTR = 'data-video-autoplay';

  private readonly PLAY_STATE_ATTR = 'data-play-state';
  private readonly PLAY_STATE_PLAYING = 'playing';
  private readonly PLAY_STATE_PAUSED = 'paused';
  private readonly PLAY_STATE_NONE = 'none';

  private observer: IntersectionObserver;
  private videoInstances: Map<HTMLElement, any> = new Map();
  private currentlyPlaying: HTMLElement | null = null;

  constructor() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.initializeVideo(entry.target as HTMLElement);
          }
        });
      },
      {
        rootMargin: '500px', // Start loading when x px away from viewport
        threshold: 0,
      }
    );

    this.initializeAll();
  }

  private initializeAll(): void {
    const videoWraps = document.querySelectorAll(this.VIDEO_WRAP_SELECTOR);

    if (videoWraps.length === 0) {
      console.debug('[InlineVimeoPlayer] No video wraps found');
      return;
    }

    videoWraps.forEach((wrap) => {
      this.observer.observe(wrap);
    });

    window.IS_DEBUG_MODE &&
      console.debug('[InlineVimeoPlayer] Observing', videoWraps.length, 'video wraps');
  }

  private async fetchThumbnail(videoUrl: string): Promise<string | null> {
    try {
      const response = await fetch(
        `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(videoUrl)}&height=1920`
      );

      if (!response.ok) {
        window.IS_DEBUG_MODE &&
          console.error(
            `[InlineVimeoPlayer] Failed to fetch thumbnail for the video: ${videoUrl}`,
            response.statusText
          );
        return null;
      }

      const data = await response.json();
      return data.thumbnail_url || null;
    } catch (error) {
      console.error('[InlineVimeoPlayer] Error fetching thumbnail:', error);
      return null;
    }
  }

  private async initializeVideo(wrap: HTMLElement): Promise<void> {
    // Stop observing once we start initializing
    this.observer.unobserve(wrap);

    // Check if already initialized
    if (this.videoInstances.has(wrap)) {
      return;
    }

    const videoUrl = wrap.getAttribute(this.VIDEO_URL_ATTR);
    if (!videoUrl) {
      console.error('[InlineVimeoPlayer] No video URL found on wrap', wrap);
      return;
    }

    const shouldLoop = wrap.getAttribute(this.VIDEO_LOOP_ATTR) === 'true';
    const shouldAutoplay = wrap.getAttribute(this.VIDEO_AUTOPLAY_ATTR) === 'true';

    // Fetch and apply thumbnail before initializing player
    const thumbnailUrl = await this.fetchThumbnail(videoUrl);
    if (thumbnailUrl) {
      wrap.style.setProperty('--thumb', `url('${thumbnailUrl}')`);
    }

    // Check if Vimeo API is available
    if (!window.Vimeo?.Player) {
      console.error('[InlineVimeoPlayer] Vimeo API not available');
      return;
    }

    try {
      // Create player as frameless (background) video
      const player = new window.Vimeo.Player(wrap, {
        url: videoUrl as VimeoUrl,
        background: true, // Frameless video without controls
        muted: true,
        autoplay: true,
        loop: shouldLoop,
      });

      await player.ready();
      await player.setCurrentTime(1); // Load first frame

      if (!shouldAutoplay) {
        await player.pause(); // Ensure paused initially
      }

      // Find toggle button(s) within the wrap or linked to it
      const toggleButtons = wrap.querySelectorAll(this.TOGGLE_BUTTON_SELECTOR);

      // Track playing states
      let isPlaying = shouldAutoplay;

      const setPlayState = (state: 'playing' | 'paused' | 'none') => {
        wrap.setAttribute(this.PLAY_STATE_ATTR, state);
        toggleButtons.forEach((btn) => btn.setAttribute(this.PLAY_STATE_ATTR, state));
      };

      // Play function
      const playVideo = async () => {
        if (isPlaying) return;

        // Pause any other currently playing video
        if (this.currentlyPlaying && this.currentlyPlaying !== wrap) {
          const instance = this.videoInstances.get(this.currentlyPlaying);
          if (instance?.pauseVideo) {
            await instance.pauseVideo();
          }
        }

        try {
          isPlaying = true;
          this.currentlyPlaying = wrap;
          setPlayState(this.PLAY_STATE_PLAYING);
          await player.setMuted(false);
          await player.setVolume(1);
          await player.play();
        } catch (err) {
          console.error('[InlineVimeoPlayer] Error playing video:', err);
          isPlaying = false;
          this.currentlyPlaying = null;
        }
      };

      // Pause function
      const pauseVideo = async () => {
        if (!isPlaying) return;
        isPlaying = false;
        if (this.currentlyPlaying === wrap) {
          this.currentlyPlaying = null;
        }
        setPlayState(this.PLAY_STATE_PAUSED);
        await player.pause();
      };

      // Toggle function
      const togglePlay = async (e?: Event) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (isPlaying) {
          await pauseVideo();
        } else {
          await playVideo();
        }
      };

      // Store functions for cross-instance calls
      this.videoInstances.set(wrap, { player, pauseVideo, playVideo });

      // Click handler on wrap
      wrap.addEventListener('click', () => togglePlay());

      // Click handler on toggle buttons
      toggleButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => togglePlay(e));
      });

      // Initialize state
      setPlayState(shouldAutoplay ? this.PLAY_STATE_PLAYING : this.PLAY_STATE_NONE);

      // Listen for video ending to reset state
      player.on('ended', () => {
        isPlaying = false;
        if (this.currentlyPlaying === wrap) {
          this.currentlyPlaying = null;
        }
        setPlayState(this.PLAY_STATE_NONE);
      });

      window.IS_DEBUG_MODE && console.debug('[InlineVimeoPlayer] Player initialized for', videoUrl);
    } catch (error) {
      console.error('[InlineVimeoPlayer] Error initializing video:', error);
    }
  }

  public destroy(): void {
    this.observer.disconnect();
    this.videoInstances.forEach((instance) => {
      try {
        instance.player?.destroy();
      } catch (err) {
        console.error('[InlineVimeoPlayer] Error destroying player:', err);
      }
    });
    this.videoInstances.clear();
  }
}

window.loadScript('https://player.vimeo.com/api/player.js', { name: 'vimeo-sdk' });

// Initialize session
window.Webflow = window.Webflow || [];
window.Webflow.push(() => {
  const init = () => new InlineVimeoPlayer();

  if (window.Vimeo?.Player) {
    init();
  } else {
    document.addEventListener('scriptLoaded:vimeo-sdk', init, { once: true });
  }
});
