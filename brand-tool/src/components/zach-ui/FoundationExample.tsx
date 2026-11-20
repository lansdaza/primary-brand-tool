'use client';

import { useId, useState } from 'react';
import { useDialKitController, type DialConfig } from 'dialkit';
import { MotionConfig } from 'motion/react';
import { Button, GraphicalProvider, theme, type ColorMode } from './graphical';
import { ToolFrame } from './ToolFrame';
import { ZachDialRoot } from './ZachDialRoot';

// Keep this object stable. Use a distinct, stable controller id in each tool.
// Color controls require resolved color strings, not CSS custom properties.
const controls = {
  shape: {
    type: 'select',
    options: [
      { value: 'circle', label: 'Circle' },
      { value: 'square', label: 'Square' },
      { value: 'diamond', label: 'Diamond' },
    ],
    default: 'square',
  },
  size: [144, 48, 208, 1],
  rotation: [0, -180, 180, 1],
  fill: { type: 'color', default: theme.theme.colors.light['neutral-10'] },
  outline: false,
  position: {
    type: 'pad',
    x: [0, -100, 100, 1],
    y: [0, -100, 100, 1],
    labels: { x: 'Horizontal', y: 'Vertical' },
  },
} satisfies DialConfig;

/**
 * A complete working example, intended to be adapted rather than layered into
 * an existing app unchanged. CSS imports belong in the app entry, in the order
 * documented in ZachDialRoot. The creative artboard stays white in both modes.
 */
export function FoundationExample() {
  const [colorMode, setColorMode] = useState<ColorMode>('light');
  return (
    <MotionConfig reducedMotion="user">
      <GraphicalProvider document={theme} colorMode={colorMode}>
        <ShapeStudio colorMode={colorMode} onModeChange={setColorMode} />
      </GraphicalProvider>
    </MotionConfig>
  );
}

function ShapeStudio({
  colorMode,
  onModeChange,
}: {
  colorMode: ColorMode;
  onModeChange: (mode: ColorMode) => void;
}) {
  const titleId = useId();
  const { values, resetValues } = useDialKitController('Shape', controls, {
    id: 'zach-tool-ui:foundation:shape',
    persist: false,
  });
  const half = values.size / 2;
  const drawingProps = {
    fill: values.outline ? 'none' : values.fill,
    stroke: values.outline ? values.fill : 'none',
    strokeWidth: 3,
  };
  const shapeName = values.shape.charAt(0).toUpperCase() + values.shape.slice(1);

  return (
    <ToolFrame
      title="Shape studio"
      toolbar={
        <>
          <Button variant="ghost" onClick={() => onModeChange(colorMode === 'light' ? 'dark' : 'light')}>
            {colorMode === 'light' ? 'Dark mode' : 'Light mode'}
          </Button>
          <Button variant="secondary" onClick={resetValues}>Reset</Button>
        </>
      }
      inspector={<ZachDialRoot />}
      canvasLabel="Shape preview"
      status={<span>{shapeName} · {values.size} px · {values.rotation}°</span>}
    >
      <div className="zach-example-artboard">
        <svg viewBox="0 0 480 480" role="img" aria-labelledby={titleId}>
          <title id={titleId}>
            {`${values.outline ? 'Outlined' : 'Filled'} ${values.shape}, ${values.size} pixels, rotated ${values.rotation} degrees, positioned at ${values.position.x}, ${values.position.y}`}
          </title>
          {/* DialKit pad Y increases upward; SVG Y increases downward. */}
          <g transform={`translate(${240 + values.position.x} ${240 - values.position.y}) rotate(${values.rotation})`}>
            {values.shape === 'circle' ? <circle r={half} {...drawingProps} /> : null}
            {values.shape === 'square' ? <rect x={-half} y={-half} width={values.size} height={values.size} {...drawingProps} /> : null}
            {values.shape === 'diamond' ? <polygon points={`0,${-half} ${half},0 0,${half} ${-half},0`} {...drawingProps} /> : null}
          </g>
        </svg>
      </div>
    </ToolFrame>
  );
}
