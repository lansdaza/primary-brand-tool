'use client';

import { useInsertionEffect, useMemo, type ComponentProps } from 'react';
import { DialRoot } from 'dialkit';
import { useGraphicalTheme, type ThemeDocument } from './graphical';
import { previewCssVariables } from './graphical/lib/theme-model';

/**
 * Load CSS once in the app entry, in this order:
 * fonts.css, graphical/styles.css, dialkit/styles.css, dialkit-theme.css, layout.css.
 * Mount one ZachDialRoot inside GraphicalProvider. DialKit's store is app-wide.
 */
export type ZachDialRootProps = Omit<ComponentProps<typeof DialRoot>, 'theme'>;

// DialKit also creates standalone .dialkit-root[data-theme] nodes for menus,
// timeline popups, and shortcuts. Theme both modes so every portal receives the
// source tokens even when it is outside GraphicalProvider's DOM subtree.
export function buildDialThemeCss(themeDocument: ThemeDocument): string {
  return (['light', 'dark'] as const).map((mode) => {
    const variables = previewCssVariables(themeDocument.theme, mode);
    const declarations = Object.entries(variables)
      .filter(([name, value]) => name.startsWith('--') && value != null)
      .map(([name, value]) => `${name}:${String(value)};`)
      .join('');
    return `.dialkit-root[data-theme="${mode}"],.dialkit-version-overlay[data-theme="${mode}"]{${declarations}}`;
  }).join('\n');
}

// A shared stylesheet avoids inserting a copy per portal. Applications should
// still render only one root: multiple roots display the same global panels.
let sharedStyle: HTMLStyleElement | undefined;
let styleUsers = 0;

function useDialThemeBridge(css: string): void {
  useInsertionEffect(() => {
    const owner = window.document;
    if (!sharedStyle || !sharedStyle.isConnected) {
      sharedStyle = owner.createElement('style');
      sharedStyle.dataset.zachDialTheme = '';
      owner.head.appendChild(sharedStyle);
    }
    sharedStyle.textContent = css;
    styleUsers += 1;
    return () => {
      styleUsers -= 1;
      if (styleUsers === 0) {
        sharedStyle?.remove();
        sharedStyle = undefined;
      }
    };
  }, [css]);
}

/** Native DialKit controls, using the active Graphical theme and token bridge. */
export function ZachDialRoot({
  mode = 'inline',
  productionEnabled = true,
  versions = 'menu',
  ...props
}: ZachDialRootProps) {
  const { document: themeDocument, colorMode } = useGraphicalTheme();
  const css = useMemo(() => buildDialThemeCss(themeDocument), [themeDocument]);
  useDialThemeBridge(css);

  // DialRoot has no className/style props. Style its real root and portal classes.
  return (
    <DialRoot
      {...props}
      mode={mode}
      theme={colorMode}
      productionEnabled={productionEnabled}
      versions={versions}
    />
  );
}
