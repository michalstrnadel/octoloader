import {
  useEffect,
  useId,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {
  BUBBLES,
  COLOR_PALETTE,
  FRAMES,
  FRAME_BLINK,
  FRAME_LOOK_LEFT,
  FRAME_LOOK_RIGHT,
  MONO_PALETTE,
  SPRITE_WIDTH,
} from './sprite.js';
import {
  BAR_ROOM,
  BUBBLE_HEADROOM,
  CSS,
  VIEW_HEIGHT,
  diff,
  progressBar,
  stripPaths,
  toPaths,
  type PathSpec,
} from './render.js';

export * from './sprite.js';
export {
  toPaths,
  stripPaths,
  diff,
  progressBar,
  animationCss,
  VIEW_HEIGHT,
  BUBBLE_HEADROOM,
  BAR_ROOM,
  BAR_STEPS,
} from './render.js';

export interface OctoLoaderProps {
  /** `color` is the character as drawn; `mono` follows `currentColor`. */
  variant?: 'color' | 'mono';
  /** Text under the octopus. Pass `null` for the sprite on its own. */
  label?: ReactNode;
  /**
   * Rendered width in px. Height follows the sprite's aspect ratio.
   * Multiples of {@link SPRITE_WIDTH} (30) keep every pixel square.
   */
  size?: number;
  /** Multiplier on every clock. 2 is twice as fast. */
  speed?: number;
  /**
   * Milliseconds to stay invisible before appearing.
   *
   * A wait under a second should show nothing at all — an indicator that
   * flashes up and vanishes reads as a glitch, not as progress. Set this to
   * 1000 for anything that usually finishes fast and the loader only appears
   * when the wait is real.
   */
  delay?: number;
  /**
   * `0`–`1` turns the loader determinate and draws a bar under the animal.
   * Leave it off while the finish time is unknown.
   */
  progress?: number;
  /** Bubbles drifting up past the animal's left side. Adds headroom above it. */
  bubbles?: boolean;
  /**
   * Wrap it in an empty-state panel — a hairline border, a radius and room to
   * breathe. Spans its container, the way an empty state does; give it a
   * `maxWidth` to hold it in. Colour and radius are `--octo-frame` and
   * `--octo-frame-radius`.
   */
  frame?: boolean;
  /**
   * Overrides the accessible name. Without it the visible label is the name,
   * and a loader with no label announces as "Loading".
   */
  announce?: string;
  className?: string;
  style?: CSSProperties;
}

const wrapperStyle: CSSProperties = {
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.75em',
};

/**
 * The panel an empty state sits in.
 *
 * It spans its container rather than hugging the octopus, because a box drawn
 * tight around the content reads as a badge, not as the space where something
 * is about to appear. A neutral grey at low alpha rather than `currentColor`,
 * so one value holds on a light page and a dark one.
 */
const frameStyle: CSSProperties = {
  display: 'flex',
  width: '100%',
  boxSizing: 'border-box',
  justifyContent: 'center',
  padding: '2em 2.5em',
  border: '1px solid var(--octo-frame, rgba(128,128,128,0.28))',
  borderRadius: 'var(--octo-frame-radius, 6px)',
};

export function OctoLoader({
  variant = 'color',
  label = 'One moment please…',
  size = 60,
  speed = 1,
  delay = 0,
  progress,
  bubbles = true,
  frame = false,
  announce,
  className,
  style,
}: OctoLoaderProps) {
  const { strip, overlays, palette } = useMemo(() => {
    const p = variant === 'mono' ? MONO_PALETTE : COLOR_PALETTE;
    const patch = (grid: typeof FRAME_BLINK) => toPaths(diff(FRAMES[0], grid), p);
    return {
      // Laid out side by side. The strip slides; the viewBox does not.
      strip: stripPaths(FRAMES, p),
      overlays: {
        left: patch(FRAME_LOOK_LEFT),
        right: patch(FRAME_LOOK_RIGHT),
        lid: patch(FRAME_BLINK),
      },
      palette: p,
    };
  }, [variant]);

  const [waited, setWaited] = useState(() => !(delay > 0));
  useEffect(() => {
    if (!(delay > 0)) {
      setWaited(true);
      return;
    }
    setWaited(false);
    const timer = setTimeout(() => setWaited(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const labelId = `${useId()}label`;
  const hasLabel = label !== null && label !== undefined && label !== '';
  const determinate = typeof progress === 'number' && Number.isFinite(progress);
  const percent = determinate ? Math.round(Math.min(1, Math.max(0, progress)) * 100) : undefined;

  const headroom = bubbles ? BUBBLE_HEADROOM : 0;
  const viewHeight = VIEW_HEIGHT + headroom + (determinate ? BAR_ROOM : 0);

  if (!waited) return null;

  return (
    <div
      // A determinate indicator carries its value instead of announcing once.
      role={determinate ? 'progressbar' : 'status'}
      aria-valuenow={percent}
      aria-valuemin={determinate ? 0 : undefined}
      aria-valuemax={determinate ? 100 : undefined}
      // Primer prefers naming the region from the text people can see.
      aria-labelledby={!announce && hasLabel ? labelId : undefined}
      aria-label={announce ?? (hasLabel ? undefined : 'Loading')}
      className={className}
      style={{
        ...wrapperStyle,
        ...(frame ? frameStyle : null),
        ['--octo-swim' as string]: `${0.9 / speed}s`,
        ['--octo-blink' as string]: `${4.6 / speed}s`,
        ['--octo-glance' as string]: `${7.3 / speed}s`,
        ['--octo-rate' as string]: speed,
        ...style,
      }}
    >
      <svg
        width={size}
        height={Math.round((size * viewHeight) / SPRITE_WIDTH)}
        viewBox={`0 ${-headroom} ${SPRITE_WIDTH} ${viewHeight}`}
        shapeRendering="crispEdges"
        aria-hidden="true"
        focusable="false"
      >
        <style>{CSS}</style>
        <g className="octo-body">
          <g className="octo-bob">
            <g className="octo-strip">{paths(strip)}</g>
            {/* The eyelids close over whichever way the eyes are looking. */}
            <g className="octo-look octo-look-left">{paths(overlays.left)}</g>
            <g className="octo-look octo-look-right">{paths(overlays.right)}</g>
            <g className="octo-lid">{paths(overlays.lid)}</g>
          </g>
          {bubbles
            ? BUBBLES.map((b, i) => (
                <rect
                  key={i}
                  className={`octo-bubble octo-bubble-${i}`}
                  x={b.x}
                  y={b.y}
                  width={b.size}
                  height={b.size}
                  fill={palette.B ?? 'currentColor'}
                />
              ))
            : null}
        </g>
        {/* Outside octo-body, so the reduced-motion pulse leaves it alone. */}
        {determinate ? (
          <g className="octo-bar">
            {progressBar(progress, palette).map((r, i) => (
              <rect key={i} x={r.x} y={r.y} width={r.width} height={r.height} fill={r.fill} />
            ))}
          </g>
        ) : null}
      </svg>
      {hasLabel ? (
        <span id={labelId} aria-hidden="true">
          {label}
        </span>
      ) : null}
    </div>
  );
}

function paths(specs: PathSpec[]) {
  return specs.map((p) => <path key={p.fill} fill={p.fill} d={p.d} />);
}

export default OctoLoader;
