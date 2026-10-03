type FigureKind = "motion" | "forces" | "energy" | "rotation" | "gravity" | "fluids" | "waves" | "sound" | "optics" | "heat" | "gas" | "circuits" | "fields" | "magnetism" | "quantum" | "nuclear";

function kindFor(topic: string): FigureKind {
  const name = topic.toLowerCase();
  if (/kinematics|projectile|vectors/.test(name)) return "motion";
  if (/newton|friction|collision|momentum/.test(name)) return "forces";
  if (/work|power|energy/.test(name)) return "energy";
  if (/rotation|rigid|circular/.test(name)) return "rotation";
  if (/gravitation|orbit/.test(name)) return "gravity";
  if (/matter|fluid/.test(name)) return "fluids";
  if (/sound|pipe/.test(name)) return "sound";
  if (/wave|oscillation|harmonic/.test(name)) return "waves";
  if (/optic|light|lens|reflection|refraction|interference|dispersion/.test(name)) return "optics";
  if (/gas|kinetic theory/.test(name)) return "gas";
  if (/heat|thermo|temperature|specific/.test(name)) return "heat";
  if (/circuit|current|capacitor|resistor|induction|alternating/.test(name)) return "circuits";
  if (/magnet/.test(name)) return "magnetism";
  if (/electric|electrostatic|gauss/.test(name)) return "fields";
  if (/nuclear|nucleus|radioactive/.test(name)) return "nuclear";
  return "quantum";
}

/** Small conceptual sketches; intentionally not to scale. */
export function FormulaFigure({ topic }: { topic: string }) {
  const kind = kindFor(topic);
  const label: Record<FigureKind, string> = {
    motion: "Object moving along a path", forces: "Forces acting on an object", energy: "Object raised above the ground",
    rotation: "Object rotating around a centre", gravity: "Object orbiting a planet", fluids: "Liquid flowing through a pipe",
    waves: "Wave with a marked wavelength", sound: "Sound waves spreading from a source",
    optics: "Light passing through a lens", heat: "Heat moving from hot to cold", gas: "Particles moving inside a container",
    circuits: "Simple electrical circuit", fields: "Field lines around a charge", magnetism: "Magnetic field around a magnet",
    quantum: "Light reaching an atom", nuclear: "Atom with a nucleus",
  };
  const line = "stroke-current fill-none stroke-[2.5] [stroke-linecap:round] [stroke-linejoin:round]";
  return (
    <svg viewBox="0 0 120 86" role="img" aria-label={label[kind]} className="h-[70px] w-[88px] shrink-0 text-primary sm:h-[86px] sm:w-[120px]" xmlns="http://www.w3.org/2000/svg">
      {kind === "motion" && <g className={line}><path d="M10 68h99M17 61l26-33 29 22 32-29M99 21h5v6"/><circle cx="43" cy="28" r="4" className="fill-primary stroke-none"/></g>}
      {kind === "forces" && <g className={line}><path d="M12 69h96M46 47h29v22H46zM60 43V16m-5 6 5-6 5 6M79 57h27m-6-5 6 5-6 5"/></g>}
      {kind === "energy" && <g className={line}><path d="M16 70h88M45 27h31v16H45zM60 46v21m-5-6 5 6 5-6M87 69V28m-4 5 4-5 4 5"/></g>}
      {kind === "rotation" && <g className={line}><circle cx="60" cy="44" r="26"/><circle cx="60" cy="44" r="3"/><path d="M60 44l20-16M70 17l12 3-1 10"/></g>}
      {kind === "gravity" && <g className={line}><ellipse cx="60" cy="43" rx="49" ry="25"/><circle cx="60" cy="43" r="14"/><circle cx="105" cy="35" r="5" className="fill-primary stroke-none"/></g>}
      {kind === "fluids" && <g className={line}><path d="M9 24h36l23 13h43M9 65h36l23-13h43M14 45h87m-8-5 8 5-8 5"/><path d="M20 32v25M35 32v25" className="stroke-primary/30"/></g>}
      {kind === "waves" && <g className={line}><path d="M7 44h106" className="stroke-primary/30"/><path d="M7 44c10-29 20-29 30 0s20 29 30 0 20-29 30 0 10 15 16 0"/><path d="M17 73h60m-55-5-5 5 5 5m50-10 5 5-5 5"/></g>}
      {kind === "sound" && <g className={line}><circle cx="29" cy="43" r="7" className="fill-primary/15"/><path d="M44 28c11 7 11 23 0 30M55 18c22 13 22 37 0 50M69 10c31 17 31 49 0 66"/></g>}
      {kind === "optics" && <g className={line}><path d="M60 10c-13 12-13 56 0 68 13-12 13-56 0-68ZM8 44h103" className="stroke-primary/40"/><path d="M10 20l50 24 49-17M10 69l50-25 49 18"/></g>}
      {kind === "heat" && <g className={line}><path d="M17 22h29v40H17zM76 22h29v40H76zM49 42h22m-6-6 6 6-6 6"/><path d="M23 30h16M23 38h16M82 32h16" className="stroke-primary/40"/></g>}
      {kind === "gas" && <g className={line}><rect x="14" y="11" width="92" height="64" rx="3"/><circle cx="36" cy="30" r="4"/><circle cx="72" cy="23" r="4"/><circle cx="89" cy="55" r="4"/><circle cx="45" cy="60" r="4"/><path d="M54 35l8 5m18-5 6-5"/></g>}
      {kind === "circuits" && <g className={line}><path d="M20 43V18h80v50H20V51M13 43h14m-10 8h6M58 18v-8m8 8v-8M47 68l5-8 7 16 7-16 7 16 6-8"/></g>}
      {kind === "fields" && <g className={line}><circle cx="60" cy="44" r="13"/><path d="M55 44h10m-5-5v10M60 23V7m-4 5 4-5 4 5M60 65v14m-4-5 4 5 4-5M39 44H15m5-4-5 4 5 4M81 44h24m-5-4 5 4-5 4"/></g>}
      {kind === "magnetism" && <g className={line}><path d="M35 27v24a25 25 0 0 0 50 0V27H72v24a12 12 0 0 1-24 0V27zM35 27v10h13V27m24 0v10h13V27"/><path d="M24 19c-14 20-14 48 0 61M96 19c14 20 14 48 0 61" className="stroke-primary/40"/></g>}
      {kind === "quantum" && <g className={line}><circle cx="85" cy="42" r="22"/><circle cx="85" cy="42" r="5" className="fill-primary"/><path d="M8 42h12l7-13 10 27 10-27 9 13h7"/></g>}
      {kind === "nuclear" && <g className={line}><circle cx="60" cy="43" r="9" className="fill-primary/20"/><ellipse cx="60" cy="43" rx="43" ry="16" transform="rotate(-30 60 43)"/><ellipse cx="60" cy="43" rx="43" ry="16" transform="rotate(30 60 43)"/><circle cx="28" cy="39" r="3" className="fill-primary"/></g>}
    </svg>
  );
}