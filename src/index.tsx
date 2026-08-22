import {
  forwardRef,
  memo,
  useEffect,
  useId,
  useMemo,
  useState,
  type ComponentPropsWithoutRef,
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

/**
 * Attributes the component works out for itself.
 *
 * They are removed from the prop type rather than silently overwritten, so
 * passing `aria-label` is a type error that points at `announce` instead of a
 * value that quietly does nothing.
 */
type Owned =
  | 'children'
  | 'role'
  | 'aria-label'
  | 'aria-labelledby'
  | 'aria-valuenow'
  | 'aria-valuemin'
  | 'aria-valuemax';

export interface OctoLoaderProps extends Omit<ComponentPropsWithoutRef<'div'>, Owned> {
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
   * Wrap it in a panel — a hairline border, a radius and room to breathe — so
   * the loader marks out which region of the page is waiting. Spans its
   * container; give it a `maxWidth` to hold it in.
   *
   * Retuned by `--octo-frame`, `--octo-frame-radius`,
   * `--octo-frame-min-height` and `--octo-frame-padding`.
   */
  frame?: boolean;
  /**
   * A quieter second line under the label — what the wait is for, or how long
   * it usually takes. Gives the panel the title-and-description hierarchy an
   * empty state has, and makes the label read as the title.
   */
  description?: ReactNode;
  /**
   * Overrides the accessible name. Without it the visible label is the name,
   * and a loader with no label announces as "Loading".
   */
  announce?: string;
}

const wrapperStyle: CSSProperties = {
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.75em',
};

/**
 * The panel a loading state sits in.
 *
 * It spans its container rather than hugging the octopus, because the panel's
 * job is to outline the region the content will land in — a box drawn tight
 * around the animal reads as a badge instead. A neutral grey at low alpha
 * rather than `currentColor`, so one value holds on a light page and a dark
 * one.
 */
const frameStyle: CSSProperties = {
  display: 'flex',
  width: '100%',
  boxSizing: 'border-box',
  justifyContent: 'center',
  // A floor rather than a fixed height: the panel has to keep its presence
  // when it is only carrying a 30px sprite, and still grow for a long label.
  minHeight: 'var(--octo-frame-min-height, 13rem)',
  padding: 'var(--octo-frame-padding, 3rem)',
  border: '1px solid var(--octo-frame, rgba(128,128,128,0.2))',
  borderRadius: 'var(--octo-frame-radius, 0.5rem)',
};

/** With a description under it, the label becomes the heading of the pair. */
const titleStyle: CSSProperties = { fontSize: '1.125em', fontWeight: 500 };

/** Quieter and smaller, the way a description sits under a title. */
const descriptionStyle: CSSProperties = {
  fontSize: '0.875em',
  opacity: 0.72,
  marginTop: '-0.25em',
  maxWidth: '32em',
  textAlign: 'center',
};

/**
 * A pixel-art octopus that swims while you wait.
 *
 * @example
 * ```tsx
 * <OctoLoader delay={1000} announce="Loading pull requests" />
 * <OctoLoader variant="mono" progress={done / total} label={`${done} of ${total}`} />
 * <OctoLoader frame style={{ maxWidth: 420 }} />
 * ```
 */
export const OctoLoader = memo(
  forwardRef<HTMLDivElement, OctoLoaderProps>(function OctoLoader(
    {
      variant = 'color',
      label = 'One moment please…',
      size = 60,
      speed = 1,
      delay = 0,
      progress,
      bubbles = true,
      frame = false,
      description,
      announce,
      className,
      style,
      ...rest
    },
    ref,
  ) {
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

    const uid = useId();
    const labelId = `${uid}label`;
    const descriptionId = `${uid}description`;
    const hasLabel = label !== null && label !== undefined && label !== '';
    const hasDescription = description !== null && description !== undefined && description !== '';
    const determinate = typeof progress === 'number' && Number.isFinite(progress);
    const percent = determinate ? Math.round(Math.min(1, Math.max(0, progress)) * 100) : undefined;

    const headroom = bubbles ? BUBBLE_HEADROOM : 0;
    const viewHeight = VIEW_HEIGHT + headroom + (determinate ? BAR_ROOM : 0);

    if (!waited) return null;

    return (
      <div
        {...rest}
        ref={ref}
        // A determinate indicator carries its value instead of announcing once.
        role={determinate ? 'progressbar' : 'status'}
        aria-valuenow={percent}
        aria-valuemin={determinate ? 0 : undefined}
        aria-valuemax={determinate ? 100 : undefined}
        // Primer prefers naming the region from the text people can see.
        aria-labelledby={!announce && hasLabel ? labelId : undefined}
        aria-label={announce ?? (hasLabel ? undefined : 'Loading')}
        aria-describedby={hasDescription ? descriptionId : undefined}
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
        {/*
        Outside the <svg> on purpose. SVG styles are document-global anyway, so
        a copy per instance was pure waste — and React only hoists and
        de-duplicates a <style> in the HTML namespace. On React 19 a page of
        loaders shares one; on 17 and 18 it falls back to a copy each, which is
        what it always did.
      */}
        <style href="octoloader" precedence="default">
          {CSS}
        </style>
        <svg
          width={size}
          height={Math.round((size * viewHeight) / SPRITE_WIDTH)}
          viewBox={`0 ${-headroom} ${SPRITE_WIDTH} ${viewHeight}`}
          shapeRendering="crispEdges"
          aria-hidden="true"
          focusable="false"
        >
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
          // The label only takes on weight when there is a description under
          // it to be the title of. On its own it stays a plain caption.
          <span id={labelId} aria-hidden="true" style={hasDescription ? titleStyle : undefined}>
            {label}
          </span>
        ) : null}
        {hasDescription ? (
          <span id={descriptionId} aria-hidden="true" style={descriptionStyle}>
            {description}
          </span>
        ) : null}
      </div>
    );
  }),
);

OctoLoader.displayName = 'OctoLoader';

function paths(specs: PathSpec[]) {
  return specs.map((p) => <path key={p.fill} fill={p.fill} d={p.d} />);
}

export default OctoLoader;
