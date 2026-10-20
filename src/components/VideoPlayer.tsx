import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { motion } from 'motion/react'
import { loadYouTube, type YTPlayer } from '../lib/youtube'

const fmt = (s: number) => {
  const t = Math.max(0, Math.floor(s))
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`
}

const ease = [0.22, 1, 0.36, 1] as const
/** ms the video plays hidden and muted (buffering) before it's shown from 0:00. */
const REVEAL_DELAY = 2000
/** A pause this soon after the reveal is the browser refusing sound, not the viewer (ms). */
const SOUND_BLOCK_WINDOW = 1500

type Props = {
  videoId: string
  /** Still shown until the video is actually playing, so there's never a blank/white frame. */
  poster: string
  /** Shared-layout id: the screen grows out of the element with the same id (the title still). */
  layoutId?: string
  /** Seconds the screen takes to grow into place; YouTube loads only after that, to keep it smooth. */
  enter?: number
}

/**
 * YouTube video with our controls underneath (pause, sound, timeline, time).
 * On the picture YouTube's own click-to-pause and play/pause icon work as usual; its title
 * bar and logo are cropped away (see .player__mount in index.css).
 */
export function VideoPlayer({ videoId, poster, layoutId, enter = 1 }: Props) {
  const mount = useRef<HTMLDivElement>(null)
  const player = useRef<YTPlayer | null>(null)
  const bar = useRef<HTMLDivElement>(null)
  const fill = useRef<HTMLDivElement>(null)
  const timeText = useRef<HTMLSpanElement>(null)
  const scrubbing = useRef(false)
  const [muted, setMuted] = useState(false)
  /** The video is visible (after the hidden warm-up). */
  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(false)
  const [ended, setEnded] = useState(false)
  const reveal = useRef(0)
  /** When the video was shown (ms), to tell a browser sound-block from a viewer pause. */
  const shownAt = useRef(0)
  /** Set once the hidden warm-up is done and the video has been shown. */
  const shown = useRef(false)
  /** The sound setting the viewer wants (the warm-up itself always runs muted). */
  const wantSound = useRef(true)

  useEffect(() => {
    let frame = 0
    let cancelled = false
    const host = document.createElement('div')
    mount.current!.appendChild(host)

    const show = (p: YTPlayer, withSound: boolean) => {
      if (withSound) p.unMute()
      setMuted(!withSound)
      wantSound.current = withSound
      shown.current = true
      shownAt.current = performance.now()
      setPlaying(true)
    }

    // Wait for the grow animation to finish before loading YouTube, so it never stutters.
    const start = window.setTimeout(() => loadYouTube().then((YT) => {
      if (cancelled) return
      player.current = new YT.Player(host, {
        videoId,
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
          autoplay: 1,
          mute: 1, // warm up silently (muted autoplay is always allowed); sound comes on at reveal
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          playsinline: 1,
          iv_load_policy: 3,
          cc_load_policy: 0,
          modestbranding: 1,
          vq: 'hd2160', // 4K, in the embed link; YouTube may still adapt to the connection
        },
        events: {
          onReady: ({ target }) => {
            target.setPlaybackQuality?.('hd2160')
            hideSubs(target) // no subtitles: YouTube draws them where its interface is cropped away
            // autoplay=1 starts it; only nudge if the browser didn't.
            window.setTimeout(() => {
              if (!cancelled && target.getPlayerState() !== YT.PlayerState.PLAYING) target.playVideo()
            }, 1500)
            // Still not playing: show YouTube's own player (with its play button) rather than wait.
            window.setTimeout(() => {
              if (!cancelled && !shown.current) show(target, false)
            }, 6000)
          },
          onStateChange: ({ data }) => {
            const p = player.current!
            if (data === YT.PlayerState.PLAYING) {
              setPaused(false)
              setEnded(false)
              // YouTube can switch auto-captions back on when playback starts.
              hideSubs(p)
              if (!shown.current) {
                // Warm-up done: back to the start, sound on, fade in — so it begins at 0:00
                // with the video already loaded.
                window.clearTimeout(reveal.current)
                reveal.current = window.setTimeout(() => {
                  if (cancelled) return
                  p.seekTo(0, true)
                  show(p, wantSound.current)
                }, REVEAL_DELAY)
              }
            }
            if (data === YT.PlayerState.PAUSED && shown.current) {
              if (performance.now() - shownAt.current < SOUND_BLOCK_WINDOW && !p.isMuted()) {
                // The browser (Safari) refused to turn the sound on without a click and paused
                // it: carry on muted — "Sound off" below can switch it on.
                p.mute()
                p.playVideo()
                wantSound.current = false
                setMuted(true)
              } else setPaused(true)
            }
            if (data === YT.PlayerState.ENDED) {
              // Fade back to the still (and away from YouTube's end screen).
              setPlaying(false)
              setEnded(true)
            }
          },
        },
      })
    }), enter * 1000)

    // Keep the timeline in sync with playback (it stays at 0:00 during the hidden warm-up).
    const tick = () => {
      const p = player.current
      if (p?.getDuration && shown.current && !scrubbing.current) {
        const d = p.getDuration() || 0
        const t = p.getCurrentTime() || 0
        if (fill.current) fill.current.style.transform = `scaleX(${d ? t / d : 0})`
        if (timeText.current) timeText.current.textContent = `${fmt(t)} / ${fmt(d)}`
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    return () => {
      cancelled = true
      window.clearTimeout(start)
      window.clearTimeout(reveal.current)
      cancelAnimationFrame(frame)
      player.current?.destroy()
      player.current = null
    }
  }, [videoId, enter])

  const hideSubs = (p: YTPlayer) => {
    p.unloadModule?.('captions')
    p.unloadModule?.('cc')
  }

  // Play / pause / replay from the button under the video.
  const togglePause = () => {
    const p = player.current
    if (!p || !shown.current) return
    if (ended) {
      p.seekTo(0, true)
      p.playVideo()
      setPlaying(true)
    } else if (paused) {
      if (wantSound.current) p.unMute() // inside a click, so the browser allows sound
      p.playVideo()
    } else p.pauseVideo()
  }

  const toggleSound = () => {
    wantSound.current = muted
    setMuted(!muted)
    const p = player.current
    if (!p || !shown.current) return // applied when the video is revealed
    if (wantSound.current) p.unMute()
    else p.mute()
  }

  // Click or drag along the timeline to seek.
  const seek = (e: PointerEvent) => {
    const p = player.current
    const r = bar.current!.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
    if (fill.current) fill.current.style.transform = `scaleX(${ratio})`
    if (p) p.seekTo(ratio * p.getDuration(), true)
  }

  return (
    <div className="player">
      <motion.div
        className={`player__screen${playing ? ' is-playing' : ''}`}
        layoutId={layoutId}
        transition={{ duration: enter, ease }}
      >
        <img className="player__poster" src={poster} alt="" draggable={false} />
        <div className="player__mount" ref={mount} />
        {/* Only before the video first appears: it's buffering behind the still */}
        {!playing && !ended && (
          <span className="player__loading label" role="status">
            <span className="player__spinner" aria-hidden />
            Loading
          </span>
        )}
      </motion.div>
      <motion.div
        className="player__controls"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease, delay: enter * 0.8 }}
      >
        <button className="label player__toggle player__pause" onClick={togglePause}>
          {ended ? 'Replay' : paused ? 'Play' : 'Pause'}
        </button>
        <button className="label player__toggle" onClick={toggleSound} aria-pressed={!muted}>
          {muted ? 'Sound off' : 'Sound on'}
        </button>
        <div
          className="player__bar"
          ref={bar}
          role="slider"
          aria-label="Timeline"
          onPointerDown={(e) => {
            scrubbing.current = true
            bar.current!.setPointerCapture(e.pointerId)
            seek(e)
          }}
          onPointerMove={(e) => scrubbing.current && seek(e)}
          onPointerUp={() => (scrubbing.current = false)}
          onPointerCancel={() => (scrubbing.current = false)}
        >
          <div className="player__fill" ref={fill} />
        </div>
        <span className="label player__time" ref={timeText}>0:00 / 0:00</span>
      </motion.div>
    </div>
  )
}
