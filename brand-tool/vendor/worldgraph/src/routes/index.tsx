import { createFileRoute, ClientOnly, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { MapPin, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackgroundControl } from "@/components/BackgroundControl";
import { useBackgroundColor } from "@/hooks/use-background-color";
import type { LatLng } from "@/lib/geo";
import { CITIES, cityNear, type City } from "@/lib/cities";
import { distanceKm } from "@/lib/geo";
import { exportView } from "@/lib/exporter";
import { FLOW_TYPES, STORAGE_KEY, createRail, seedRails, type FlowType, type Rail, type RailNode } from "@/lib/rails";
import { PlaceSearch } from "@/components/PlaceSearch";
import { placeLabel } from "@/lib/places";

const Globe = lazy(() => import("@/components/Globe"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aurelius — Global Information Rails" },
      { name: "description", content: "Map and connect the information rails Aurelius builds between governments worldwide." },
      { property: "og:title", content: "Aurelius — Global Information Rails" },
      { property: "og:description", content: "Decision-making infrastructure: connect two places on Earth and visualise the rail between them." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Mode = "idle" | "pickA" | "pickB";

function Index() {
  const [rails, setRails] = useState<Rail[]>(() => seedRails());
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [pending, setPending] = useState<RailNode | null>(null);
  const [dest, setDest] = useState<RailNode | null>(null);
  const [focus, setFocus] = useState<RailNode | null>(null);
  const [focusCity, setFocusCity] = useState<City | null>(null);
  const [cityView, setCityView] = useState(false);
  const [cityLoading, setCityLoading] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);
  const onNodeClick = (n: RailNode) => {
    setFocus(n);
    setFocusCity(cityNear(n) ?? null);
  };
  const selectCity = (city: City) => {
    setMode("idle");
    setPending(null);
    setSelectedId(null);
    setFocus({ lat: city.lat, lng: city.lng, name: city.name, place: city.name });
    setFocusCity(city);
  };
  const enterCity = () => {
    setCityLoading(true);
    setCityView(true);
    setFadeKey((k) => k + 1);
  };
  const exitCity = () => {
    setCityView(false);
    setCityLoading(false);
    setFadeKey((k) => k + 1);
  };
  const backToGlobe = () => {
    setCityView(false);
    setFocus(null);
    setFocusCity(null);
    setFadeKey((k) => k + 1);
  };
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    // dev-only: jump straight into a landmark close-up, e.g. __enterCity("nyc")
    (window as unknown as { __enterCity: (id: string) => void }).__enterCity = (id) => {
      const c = CITIES.find((x) => x.id === id);
      if (!c) return;
      setFocus({ lat: c.lat, lng: c.lng, place: c.name, name: c.id });
      setFocusCity(c);
      setCityLoading(true);
      setCityView(true);
    };
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && (cityView ? exitCity() : backToGlobe());
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const { background, chooseBackground, resetBackground } = useBackgroundColor(theme);
  useEffect(() => {
    const t = localStorage.getItem("aurelius-theme");
    if (t === "light" || t === "dark") setTheme(t);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);
  const chooseTheme = (t: "dark" | "light") => {
    setTheme(t);
    localStorage.setItem("aurelius-theme", t);
  };
  const [globeStyle, setGlobeStyle] = useState<"dots" | "particles">("dots");
  useEffect(() => {
    const v = localStorage.getItem("aurelius-globe-style");
    if (v === "dots" || v === "particles") setGlobeStyle(v);
  }, []);
  const chooseStyle = (v: "dots" | "particles") => {
    setGlobeStyle(v);
    localStorage.setItem("aurelius-globe-style", v);
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setRails(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(rails));
  }, [rails, loaded]);

  const onPick = (p: LatLng, place: string) => {
    const node: RailNode = { ...p, place, name: "" };
    if (!pending) { setPending(node); setMode("pickB"); }
    else if (!dest) setDest(node);
  };
  const createConnection = () => {
    if (!pending || !dest) return;
    const rail = createRail(rails, pending, dest, crypto.randomUUID());
    setRails((r) => [...r, rail]);
    setSelectedId(rail.id);
    setPending(null);
    setDest(null);
    setMode("idle");
  };
  const typed = (p: { lat: number; lng: number; name: string }, label: string, slot: "from" | "to") => {
    const node: RailNode = { lat: p.lat, lng: p.lng, place: label, name: "" };
    setFocus({ ...node, name: p.name });
    setFocusCity(null);
    if (slot === "from") { setPending(node); setMode("pickB"); } else setDest(node);
  };

  const update = (id: string, patch: Partial<Rail>) => setRails((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const nodeCount = new Set(rails.flatMap((r) => [r.a, r.b].map((n) => `${n.lat.toFixed(2)},${n.lng.toFixed(2)}`))).size;
  const totalKm = rails.reduce((s, r) => s + distanceKm(r.a, r.b), 0);

  return (
    <main className="relative h-screen w-full overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0">
        <ClientOnly fallback={null}>
          <Suspense fallback={null}>
            <Globe rails={rails} selectedId={selectedId} pending={pending} picking={mode !== "idle"} onPick={onPick}
              globeStyle={globeStyle}
              theme={theme}
               background={background}
              focus={focus}
              focusCity={focusCity}
              cityView={cityView}
              onNodeClick={onNodeClick}
              onEnterCity={enterCity}
              onExitCity={exitCity}
              onCityReady={() => setCityLoading(false)}
            />
          </Suspense>
        </ClientOnly>
      </div>

      <header className="pointer-events-none absolute left-8 top-8 max-w-sm">
        <h1 className="font-display text-xl tracking-[0.35em]">AURELIUS</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Decision-making infrastructure. Information rails that let governments make better decisions — beyond the boundary of internal data.
        </p>
      </header>

       <div className="hud absolute bottom-8 left-8 right-88 flex flex-wrap items-center gap-4">
        <div className="flex overflow-hidden rounded-full border border-border">
          {(["dark", "light"] as const).map((v) => (
            <button
              key={v}
              onClick={() => chooseTheme(v)}
              className={`px-3 py-1.5 transition-colors ${theme === v ? "bg-primary text-primary-foreground" : "hover:text-foreground"}`}
            >
              {v}
            </button>
          ))}
        </div>
         <BackgroundControl value={background} onChange={chooseBackground} onReset={resetBackground} />
         <div className="flex overflow-hidden rounded-full border border-border">
           {(["dots", "particles"] as const).map((v) => (
            <button
              key={v}
              onClick={() => chooseStyle(v)}
              className={`px-3 py-1.5 transition-colors ${globeStyle === v ? "bg-primary text-primary-foreground" : "hover:text-foreground"}`}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex overflow-hidden rounded-full border border-border">
          {(["png", "svg"] as const).map((f) => (
            <button
              key={f}
              onClick={() => exportView(f, cityView && focusCity ? focusCity.landmark : `globe-${new Date().toISOString().slice(0, 10)}`)}
              className="px-3 py-1.5 transition-colors hover:text-foreground"
            >
              ↓ {f}
            </button>
          ))}
        </div>
        <Link to="/design" className="rounded-full border border-border px-3 py-1.5 transition-colors hover:text-foreground">Design</Link>
        <span>{nodeCount} nodes</span>
        <span>{rails.length} active rails</span>
        <span>{Math.round(totalKm).toLocaleString()} km</span>
      </div>

      <div key={fadeKey} className="scene-fade pointer-events-none absolute inset-0 bg-background" />

      {focus && mode === "idle" && (
        <div className={`hud absolute left-8 top-40 flex max-w-[calc(100%-4rem)] flex-wrap items-center gap-3 rounded-lg border border-border bg-card/80 px-4 py-2 text-foreground backdrop-blur ${cityView ? "" : "mr-88"}`}>
          <span>
            {cityView && focusCity ? `${focusCity.landmark}, ${focusCity.name}` : focus.place}
            {cityView
              ? cityLoading ? " · building city…" : " · drag to turn"
              : focusCity ? " · scroll in to enter the city" : " · city view not available"}
          </span>
          {!cityView && focusCity && (
            <Button variant="ghost" size="sm" onClick={enterCity}>
              <ArrowUpRight /> View landmark
            </Button>
          )}
          <button className="text-muted-foreground hover:text-foreground" onClick={cityView ? exitCity : backToGlobe}>
            {cityView ? "← Globe" : "Back to globe"}
          </button>
        </div>
      )}

      {mode !== "idle" && (
        <div className="hud absolute left-1/2 top-8 z-10 flex -translate-x-1/2 flex-wrap items-center gap-4 rounded-full border border-border bg-card/80 px-5 py-2 text-foreground backdrop-blur">
          <PlaceSearch label="From" autoFocus value={pending?.place} onClear={() => { setPending(null); setMode("pickA"); }}
            onSelect={(p) => typed(p, placeLabel(p), "from")} onSubmit={createConnection} />
          <PlaceSearch label="To" value={dest?.place} onClear={() => setDest(null)}
            onSelect={(p) => typed(p, placeLabel(p), "to")} onSubmit={createConnection} />
          {pending && dest && (
            <button onClick={createConnection} className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-85">
              Create connection
            </button>
          )}
          <button className="text-muted-foreground hover:text-foreground" onClick={() => { setMode("idle"); setPending(null); setDest(null); }}>
            Cancel
          </button>
        </div>
      )}

      <aside className={`${cityView ? "hidden" : "flex"} absolute bottom-8 right-8 top-8 w-80 flex-col rounded-lg border border-border bg-card/70 backdrop-blur`}>
        <nav aria-label="Major cities" className="shrink-0 border-b border-border p-4">
          <h2 className="hud mb-2">Major cities</h2>
          <div className="flex flex-col gap-1">
            {CITIES.map((city) => (
              <Button
                key={city.id}
                variant="ghost"
                aria-pressed={focusCity?.id === city.id}
                onClick={() => selectCity(city)}
                className={`h-auto min-h-10 justify-start px-2 py-2 text-left ${focusCity?.id === city.id ? "bg-accent" : ""}`}
              >
                <MapPin className="text-muted-foreground" />
                <span className="min-w-0 whitespace-normal">
                  <span className="block">{city.name}</span>
                  <span className="block text-xs font-normal text-muted-foreground">{city.landmark}</span>
                </span>
              </Button>
            ))}
          </div>
        </nav>
        <div className="flex items-center justify-between border-b border-border p-4">
          <span className="hud">Rails</span>
          <button
            onClick={() => { setMode("pickA"); setSelectedId(null); setPending(null); setDest(null); setFocus(null); setFocusCity(null); }}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-85"
          >
            + New connection
          </button>
        </div>
        <ul className="flex-1 space-y-1 overflow-y-auto p-2">
          {rails.map((r) => {
            const sel = r.id === selectedId;
            return (
              <li key={r.id}>
                <div
                  role="button"
                  onClick={() => setSelectedId(sel ? null : r.id)}
                  className={`cursor-pointer rounded-md p-3 transition-colors ${sel ? "bg-accent" : "hover:bg-accent/50"}`}
                >
                  {sel ? (
                    <input
                      value={r.name}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => update(r.id, { name: e.target.value })}
                      className="w-full bg-transparent text-sm font-medium outline-none"
                    />
                  ) : (
                    <p className="text-sm font-medium">{r.name}</p>
                  )}
                  <p className="hud mt-1">
                    {r.a.name} · {r.a.place} → {r.b.name} · {r.b.place}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="hud">{Math.round(distanceKm(r.a, r.b)).toLocaleString()} km · {r.type}</span>
                  </div>
                  {sel && (
                    <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={r.type}
                        onChange={(e) => update(r.id, { type: e.target.value as FlowType })}
                        className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs"
                      >
                        {FLOW_TYPES.map((t) => <option key={t}>{t}</option>)}
                      </select>
                      <button
                        onClick={() => { setRails((rs) => rs.filter((x) => x.id !== r.id)); setSelectedId(null); }}
                        className="rounded border border-border px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </aside>
    </main>
  );
}
