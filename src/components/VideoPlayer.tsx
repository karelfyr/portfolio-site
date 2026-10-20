import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { motion } from 'motion/react'
import { muxStream } from '../lib/mux'
import { isWebKit } from '../lib/browser'
import { Icon } from './EmailActions'

const fmt = (s: number) => {
  const t = Math.max(0, Math.floor(s))
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`
}

const ease = [0.22, 1, 0.36, 1] as const
/** The viewer's volume is remembered between visits (a convenience – fine if storage is blocked). */
const VOLUME_KEY = 'reel-volume'
const savedVolume = () => {
  try {
    const v = parseFloat(localStorage.getItem(VOLUME_KEY) ?? '')
    return v >= 0 && v <= 1 ? v : 1
  } catch {
    return 1
  }
}

type Props = {
  /** Mux playback ID. */
  playbackId: string
  /** Still shown until the video is actually playing, so there's never a blank frame. */
  poster: string
  /** Shared-layout id: the screen grows out of the element with the same id (the title still). */
  layoutId?: string
  /** Seconds the screen takes to grow into place. */
  enter?: number
}

/**
 * Mux video in a plain <video> with our own controls underneath (pause, sound, timeline, time).
 * Streams adaptively (HLS): Safari plays it natively, other browsers through hls.js, which is
 * only loaded when needed. Playback starts right away – the picture grows out of the title still
 * while it begins – and clicking the picture pauses / plays.
 */
export function VideoPlayer({ playbackId, poster, layoutId, enter = 1 }: Props) {
  const video = useRef<HTMLVideoElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const fill = useRef<HTMLDivElement>(null)
  const timeText = useRef<HTMLSpanElement>(null)
  const scrubbing = useRef(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(savedVolume)
  const volumeBar = useRef<HTMLDivElement>(null)
  const draggingVolume = useRef(false)
  /** The video has started (it fades in over the still). */
  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(false)
  const [ended, setEnded] = useState(false)

  useEffect(() => {
    const v = video.current!
    v.volume = savedVolume()
    let cancelled = false
    let destroyHls = () => {}

    // Streaming starts at once; playback as the grow animation settles, so decoding the first
    // frames never competes with it (and stays within the click's ~1 s grace period for sound in
    // Safari). Opened by a click, so sound is normally allowed; if the browser still refuses,
    // play muted – the sound button below switches it on.
    const opened = performance.now()
    let timer = 0
    const start = () => {
      timer = window.setTimeout(play, Math.max(0, enter * 850 - (performance.now() - opened)))
    }
    const play = () =>
      v.play().catch(() => {
        if (cancelled) return
        v.muted = true
        setMuted(true)
        v.play().catch(() => {})
      })

    const src = muxStream(playbackId)
    // Safari / iPhone: native HLS (smoothest there). Elsewhere hls.js – some Chromium builds claim
    // native HLS via canPlayType but then fail to play it.
    if (isWebKit && v.canPlayType('application/vnd.apple.mpegurl')) {
      v.src = src
      start()
    } else {
      import('hls.js').then(({ default: Hls }) => {
        if (cancelled) return
        if (!Hls.isSupported()) {
          v.src = src
          start()
          return
        }
        // Quality is left to hls.js: it adapts to the connection and the size the video is shown at.
        const hls = new Hls({ capLevelToPlayerSize: true })
        hls.loadSource(src)
        hls.attachMedia(v)
        destroyHls = () => hls.destroy()
        start()
      })
    }

    // Keep the timeline in sync with playback.
    let frame = 0
    const tick = () => {
      if (!scrubbing.current && v.duration) {
        if (fill.current) fill.current.style.transform = `scaleX(${v.currentTime / v.duration})`
        if (timeText.current) timeText.current.textContent = `${fmt(v.currentTime)} / ${fmt(v.duration)}`
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      cancelAnimationFrame(frame)
      v.pause()
      destroyHls()
      v.removeAttribute('src')
      v.load()
    }
  }, [playbackId, enter])

  // Play / pause / replay – the button under the video, or a click on the picture.
  const togglePause = () => {
    const v = video.current
    if (!v || !playing) return
    if (ended) {
      v.currentTime = 0
      v.play()
    } else if (v.paused) v.play()
    else v.pause()
  }

  const toggleSound = () => {
    const v = video.current
    if (!v) return
    // Unmuting at zero volume would stay silent: come back at half.
    if (muted && v.volume === 0) v.volume = 0.5
    v.muted = !muted
  }

  const applyVolume = (level: number) => {
    const v = video.current
    if (!v) return
    v.volume = Math.min(1, Math.max(0, level))
    v.muted = v.volume === 0
  }

  // Click or drag along the volume line.
  const dragVolume = (e: PointerEvent) => {
    const r = volumeBar.current!.getBoundingClientRect()
    applyVolume((e.clientX - r.left) / r.width)
  }

  // Click or drag along the timeline to seek.
  const seek = (e: PointerEvent) => {
    const v = video.current
    const r = bar.current!.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
    if (fill.current) fill.current.style.transform = `scaleX(${ratio})`
    if (v?.duration) v.currentTime = ratio * v.duration
  }

  return (
    <div className="player">
      <motion.div
        className={`player__screen${playing && !ended ? ' is-playing' : ''}`}
        layoutId={layoutId}
        transition={{ duration: enter, ease }}
      >
        <img className="player__poster" src={poster} alt="" draggable={false} />
        <video
          ref={video}
          className="player__video"
          playsInline
          preload="auto"
          onClick={togglePause}
          onPlaying={() => {
            setPlaying(true)
            setPaused(false)
            setEnded(false)
          }}
          onPause={(e) => !e.currentTarget.ended && setPaused(true)}
          onEnded={() => setEnded(true)} // fades back to the still
          onVolumeChange={(e) => {
            const v = e.currentTarget
            setMuted(v.muted)
            setVolume(v.volume)
            try {
              if (v.volume > 0) localStorage.setItem(VOLUME_KEY, String(v.volume))
            } catch {
              /* storage blocked: nothing to remember */
            }
          }}
        />
        {/* Only before the video first appears: it's buffering behind the still */}
        {!playing && (
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
        <button className="player__icon" onClick={togglePause} aria-label={ended ? 'Replay' : paused ? 'Play' : 'Pause'}>
          <Icon name={ended ? 'replay' : paused ? 'play' : 'pause'} size={18} />
        </button>
        <button className="player__icon" onClick={toggleSound} aria-label={muted ? 'Turn sound on' : 'Turn sound off'}>
          <Icon name={muted || volume === 0 ? 'mute' : volume < 0.5 ? 'soundLow' : 'sound'} size={18} />
        </button>
        {/* Volume (devices with a mouse; phones use their own volume buttons) */}
        <div
          className="player__bar player__bar--volume"
          ref={volumeBar}
          role="slider"
          tabIndex={0}
          aria-label="Volume"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round((muted ? 0 : volume) * 100)}
          onPointerDown={(e) => {
            draggingVolume.current = true
            volumeBar.current!.setPointerCapture(e.pointerId)
            dragVolume(e)
          }}
          onPointerMove={(e) => draggingVolume.current && dragVolume(e)}
          onPointerUp={() => (draggingVolume.current = false)}
          onPointerCancel={() => (draggingVolume.current = false)}
          onKeyDown={(e) => {
            const step = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 0.1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -0.1 : 0
            if (!step) return
            e.preventDefault()
            applyVolume((muted ? 0 : volume) + step)
          }}
        >
          <div className="player__fill" style={{ transform: `scaleX(${muted ? 0 : volume})` }} />
        </div>
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
