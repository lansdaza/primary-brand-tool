<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- The 3D globe (src/components/Globe.tsx) is lazy-loaded behind ClientOnly; never import it statically from a route, because three.js must not run during SSR. Shared data/types live in src/lib/rails.ts and src/lib/geo.ts.
- City close-ups are speck art matching the Design page: hand-made landmark meshes (src/lib/landmarks.ts) are surface-sampled into Points in CityScene (lit/window patterns thin the specks); no map data, default exporter handles them. Three.js colours come from PALETTES in Globe.tsx; the Canvas remounts on theme change.
- City close-ups are framed per landmark via `view` in src/lib/cities.ts; dev-only `window.__enterCity(id)` jumps straight into one for screenshots.
- PNG/SVG export: the 3D scene registers an exporter via src/lib/exporter.ts (no three.js import there) so the route can call it without pulling three into SSR.
- Design page (/design): particle generators are pure functions in src/lib/designShapes.ts run in src/lib/designParticles.worker.ts; image/text/Earth masks are rasterized on the main thread and passed in, so generation stays testable and off the UI thread.
- Major-city navigation uses the CITIES registry directly, independently of rail endpoints, so removing or overlapping connections cannot hide city access.
- Custom background controls share a hook and hex validator across globe and design views; update the CSS background token and scene palette together so canvas, fog and exports use the same color.
- vite.config.ts strips devtools `data-tsd-source` attributes from modules importing @react-three; R3F crashes trying to set them as three.js props.
