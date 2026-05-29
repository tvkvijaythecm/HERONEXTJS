'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import styles from '../styles/VideoIntro.module.css';

const CinematicLayer = dynamic(() => import('./CinematicLayer'), {
  ssr: false,
  loading: () => null,
});

export default function VideoIntro({ nextSectionId = 'about' }) {
  const videoRef     = useRef(null);
  const bgVideoRef   = useRef(null);
  const heroRef      = useRef(null);
  const contentRef   = useRef(null);
  const soundBadgeRef = useRef(null);

  const [muted,   setMuted]   = useState(true);
  const [playing, setPlaying] = useState(true);
  const [loaded,  setLoaded]  = useState(false);
  const [showSoundHint, setShowSoundHint] = useState(true);

  // ── GSAP entrance ──────────────────────────────────────────────
  useEffect(() => {
    if (!loaded) return;

    let gsap, ctx;
    import('gsap').then(({ gsap: g }) => {
      gsap = g;
      ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        // Staggered content entrance
        tl.fromTo('[data-anim="tagline"]',
          { opacity: 0, y: 28, letterSpacing: '0.45em' },
          { opacity: 1, y: 0,  letterSpacing: '0.32em', duration: 1.1 },
          0.3
        )
        .fromTo('[data-anim="name-first"]',
          { opacity: 0, y: 60, skewY: 3 },
          { opacity: 1, y: 0,  skewY: 0, duration: 1.3 },
          0.55
        )
        .fromTo('[data-anim="name-last"]',
          { opacity: 0, y: 60, skewY: 3 },
          { opacity: 1, y: 0,  skewY: 0, duration: 1.3 },
          0.72
        )
        .fromTo('[data-anim="role"]',
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0,  duration: 1.1 },
          1.0
        )
        .fromTo('[data-anim="divider"]',
          { scaleX: 0, opacity: 0 },
          { scaleX: 1, opacity: 1, duration: 1.0, ease: 'power2.inOut' },
          0.9
        )
        .fromTo('[data-anim="controls"]',
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0,  duration: 0.9 },
          1.2
        )
        .fromTo('[data-anim="scroll"]',
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0,  duration: 0.9 },
          1.5
        );
      }, contentRef);
    });

    return () => ctx?.revert();
  }, [loaded]);

  // Auto-hide sound hint
  useEffect(() => {
    if (!showSoundHint) return;
    const id = setTimeout(() => setShowSoundHint(false), 4500);
    return () => clearTimeout(id);
  }, [showSoundHint]);

  // ── Video ready ────────────────────────────────────────────────
  const handleCanPlay = useCallback(() => setLoaded(true), []);

  // ── Toggle mute ────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted) setShowSoundHint(false);
  }, []);

  // ── Toggle play/pause ──────────────────────────────────────────
  const togglePlay = useCallback(() => {
    const v  = videoRef.current;
    const bg = bgVideoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();  bg?.play();
      setPlaying(true);
    } else {
      v.pause(); bg?.pause();
      setPlaying(false);
    }
  }, []);

  // ── Scroll to next ─────────────────────────────────────────────
  const scrollToNext = useCallback(() => {
    const next = document.getElementById(nextSectionId);
    if (next) {
      next.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
    }
  }, [nextSectionId]);

  return (
    <section ref={heroRef} className={styles.hero} aria-label="Portfolio hero section">

      {/* ── Ambient blurred background video ── */}
      <div className={styles.bgVideoWrap} aria-hidden="true">
        <video
          ref={bgVideoRef}
          className={styles.bgVideo}
          src="/hero.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          tabIndex={-1}
        />
      </div>

      {/* ── Cinematic gradient overlays ── */}
      <div className={styles.overlayVignette}  aria-hidden="true" />
      <div className={styles.overlayGradLeft}  aria-hidden="true" />
      <div className={styles.overlayGradBottom}aria-hidden="true" />
      <div className={styles.overlayNoise}     aria-hidden="true" />

      {/* ── Foreground hero video ── */}
      <div className={`${styles.fgVideoWrap} ${loaded ? styles.fgLoaded : ''}`}>
        <video
          ref={videoRef}
          className={styles.fgVideo}
          src="/hero.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onCanPlay={handleCanPlay}
        />
        {/* Warm orange rim light effect */}
        <div className={styles.rimLight} aria-hidden="true" />
      </div>

      {/* ── Three.js cinematic particle layer ── */}
      <CinematicLayer />

      {/* ── Overlay content ── */}
      <div ref={contentRef} className={styles.content}>
        {/* Tagline */}
        <p
          data-anim="tagline"
          className={styles.tagline}
          style={{ opacity: 0 }}
        >
          Creative Developer &nbsp;·&nbsp; Digital Craftsman
        </p>

        {/* Name — stacked huge */}
        <div className={styles.nameBlock}>
          <h1
            data-anim="name-first"
            className={styles.nameFirst}
            style={{ opacity: 0 }}
          >
            ALEX
          </h1>

          {/* Horizontal divider between names */}
          <div
            data-anim="divider"
            className={styles.nameDivider}
            style={{ opacity: 0 }}
            aria-hidden="true"
          />

          <h1
            data-anim="name-last"
            className={styles.nameLast}
            style={{ opacity: 0 }}
          >
            MORGAN
          </h1>
        </div>

        {/* Role */}
        <p
          data-anim="role"
          className={styles.role}
          style={{ opacity: 0 }}
        >
          Full-Stack Engineer &nbsp;/&nbsp; Motion Designer &nbsp;/&nbsp; Creative Technologist
        </p>
      </div>

      {/* ── Glassmorphism video controls ── */}
      <div
        data-anim="controls"
        className={styles.controls}
        style={{ opacity: 0 }}
        role="group"
        aria-label="Video controls"
      >
        {/* Play / Pause */}
        <button
          className={styles.ctrlBtn}
          onClick={togglePlay}
          aria-label={playing ? 'Pause video' : 'Play video'}
          title={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            // Pause icon
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="5"  y="3" width="4" height="18" rx="1"/>
              <rect x="15" y="3" width="4" height="18" rx="1"/>
            </svg>
          ) : (
            // Play icon
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
          )}
        </button>

        <div className={styles.ctrlDivider} aria-hidden="true" />

        {/* Mute / Unmute */}
        <button
          className={styles.ctrlBtn}
          onClick={toggleMute}
          aria-label={muted ? 'Unmute video' : 'Mute video'}
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? (
            // Muted icon
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M11 5L6 9H2v6h4l5 4V5z"/>
              <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          ) : (
            // Speaker with waves
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="currentColor" stroke="none"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            </svg>
          )}
        </button>
      </div>

      {/* ── "Tap for sound" animated badge ── */}
      <div
        ref={soundBadgeRef}
        className={`${styles.soundBadge} ${!showSoundHint ? styles.soundBadgeHidden : ''}`}
        aria-live="polite"
        aria-label="Tap mute button for sound"
      >
        <span className={styles.soundPulse} aria-hidden="true" />
        <span className={styles.soundText}>Tap for sound</span>
      </div>

      {/* ── Scroll indicator ── */}
      <button
        data-anim="scroll"
        className={styles.scrollIndicator}
        onClick={scrollToNext}
        aria-label="Scroll to next section"
        style={{ opacity: 0 }}
      >
        <span className={styles.scrollLabel}>Scroll</span>
        <span className={styles.scrollTrack} aria-hidden="true">
          <span className={styles.scrollPulse} />
        </span>
      </button>

      {/* ── Film-frame corner accents ── */}
      <div className={styles.cornerTL} aria-hidden="true" />
      <div className={styles.cornerTR} aria-hidden="true" />
      <div className={styles.cornerBL} aria-hidden="true" />
      <div className={styles.cornerBR} aria-hidden="true" />
    </section>
  );
}
