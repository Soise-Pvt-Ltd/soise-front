'use client';

import { ReactNode } from 'react';
import {
  motion,
  useInView,
  useReducedMotion,
  AnimatePresence,
  type Variants,
  type Transition,
} from 'framer-motion';
import { useRef } from 'react';

/* ──────────────────────────────────────────────
   SHARED EASINGS & TRANSITIONS
   ────────────────────────────────────────────── */

const smooth: Transition = { duration: 0.7, ease: [0.22, 1, 0.36, 1] };
const snappy: Transition = { duration: 0.5, ease: [0.16, 1, 0.3, 1] };
const gentle: Transition = { duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] };

/* ──────────────────────────────────────────────
   FADE IN (scroll‑triggered)
   ────────────────────────────────────────────── */

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  duration?: number;
  once?: boolean;
  threshold?: number;
}

export function FadeIn({
  children,
  className,
  delay = 0,
  direction = 'up',
  distance = 40,
  duration = 0.7,
  once = true,
  threshold = 0.15,
}: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, amount: threshold });
  const prefersReducedMotion = useReducedMotion();

  const directionMap = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
    none: {},
  };

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, ...directionMap[direction] }}
      animate={
        isInView
          ? { opacity: 1, x: 0, y: 0 }
          : { opacity: 0, ...directionMap[direction] }
      }
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   STAGGER CHILDREN (scroll‑triggered container)
   ────────────────────────────────────────────── */

interface StaggerChildrenProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  once?: boolean;
  threshold?: number;
}

const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export function StaggerChildren({
  children,
  className,
  staggerDelay = 0.12,
  once = true,
  threshold = 0.1,
}: StaggerChildrenProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, amount: threshold });

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: 0.1,
          },
        },
      }}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={staggerItemVariants}>
      {children}
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   REVEAL TEXT (character-by-character or word)
   ────────────────────────────────────────────── */

interface RevealTextProps {
  text: string;
  className?: string;
  delay?: number;
  once?: boolean;
}

export function RevealText({
  text,
  className,
  delay = 0,
  once = true,
}: RevealTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, amount: 0.5 });
  const prefersReducedMotion = useReducedMotion();

  const words = text.split(' ');

  if (prefersReducedMotion) {
    return <div className={className}>{text}</div>;
  }

  return (
    <motion.div ref={ref} className={className} aria-label={text}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{
            duration: 0.5,
            delay: delay + i * 0.08,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {word}
          {i < words.length - 1 && '\u00A0'}
        </motion.span>
      ))}
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   SCALE ON HOVER (for cards, images)
   ────────────────────────────────────────────── */

interface ScaleOnHoverProps {
  children: ReactNode;
  className?: string;
  scale?: number;
}

export function ScaleOnHover({
  children,
  className,
  scale = 1.03,
}: ScaleOnHoverProps) {
  return (
    <motion.div
      className={className}
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      transition={snappy}
    >
      {children}
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   MAGNETIC BUTTON (subtle follow-cursor effect)
   ────────────────────────────────────────────── */

interface MagneticProps {
  children: ReactNode;
  className?: string;
}

export function Magnetic({ children, className }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
  };

  const handleMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'translate(0px, 0px)';
    el.style.transition = 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)';
  };

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transition: 'transform 0.15s ease-out' }}
    >
      {children}
    </div>
  );
}

/* ──────────────────────────────────────────────
   SLIDE PANEL (for fullscreen overlays)
   ────────────────────────────────────────────── */

interface SlidePanelProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  direction?: 'left' | 'right';
  className?: string;
}

export function SlidePanel({
  children,
  isOpen,
  onClose,
  direction = 'right',
  className,
}: SlidePanelProps) {
  const xInitial = direction === 'right' ? '100%' : '-100%';

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />
          <motion.div
            className={`fixed inset-0 z-50 ${className || ''}`}
            initial={{ x: xInitial }}
            animate={{ x: 0 }}
            exit={{ x: xInitial }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
              mass: 0.8,
            }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ──────────────────────────────────────────────
   PARALLAX IMAGE
   ────────────────────────────────────────────── */

interface ParallaxProps {
  children: ReactNode;
  className?: string;
  offset?: number;
}

export function Parallax({
  children,
  className,
  offset = 50,
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ y: 0 }}
      whileInView={{ y: -offset }}
      viewport={{ once: false, amount: 0.3 }}
      transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   IMAGE REVEAL (clip-path wipe)
   ────────────────────────────────────────────── */

interface ImageRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'left' | 'right' | 'up' | 'down';
}

export function ImageReveal({
  children,
  className,
  delay = 0,
  direction = 'up',
}: ImageRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const clipPaths: Record<string, { hidden: string; visible: string }> = {
    up: {
      hidden: 'inset(100% 0% 0% 0%)',
      visible: 'inset(0% 0% 0% 0%)',
    },
    down: {
      hidden: 'inset(0% 0% 100% 0%)',
      visible: 'inset(0% 0% 0% 0%)',
    },
    left: {
      hidden: 'inset(0% 100% 0% 0%)',
      visible: 'inset(0% 0% 0% 0%)',
    },
    right: {
      hidden: 'inset(0% 0% 0% 100%)',
      visible: 'inset(0% 0% 0% 0%)',
    },
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ clipPath: clipPaths[direction].hidden }}
      animate={
        isInView
          ? { clipPath: clipPaths[direction].visible }
          : { clipPath: clipPaths[direction].hidden }
      }
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   RE-EXPORTS for convenience
   ────────────────────────────────────────────── */

export { motion, AnimatePresence };
