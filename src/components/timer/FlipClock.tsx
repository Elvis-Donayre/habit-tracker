import { useState, useEffect } from 'react';

const BG_TOP = '#1e1e21';
const BG_BOT = '#18181b';
const NUM_STYLE: React.CSSProperties = {
  fontSize: 'clamp(78px, 18vmin, 200px)',
  fontWeight: 900,
  color: '#f0f0f0',
  lineHeight: 1,
  letterSpacing: '-0.03em',
  fontVariantNumeric: 'tabular-nums',
  userSelect: 'none',
};

/**
 * Render the number centered across the FULL card height, not just the half.
 * The half container (height=50%) clips what's outside, so each half shows
 * only its portion of the number — top or bottom half — as in a real flip clock.
 *
 * isTop=true  → wrapper top:0, inner div height:200% → clips bottom half
 * isTop=false → wrapper top:-100%, inner div height:200% → clips top half
 */
function NumHalf({ val, isTop, bg, radius, style }: {
  val: string;
  isTop: boolean;
  bg: string;
  radius: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        width: '100%',
        height: '50%',
        overflow: 'hidden',
        background: bg,
        borderRadius: radius,
        top: isTop ? 0 : '50%',
        ...style,
      }}
    >
      {/* Inner div spans the full card height (200% of this half-container).
          Number is centered in it, so the dividing line bisects the digit. */}
      <div
        style={{
          position: 'absolute',
          top: isTop ? 0 : '-100%',
          left: 0,
          width: '100%',
          height: '200%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={NUM_STYLE}>{val}</span>
      </div>
    </div>
  );
}

function FlipDigit({ digit }: { digit: string }) {
  const [current, setCurrent] = useState(digit);
  const [prev, setPrev] = useState(digit);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (digit !== current) {
      setPrev(current);
      setCurrent(digit);
      setAnimKey((k) => k + 1);
    }
  }, [digit, current]);

  const R_TOP = 'clamp(6px, 1.2vmin, 14px) clamp(6px, 1.2vmin, 14px) 0 0';
  const R_BOT = '0 0 clamp(6px, 1.2vmin, 14px) clamp(6px, 1.2vmin, 14px)';

  return (
    <div
      style={{
        position: 'relative',
        width: 'clamp(58px, 13.5vmin, 152px)',
        height: 'clamp(96px, 22vmin, 250px)',
        perspective: '700px',
        flexShrink: 0,
      }}
    >
      {/* Static upper: top of CURRENT digit (revealed after flip) */}
      <NumHalf val={current} isTop bg={BG_TOP} radius={R_TOP} />

      {/* Static lower: bottom of PREV digit (visible before flip completes) */}
      <NumHalf val={prev} isTop={false} bg={BG_BOT} radius={R_BOT} />

      {/* Animated upper flap: top of PREV, rotates down (-90deg) */}
      {animKey > 0 && (
        <NumHalf
          key={`t-${animKey}`}
          val={prev}
          isTop
          bg={BG_TOP}
          radius={R_TOP}
          style={{
            transformOrigin: 'bottom center',
            animation: 'flipTop 0.22s ease-in forwards',
            zIndex: 2,
            backfaceVisibility: 'hidden',
          }}
        />
      )}

      {/* Animated lower flap: bottom of CURRENT, reveals (90deg → 0) */}
      {animKey > 0 && (
        <NumHalf
          key={`b-${animKey}`}
          val={current}
          isTop={false}
          bg={BG_BOT}
          radius={R_BOT}
          style={{
            transformOrigin: 'top center',
            animation: 'flipBottom 0.22s ease-out 0.22s both',
            zIndex: 2,
            backfaceVisibility: 'hidden',
          }}
        />
      )}

      {/* Center divider line */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(50% - 1px)',
          left: 0,
          width: '100%',
          height: '2px',
          background: '#000',
          zIndex: 6,
        }}
      />

      {/* Depth shadow on lower half */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          width: '100%',
          height: '14px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), transparent)',
          zIndex: 5,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

function parseTime(time: string): [string, string, string, string] {
  const parts = time.split(':');
  const mm = (parts.length === 3 ? parts[1] : parts[0] ?? '00').padStart(2, '0');
  const ss = (parts.length === 3 ? parts[2] : parts[1] ?? '00').padStart(2, '0');
  return [mm[0], mm[1], ss[0], ss[1]];
}

export function FlipClock({ time }: { time: string }) {
  const [d0, d1, d2, d3] = parseTime(time);
  const dotSize = 'clamp(5px, 1vmin, 10px)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(4px, 0.8vmin, 10px)' }}>
      <FlipDigit digit={d0} />
      <FlipDigit digit={d1} />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(6px, 1.4vmin, 16px)',
          marginBottom: '4px',
          flexShrink: 0,
        }}
      >
        <div style={{ width: dotSize, height: dotSize, borderRadius: '50%', background: '#444' }} />
        <div style={{ width: dotSize, height: dotSize, borderRadius: '50%', background: '#444' }} />
      </div>

      <FlipDigit digit={d2} />
      <FlipDigit digit={d3} />
    </div>
  );
}
