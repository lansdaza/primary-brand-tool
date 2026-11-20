'use client';

import { useId, type ReactNode } from 'react';

export interface ToolFrameProps {
  title: string;
  children: ReactNode;
  description?: string;
  navigation?: ReactNode;
  navigationLabel?: string;
  toolbar?: ReactNode;
  inspector?: ReactNode;
  inspectorLabel?: string;
  status?: ReactNode;
  canvasLabel?: string;
}

/**
 * Compose inside GraphicalProvider; import layout.css once at the app entry.
 * Put real links in navigation, real actions in toolbar, and one ZachDialRoot
 * in inspector. Omit slots that the current tool does not need.
 */
export function ToolFrame({
  title,
  children,
  description,
  navigation,
  navigationLabel = 'Tools',
  toolbar,
  inspector,
  inspectorLabel = 'Controls',
  status,
  canvasLabel = 'Preview',
}: ToolFrameProps) {
  const headingId = useId();
  const canvasId = useId();
  return (
    <div className="zach-tool-frame">
      <a className="zach-tool-skip" href={`#${canvasId}`}>Skip to preview</a>
      <header className="zach-tool-header">
        <div className="zach-tool-heading">
          <h1 id={headingId}>{title}</h1>
          {description ? <p>{description}</p> : null}
        </div>
        {toolbar ? <div className="zach-tool-actions" role="group" aria-label="Tool actions">{toolbar}</div> : null}
      </header>
      <div
        className="zach-tool-workspace"
        data-navigation={Boolean(navigation)}
        data-inspector={Boolean(inspector)}
      >
        {navigation ? <nav className="zach-tool-navigation" aria-label={navigationLabel}>{navigation}</nav> : null}
        <main className="zach-tool-main" aria-labelledby={headingId}>
          <section
            id={canvasId}
            className="zach-tool-canvas"
            aria-label={canvasLabel}
            tabIndex={-1}
          >
            {children}
          </section>
          {status ? <footer className="zach-tool-status">{status}</footer> : null}
        </main>
        {inspector ? <aside className="zach-tool-inspector" aria-label={inspectorLabel}>{inspector}</aside> : null}
      </div>
    </div>
  );
}
