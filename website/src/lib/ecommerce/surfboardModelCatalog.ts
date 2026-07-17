/**
 * Curated surfboard model enrichment — descriptions adapted from brand/specialist
 * sources and YouTube watch URLs for consistent product-page video previews.
 *
 * Matching: a product matches when EVERY token in `match` appears in the
 * normalized "brand + name" string. Longer / more specific entries win.
 */

export type SurfboardModelEnrichment = {
  id: string;
  /** All tokens must appear in normalized brand+name. */
  match: string[];
  title: string;
  boardType: string;
  description: string;
  /** YouTube watch URL preferred (enables iframe preview). */
  videoUrl: string;
  sourceName: string;
  sourceUrl: string;
};

function yt(id: string) {
  return `https://www.youtube.com/watch?v=${id}`;
}

export const SURFBOARD_MODEL_CATALOG: SurfboardModelEnrichment[] = [
  // —— Channel Islands / Al Merrick ——
  {
    id: "ci-better-everyday",
    match: ["better", "everyday"],
    title: "Channel Islands Better Everyday",
    boardType: "performance everyday shortboard",
    description:
      "The Better Everyday is Britt Merrick’s evolution of the Happy Everyday — a step-down performance shortboard refined for the waves most of us surf every day. CI relaxed the trademark hip, added a swallowtail, increased exit rocker, and set it up as a versatile 5-fin that shines especially as a quad. It sits between a full high-performance shortboard (Two Happy / CI 2.Pro) and a groveler, with smoother transitions, more bite through the flats, and a broader range into slightly larger surf.",
    videoUrl: yt("oacBXoxIw1s"),
    sourceName: "Channel Islands Surfboards",
    sourceUrl: "https://cisurfboards.com/products/better-everyday",
  },
  {
    id: "ci-happy-everyday",
    match: ["happy", "everyday"],
    title: "Channel Islands Happy Everyday",
    boardType: "performance everyday shortboard",
    description:
      "Created by Britt Merrick from the Two Happy platform, the Happy Everyday is CI’s daily-driver shortboard for real-world conditions. A curvier outline through the tail, lowered entry/exit rocker for paddle and planing speed, single concave under the front foot, and generous double concave through the fins deliver rail-to-rail ease and lift in average beachbreak surf. Designed to sit between a high-performance shortboard and a groveler — the board for ripping on the majority of waves, the majority of days.",
    videoUrl: yt("oacBXoxIw1s"),
    sourceName: "Channel Islands Surfboards",
    sourceUrl: "https://cisurfboards.com/",
  },
  {
    id: "ci-big-happy",
    match: ["big", "happy"],
    title: "Channel Islands Big Happy",
    boardType: "performance mid-length shortboard",
    description:
      "The Big Happy brings Channel Islands performance DNA into a fuller, more paddle-friendly outline for surfers who want Merrick rail feel without going full groveler. Expect drive through the flats, confident mid-face turns, and a forgiving sweet spot for everyday European beachbreaks — a strong step-up from beginner boards into CI’s Happy family.",
    videoUrl: yt("oacBXoxIw1s"),
    sourceName: "Channel Islands Surfboards",
    sourceUrl: "https://cisurfboards.com/",
  },
  {
    id: "ci-febs-fish",
    match: ["feb", "fish"],
    title: "Channel Islands Feb’s Fish",
    boardType: "fish",
    description:
      "Mikey February’s fish for Channel Islands blends classic fish speed with modern CI performance. Wide, planing outline and fish rails for weak-to-average waves, with enough control to keep progressive lines on Carcavelos-style beachbreaks. A fun, fast alternative when the shortboard feels too thin for the day.",
    videoUrl: yt("oacBXoxIw1s"),
    sourceName: "Channel Islands Surfboards",
    sourceUrl: "https://cisurfboards.com/",
  },
  {
    id: "ci-m23",
    match: ["m23"],
    title: "Channel Islands M23",
    boardType: "mid-length",
    description:
      "The CI M23 is a modern mid-length with Merrick sensitivity — egg-inspired glide up front with contemporary rocker and rails that still let you pivot and trim. Built for flowy lines in waist-to-head-high surf when you want paddle power without sacrificing style.",
    videoUrl: yt("cOHc2TSvCI8"),
    sourceName: "Channel Islands Surfboards",
    sourceUrl: "https://cisurfboards.com/",
  },

  // —— Firewire / Slater Designs / Machado ——
  {
    id: "fw-seaside",
    match: ["seaside"],
    title: "Firewire Seaside by Rob Machado",
    boardType: "hybrid fish / groveler",
    description:
      "Rob Machado’s Seaside is a best-selling hybrid groveler — a slimmed-down cousin of the Too Fish, usually ridden as a quad for speed and control in small-to-average waves. Cross between shortboard performance and fish planing power, designed so you generate speed without forcing it. Helium construction keeps it light and lively underfoot; a one-board travel quiver favourite for Machado himself.",
    videoUrl: yt("vXyU298f0vk"),
    sourceName: "Firewire Surfboards",
    sourceUrl: "https://www.firewiresurfboards.com/collections/prestige-seaside-by-rob-machado",
  },
  {
    id: "fw-too-fish",
    match: ["too", "fish"],
    title: "Firewire Too Fish by Rob Machado",
    boardType: "fish",
    description:
      "Machado’s Too Fish is a modern performance fish with generous width and a swallowtail for instant speed in soft waves. Helium construction adds spring and durability. Ideal when you want classic fish fun with enough drive to still push progressive turns on smaller European beachbreaks.",
    videoUrl: yt("vXyU298f0vk"),
    sourceName: "Firewire Surfboards",
    sourceUrl: "https://www.firewiresurfboards.com/",
  },
  {
    id: "fw-sunday",
    match: ["sunday"],
    title: "Firewire Sunday by Rob Machado",
    boardType: "mid-length",
    description:
      "The Sunday is Machado’s mid-length for stylish, trim-oriented surfing with modern Firewire tech. Longer rail line for glide and flow, still responsive enough for cutbacks and pocket surfing when the swell is fun but not punching. A relaxed quiver board for weekend sessions.",
    videoUrl: yt("vXyU298f0vk"),
    sourceName: "Firewire Surfboards",
    sourceUrl: "https://www.firewiresurfboards.com/",
  },
  {
    id: "fw-seaside-beyond",
    match: ["seaside", "beyond"],
    title: "Firewire Seaside & Beyond",
    boardType: "mid-length hybrid",
    description:
      "Seaside & Beyond stretches Machado’s Seaside concept into a longer mid-length hybrid — more paddle, more glide, same small-wave speed DNA. Perfect when you want Seaside fun with extra rail and presence in weaker or longer-period walls.",
    videoUrl: yt("vXyU298f0vk"),
    sourceName: "Firewire Surfboards",
    sourceUrl: "https://www.firewiresurfboards.com/",
  },
  {
    id: "fw-dominator-2",
    match: ["dominator"],
    title: "Firewire Dominator 2.0",
    boardType: "performance hybrid shortboard",
    description:
      "Dan Mann’s Dominator 2.0 updates the long-running Dominator into a cleaner, more versatile everyday shortboard. Squash tail for release, slightly refined rails, and a concave that splits into a subtle double and V out the tail. Designed so progressive surfing feels accessible across a wider range of conditions — a staple step-down performance shape in Helium or I-Bolic builds.",
    videoUrl: yt("KrR34P_kaBA"),
    sourceName: "Firewire Surfboards",
    sourceUrl: "https://www.firewiresurfboards.com/products/dominator-2-0-2026",
  },
  {
    id: "fw-sci-fi-2",
    match: ["sci", "fi"],
    title: "Firewire Sci-Fi 2.0",
    boardType: "performance shortboard",
    description:
      "Tomo’s Sci-Fi 2.0 brings the Quad-Inside-Single-Concave planing hull and signature bat tail into a refined performance shortboard. Fast down the line with unique release through turns — a progressive alternative to traditional rocker shortboards for intermediate-to-advanced surfers.",
    videoUrl: yt("KrR34P_kaBA"),
    sourceName: "Firewire Surfboards",
    sourceUrl: "https://www.firewiresurfboards.com/",
  },
  {
    id: "fw-s-boss",
    match: ["s boss"],
    title: "Slater Designs S Boss",
    boardType: "performance shortboard",
    description:
      "The S Boss by Kelly Slater & Dan Mann is Firewire’s most user-friendly pure performance model — high-performance surfing made more accessible by design. Responsive outline and modern volume distribution for intermediate-to-advanced surfers wanting Slater Designs feel without an ultra-pro dims commitment.",
    videoUrl: yt("KrR34P_kaBA"),
    sourceName: "Firewire / Slater Designs",
    sourceUrl: "https://www.firewiresurfboards.com/blogs/news/prestige-introducing-the-s-boss",
  },
  {
    id: "fw-boss-up",
    match: ["boss", "up"],
    title: "Slater Designs Boss Up",
    boardType: "performance mid / step-up hybrid",
    description:
      "Boss Up extends Slater Designs performance into a longer, more paddle-friendly package. Built for surfers who want drive and control with extra rail — strong in punchier beachbreaks and as a small step-up when the forecast jumps a notch.",
    videoUrl: yt("KrR34P_kaBA"),
    sourceName: "Firewire / Slater Designs",
    sourceUrl: "https://www.firewiresurfboards.com/",
  },
  {
    id: "fw-frk",
    match: ["frk"],
    title: "Slater Designs FRK",
    boardType: "performance shortboard",
    description:
      "The FRK / FRK+ line is Kelly Slater & Dan Mann’s progressive performance shortboard platform — refined for speed, pocket surfing, and critical turns. Helium/I-Bolic constructions keep weight down while staying lively underfoot for advanced everyday and contest-style waves.",
    videoUrl: yt("KrR34P_kaBA"),
    sourceName: "Firewire / Slater Designs",
    sourceUrl: "https://www.firewiresurfboards.com/",
  },
  {
    id: "fw-mashup",
    match: ["mashup"],
    title: "Firewire Mashup",
    boardType: "performance hybrid",
    description:
      "The Mashup is a Machado × Dan Mann collaboration hybrid — blending fishy speed with shortboard control. Helium construction and a versatile outline for mixed European conditions when you want one board that covers soft mornings and punchier afternoon sets.",
    videoUrl: yt("vXyU298f0vk"),
    sourceName: "Firewire Surfboards",
    sourceUrl: "https://www.firewiresurfboards.com/",
  },
  {
    id: "fw-special-t",
    match: ["special", "t"],
    title: "Firewire Special T",
    boardType: "longboard",
    description:
      "The Special T is Firewire’s classic performance longboard outline in modern Helium construction — nose-riding potential with a lively, lightweight feel. Built for trim, cross-steps, and stylish logging when the swell is long and playful.",
    videoUrl: yt("vXyU298f0vk"),
    sourceName: "Firewire Surfboards",
    sourceUrl: "https://www.firewiresurfboards.com/",
  },
  {
    id: "fw-tj-mid",
    match: ["tj", "mid"],
    title: "Firewire TJ Mid",
    boardType: "mid-length",
    description:
      "Taylor Jensen’s mid-length for Firewire combines classic mid glide with Helium responsiveness. Rounded pin options and modern laminations for flowy rail surfing from waist-high to overhead fun.",
    videoUrl: yt("vXyU298f0vk"),
    sourceName: "Firewire Surfboards",
    sourceUrl: "https://www.firewiresurfboards.com/",
  },
  {
    id: "fw-tj",
    match: ["firewire", "tj"],
    title: "Firewire TJ",
    boardType: "longboard / mid",
    description:
      "The TJ model brings Taylor Jensen’s log/mid approach into Firewire’s lightweight constructions — glide, nose work, and smooth rail transitions for classic surfing with a modern flex feel.",
    videoUrl: yt("vXyU298f0vk"),
    sourceName: "Firewire Surfboards",
    sourceUrl: "https://www.firewiresurfboards.com/",
  },
  {
    id: "fw-groove",
    match: ["groove"],
    title: "Firewire Groove",
    boardType: "performance shortboard",
    description:
      "The Groove is a performance shortboard option in Firewire’s Helium line — squash-tail drive and modern rocker for intermediate-to-advanced surfers wanting a lively everyday shortboard with lightweight construction.",
    videoUrl: yt("KrR34P_kaBA"),
    sourceName: "Firewire Surfboards",
    sourceUrl: "https://www.firewiresurfboards.com/",
  },
  {
    id: "fw-long-rider",
    match: ["long", "rider"],
    title: "Firewire Long Rider",
    boardType: "mid-length",
    description:
      "Long Rider is Firewire’s mid/long hybrid for extended rail lines and trim speed. Helium core keeps volume manageable while the rounded pin encourages smooth carves and flowing lines.",
    videoUrl: yt("vXyU298f0vk"),
    sourceName: "Firewire Surfboards",
    sourceUrl: "https://www.firewiresurfboards.com/",
  },
  {
    id: "fw-sweet-potato",
    match: ["sweet", "potato"],
    title: "Firewire Sweet Potato",
    boardType: "hybrid / groveler",
    description:
      "Dan Mann’s Sweet Potato is a thick, friendly hybrid for maximum fun in small waves — easy paddle, quick planing, and forgiving rails. A go-to when the forecast is weak but you still want to get wet and smile.",
    videoUrl: yt("KrR34P_kaBA"),
    sourceName: "Firewire Surfboards",
    sourceUrl: "https://www.firewiresurfboards.com/",
  },
  {
    id: "fw-cado",
    match: ["cado"],
    title: "Firewire Machado Cado / Xtra Cado",
    boardType: "performance hybrid",
    description:
      "Machado’s Cado / Xtra Cado shapes blend performance outline with forgiving volume — versatile hybrids for intermediate surfers progressing into more critical turns while keeping paddle power.",
    videoUrl: yt("vXyU298f0vk"),
    sourceName: "Firewire Surfboards",
    sourceUrl: "https://www.firewiresurfboards.com/",
  },
  {
    id: "fw-mindcraft",
    match: ["mindcraft"],
    title: "Firewire Mindcraft",
    boardType: "performance shortboard",
    description:
      "Mindcraft is a progressive Firewire performance shortboard with a rounded pin for hold and precision. Built for surfers chasing critical pocket surfing and clean rail engagement in quality beach or reef waves.",
    videoUrl: yt("KrR34P_kaBA"),
    sourceName: "Firewire Surfboards",
    sourceUrl: "https://www.firewiresurfboards.com/",
  },
  {
    id: "fw-neutrino",
    match: ["neutrino"],
    title: "Firewire Neutrino",
    boardType: "performance shortboard",
    description:
      "The Neutrino is a compact Firewire performance shape — quick rail-to-rail and responsive in punchy smaller surf. Square-tail versions add release for tight pocket turns.",
    videoUrl: yt("KrR34P_kaBA"),
    sourceName: "Firewire Surfboards",
    sourceUrl: "https://www.firewiresurfboards.com/",
  },
  {
    id: "fw-spaceship",
    match: ["spaceship"],
    title: "Firewire Spaceship",
    boardType: "performance shortboard",
    description:
      "Spaceship is a Firewire performance outline with a rounded pin for drive and control. Suited to intermediate-advanced surfers wanting a lively shortboard feel in everyday to above-average conditions.",
    videoUrl: yt("KrR34P_kaBA"),
    sourceName: "Firewire Surfboards",
    sourceUrl: "https://www.firewiresurfboards.com/",
  },
  {
    id: "fw-spun-honey",
    match: ["spun", "honey"],
    title: "Firewire Spun Honey",
    boardType: "performance hybrid",
    description:
      "Spun Honey mixes playful hybrid volume with Firewire tech for fun, speed-first sessions. A loose, approachable shape when you want something freer than a full shortboard.",
    videoUrl: yt("vXyU298f0vk"),
    sourceName: "Firewire Surfboards",
    sourceUrl: "https://www.firewiresurfboards.com/",
  },
  {
    id: "fw-gem",
    match: ["gem"],
    title: "Firewire The Gem",
    boardType: "longboard",
    description:
      "The Gem is a Firewire longboard/nose-rider platform with diamond tail options — classic logging lines with Helium lightness for easier handling on land and water.",
    videoUrl: yt("vXyU298f0vk"),
    sourceName: "Firewire Surfboards",
    sourceUrl: "https://www.firewiresurfboards.com/",
  },
  {
    id: "fw-twinzer",
    match: ["twinzer"],
    title: "Firewire Taylor Jensen Twinzer",
    boardType: "twinzer / alternative",
    description:
      "Taylor Jensen’s Twinzer for Firewire explores alternative fin clusters for unique drive and grip. A specialty shape for surfers experimenting beyond thruster norm with Firewire construction underfoot.",
    videoUrl: yt("vXyU298f0vk"),
    sourceName: "Firewire Surfboards",
    sourceUrl: "https://www.firewiresurfboards.com/",
  },

  // —— Hayden Shapes ——
  {
    id: "hs-hypto-krypto",
    match: ["hypto", "krypto"],
    title: "Hayden Shapes Hypto Krypto",
    boardType: "hybrid performance / one-board quiver",
    description:
      "The Hypto Krypto is Hayden Cox’s iconic one-board quiver — balancing traditional mid-fish volume with modern performance. Wide nose for paddle and planing, pulled-in rounded pin for control, and a flatter rocker that generates speed across 1–8 ft conditions. FutureFlex (and epoxy soft variants) give a lively, springy feel. Suitable from progressing intermediates to advanced surfers who want one board that covers beachbreaks to punchier days.",
    videoUrl: yt("MO73vfk2MKk"),
    sourceName: "Haydenshapes",
    sourceUrl: "https://www.haydenshapes.com/products/hypto-krypto",
  },

  // —— Lost / Mayhem ——
  {
    id: "lost-sub-driver-3",
    match: ["sub", "driver"],
    title: "Lost Sub Driver 3.0",
    boardType: "performance step-down",
    description:
      "Matt Biolos’ Sub Driver 3.0 is a performance step-down for high-speed, small-wave power surfing. Refined foil, bottom curves, outline, and rocker keep it one of Lost’s best small-wave weapons — drive through weak sections with enough hold for committed turns when the bank stands up.",
    videoUrl: yt("MO73vfk2MKk"),
    sourceName: "Lost Surfboards",
    sourceUrl: "https://lostsurfboards.net/",
  },
  {
    id: "lost-driver-3",
    match: ["driver", "3"],
    title: "Lost Driver 3.0",
    boardType: "performance shortboard",
    description:
      "The Driver 3.0 is Lost’s modern pro-formance shortboard — evolved from the Driver 2.0 with elite team input (including Griffin Colapinto’s magic dims). Forward volume for paddle and response, refined deck and rails for pocket surfing. The status-quo high-level shortboard for critical turns in quality surf.",
    videoUrl: yt("MO73vfk2MKk"),
    sourceName: "Lost Surfboards",
    sourceUrl: "https://lostsurfboards.net/surfboards/driver-3-0-round/",
  },
  {
    id: "lost-driver-2",
    match: ["driver", "2"],
    title: "Lost Driver 2.0",
    boardType: "performance shortboard",
    description:
      "Driver 2.0 is the proven Lost performance shortboard platform that led into the 3.0 era — fast, precise, and tuned for intermediate-to-advanced surfers wanting Mayhem’s contest-bred feel in everyday European waves.",
    videoUrl: yt("MO73vfk2MKk"),
    sourceName: "Lost Surfboards",
    sourceUrl: "https://lostsurfboards.net/",
  },
  {
    id: "lost-mini-driver",
    match: ["mini", "driver"],
    title: "Lost Mini Driver",
    boardType: "performance groveler / step-down",
    description:
      "The Mini Driver packs Lost performance into a shorter, more playful package for weaker days — quick to generate speed with enough rocker and rail to still do proper turns when a set stands up.",
    videoUrl: yt("MO73vfk2MKk"),
    sourceName: "Lost Surfboards",
    sourceUrl: "https://lostsurfboards.net/",
  },
  {
    id: "lost-step-driver",
    match: ["step", "driver"],
    title: "Lost Step Driver",
    boardType: "performance step-up",
    description:
      "Step Driver is Lost’s answer for when the swell jumps — extra control and hold versus the standard Driver line, without going full gun. For surfers who need confidence in steeper, faster walls.",
    videoUrl: yt("MO73vfk2MKk"),
    sourceName: "Lost Surfboards",
    sourceUrl: "https://lostsurfboards.net/",
  },
  {
    id: "lost-quiver-killer",
    match: ["quiver", "killer"],
    title: "Lost Quiver Killer",
    boardType: "performance hybrid",
    description:
      "The Quiver Killer is Lost’s versatile hybrid for covering more of your week with one board — speed in softer surf, enough performance outline for better days. A Mayhem favourite for travelers and everyday rippers.",
    videoUrl: yt("MO73vfk2MKk"),
    sourceName: "Lost Surfboards",
    sourceUrl: "https://lostsurfboards.net/",
  },
  {
    id: "lost-rnf-twinzer",
    match: ["rnf", "twinzer"],
    title: "Lost RNF Twinzer ’96er",
    boardType: "fish / twinzer",
    description:
      "Based on Lost’s legendary Round Nose Fish ’96 — one of the best-selling fish designs ever — the Twinzer ’96er adds a Twinzer+ fin cluster for extra grip, control, and drive. High-performance fish energy for all conditions, not just a weak-wave crutch.",
    videoUrl: yt("MO73vfk2MKk"),
    sourceName: "Lost Surfboards",
    sourceUrl: "https://lostsurfboards.net/surfboards/rnf-twinzer-96er/",
  },
  {
    id: "lost-formula-1",
    match: ["formula"],
    title: "Lost Formula-1",
    boardType: "performance shortboard",
    description:
      "Formula-1 is a Lost performance shortboard for speed-focused surfing — aggressive rocker and outline cues aimed at intermediate-advanced riders wanting Mayhem’s racey feel in punchy beachbreaks.",
    videoUrl: yt("MO73vfk2MKk"),
    sourceName: "Lost Surfboards",
    sourceUrl: "https://lostsurfboards.net/",
  },
  {
    id: "lost-pisces",
    match: ["pisces"],
    title: "Lost Pisces",
    boardType: "performance shortboard",
    description:
      "Pisces in Light Speed construction is a Lost performance option tuned for lively flex and speed. A modern Mayhem shortboard for surfers chasing responsive rail feel in quality everyday waves.",
    videoUrl: yt("MO73vfk2MKk"),
    sourceName: "Lost Surfboards",
    sourceUrl: "https://lostsurfboards.net/",
  },
  {
    id: "lost-sabo-taj",
    match: ["sabo"],
    title: "Lost Sabo Taj",
    boardType: "performance shortboard",
    description:
      "Sabo_Taj is a Lost collaboration performance shortboard — Taj Burrow–influenced feel with Mayhem construction. Built for free-flowing, progressive shortboard surfing.",
    videoUrl: yt("MO73vfk2MKk"),
    sourceName: "Lost Surfboards",
    sourceUrl: "https://lostsurfboards.net/",
  },

  // —— Sharp Eye ——
  {
    id: "se-inferno-72",
    match: ["inferno"],
    title: "Sharp Eye Inferno 72",
    boardType: "performance shortboard",
    description:
      "The Inferno 72 is Sharp Eye’s high-performance shortboard platform associated with Filipe Toledo’s speed-first approach — medium rocker, electric acceleration, and a bottom that transitions into deep double concave through the fins. Built for unparalleled speed and flow in a wide range of wave sizes; the DNA behind later Inferno FT pro models.",
    videoUrl: yt("MO73vfk2MKk"),
    sourceName: "Sharp Eye Surfboards",
    sourceUrl: "https://sharpeyesurfboards.com/products/inferno-ft",
  },
  {
    id: "se-disco-ii",
    match: ["disco"],
    title: "Sharp Eye Disco II",
    boardType: "performance everyday shortboard",
    description:
      "Disco II is Sharp Eye’s everyday performance shortboard — medium entry rocker into a flatter exit, medium rails, and a single-to-deep-double concave for instant speed from takeoff. Tuned for electric performance in the average conditions most surfers ride week to week.",
    videoUrl: yt("MO73vfk2MKk"),
    sourceName: "Sharp Eye Surfboards",
    sourceUrl: "https://sharpeyesurfboards.com/",
  },

  // —— Indio ——
  {
    id: "indio-dab",
    match: ["endurance", "dab"],
    title: "Indio Endurance Dab",
    boardType: "beginner / intermediate hybrid",
    description:
      "The Indio Endurance Dab is a durable epoxy hybrid for progressing beginners and intermediates — stable outline, easy paddle, and forgiving rails in the Endurance construction. A confidence board for Carcavelos learners moving off soft tops into harder boards.",
    videoUrl: yt("jUrVrXiO7Sk"),
    sourceName: "Indio Surfboards",
    sourceUrl: "https://indiosurfboards.com/",
  },
  {
    id: "indio-egg",
    match: ["endurance", "egg"],
    title: "Indio Endurance The Egg",
    boardType: "egg / mid-length",
    description:
      "Indio’s Endurance Egg brings classic egg glide into tough epoxy construction — rounded template for trim and easy catch-rate, ideal for intermediates building flow and style in waist-to-chest-high surf.",
    videoUrl: yt("jUrVrXiO7Sk"),
    sourceName: "Indio Surfboards",
    sourceUrl: "https://indiosurfboards.com/",
  },
  {
    id: "indio-mid",
    match: ["endurance", "mid"],
    title: "Indio Endurance Mid Length",
    boardType: "mid-length",
    description:
      "The Endurance Mid Length is Indio’s paddle-friendly mid for intermediates — longer rail for glide, epoxy toughness for beachbreak abuse, and enough maneuverability for cutbacks and trim lines as you progress.",
    videoUrl: yt("jUrVrXiO7Sk"),
    sourceName: "Indio Surfboards",
    sourceUrl: "https://indiosurfboards.com/",
  },
  {
    id: "indio-trim-machine",
    match: ["trim", "machine"],
    title: "Indio Endurance Trim Machine",
    boardType: "longboard",
    description:
      "Trim Machine is Indio’s longboard-minded Endurance model — maximum glide and nose-trim potential in a durable epoxy build for learners and classic-style surfers.",
    videoUrl: yt("jUrVrXiO7Sk"),
    sourceName: "Indio Surfboards",
    sourceUrl: "https://indiosurfboards.com/",
  },
  {
    id: "indio-racer",
    match: ["indio", "racer"],
    title: "Indio Racer",
    boardType: "performance hybrid",
    description:
      "The Indio Racer is a performance-leaning hybrid for intermediates wanting more speed and shorter-board feel while keeping paddle-friendly volume.",
    videoUrl: yt("jUrVrXiO7Sk"),
    sourceName: "Indio Surfboards",
    sourceUrl: "https://indiosurfboards.com/",
  },

  // —— Torq ——
  {
    id: "torq-delpero",
    match: ["delpero"],
    title: "Torq Delpero",
    boardType: "longboard",
    description:
      "Torq’s Delpero longboards (Classic TEC / Pro ACT) are modern epoxy logs for nose rides and stylish trim. Lightweight Torq construction makes a 9’+ board easier to carry and paddle — great for classic surfing at Carcavelos on smaller, longer days.",
    videoUrl: yt("jUrVrXiO7Sk"),
    sourceName: "Torq Surfboards",
    sourceUrl: "https://www.torq-surfboards.com/",
  },

  // —— Softech ——
  {
    id: "softech-middie",
    match: ["middie"],
    title: "Softech The Middie",
    boardType: "softboard mid-length",
    description:
      "Softech’s Middie epoxy soft series bridges soft-top safety with mid-length performance — FCS II compatible, durable for learners and intermediates, and fun when you want glide without a full hardboard commitment.",
    videoUrl: yt("jUrVrXiO7Sk"),
    sourceName: "Softech Softboards",
    sourceUrl: "https://www.softechsoftboards.com/",
  },

  // —— Takayama ——
  {
    id: "takayama-in-the-pink",
    match: ["takayama"],
    title: "Donald Takayama In The Pink",
    boardType: "longboard / single fin",
    description:
      "Donald Takayama’s In The Pink is a classic single-fin log — traditional outline and foil for nose-riding, hanging five, and pure trim. A heritage longboard for surfers chasing timeless style on smaller, lined-up days.",
    videoUrl: yt("jUrVrXiO7Sk"),
    sourceName: "Donald Takayama",
    sourceUrl: "https://www.donaldtakayama.com/",
  },

  // —— NSP ——
  {
    id: "nsp-protech-fish",
    match: ["nsp", "fish"],
    title: "NSP Protech Fish",
    boardType: "fish",
    description:
      "NSP Protech Fish offers durable epoxy fish performance at an accessible price — wide outline for speed in weak waves, Futures compatible, tough enough for regular beachbreak use.",
    videoUrl: yt("jUrVrXiO7Sk"),
    sourceName: "NSP Surfboards",
    sourceUrl: "https://www.nspsurfboards.com/",
  },

  // —— Gerry Lopez ——
  {
    id: "lopez-little-darwin",
    match: ["little", "darwin"],
    title: "Gerry Lopez Little Darwin",
    boardType: "performance mid / step-up hybrid",
    description:
      "Gerry Lopez Little Darwin carries pipe-influenced design cues into a versatile mid/step-up hybrid — confident in steeper faces with Lopez’s signature flow-first philosophy.",
    videoUrl: yt("cOHc2TSvCI8"),
    sourceName: "Gerry Lopez Surfboards",
    sourceUrl: "https://www.gerrylopezsurfboards.com/",
  },
  {
    id: "lopez-something-fishy",
    match: ["something", "fishy"],
    title: "Gerry Lopez Something Fishy",
    boardType: "fish",
    description:
      "Something Fishy is Lopez’s take on a fun, planing fish — speed in soft waves with enough control for stylish lines. A playful quiver addition with classic Gerry DNA.",
    videoUrl: yt("cOHc2TSvCI8"),
    sourceName: "Gerry Lopez Surfboards",
    sourceUrl: "https://www.gerrylopezsurfboards.com/",
  },

  // —— Thunderbolt / Harley Ingleby ——
  {
    id: "thunderbolt-mid",
    match: ["harley", "ingleby"],
    title: "Thunderbolt Harley Ingleby Mid",
    boardType: "mid-length",
    description:
      "Harley Ingleby’s Thunderbolt mid-lengths blend high-performance mid surfing with advanced carbon construction — light, fast, and precise for advanced intermediates chasing modern mid-length surfing.",
    videoUrl: yt("cOHc2TSvCI8"),
    sourceName: "Thunderbolt Surfboards",
    sourceUrl: "https://thunderboltresearch.com/",
  },

  // —— Twins Bros ——
  {
    id: "twins-billy-belly",
    match: ["billy", "belly"],
    title: "Twins Bros Billy Belly",
    boardType: "hybrid / funboard",
    description:
      "Billy Belly is a Twins Bros fun hybrid shaped for Portuguese conditions — friendly volume, easy catch-rate, and playful rails for intermediates around Carcavelos and the Lisbon coast.",
    videoUrl: yt("jUrVrXiO7Sk"),
    sourceName: "Twins Bros Surfboards",
    sourceUrl: "https://www.jhonnysurfstore.com/loja?categoryGroup=surfboards&q=twins",
  },
  {
    id: "twins-monster",
    match: ["monster", "twin"],
    title: "Twins Bros Monster Twin",
    boardType: "twin fin",
    description:
      "Monster Twin from Twins Bros is a high-volume twin for speed and loose, skatey turns in average beachbreak surf — local Portuguese shaping for everyday fun.",
    videoUrl: yt("jUrVrXiO7Sk"),
    sourceName: "Twins Bros Surfboards",
    sourceUrl: "https://www.jhonnysurfstore.com/loja?categoryGroup=surfboards&q=twins",
  },
  {
    id: "twins-mr-freaky",
    match: ["freaky"],
    title: "Twins Bros Mr Freaky / Freakly",
    boardType: "mid-length hybrid",
    description:
      "Mr Freaky is a Twins Bros mid/fun shape with generous volume for paddle and flow — ideal progressing intermediates who want a local-shaped daily driver.",
    videoUrl: yt("jUrVrXiO7Sk"),
    sourceName: "Twins Bros Surfboards",
    sourceUrl: "https://www.jhonnysurfstore.com/loja?categoryGroup=surfboards&q=twins",
  },
  {
    id: "twins-mr-freakly",
    match: ["freakl"],
    title: "Twins Bros Mr Freaky / Freakly",
    boardType: "mid-length hybrid",
    description:
      "Mr Freaky is a Twins Bros mid/fun shape with generous volume for paddle and flow — ideal progressing intermediates who want a local-shaped daily driver.",
    videoUrl: yt("jUrVrXiO7Sk"),
    sourceName: "Twins Bros Surfboards",
    sourceUrl: "https://www.jhonnysurfstore.com/loja?categoryGroup=surfboards&q=twins",
  },
  {
    id: "twins-bros-generic",
    match: ["twinsbros"],
    title: "Twins Bros Surfboards",
    boardType: "local performance / funboard",
    description:
      "A Twins Bros shape from the local Portuguese label stocked at Jhonny Surf Store — designed with Lisbon-coast waves in mind. Check the listed dims and fin system, then ask the shop team which Twins model best matches your weight and local forecast.",
    videoUrl: yt("jUrVrXiO7Sk"),
    sourceName: "Twins Bros Surfboards",
    sourceUrl: "https://www.jhonnysurfstore.com/loja?categoryGroup=surfboards&q=twins",
  },
  {
    id: "twins-bros-spaced",
    match: ["twins", "bros"],
    title: "Twins Bros Surfboards",
    boardType: "local performance / funboard",
    description:
      "A Twins Bros shape from the local Portuguese label stocked at Jhonny Surf Store — designed with Lisbon-coast waves in mind. Check the listed dims and fin system, then ask the shop team which Twins model best matches your weight and local forecast.",
    videoUrl: yt("jUrVrXiO7Sk"),
    sourceName: "Twins Bros Surfboards",
    sourceUrl: "https://www.jhonnysurfstore.com/loja?categoryGroup=surfboards&q=twins",
  },
  {
    id: "twins-speed",
    match: ["twins", "speed"],
    title: "Twins Bros Speed",
    boardType: "performance shortboard",
    description:
      "Twins Bros Speed is a more performance-oriented shortboard from the local label — tighter outline for intermediate-advanced surfers wanting a responsive daily shortboard.",
    videoUrl: yt("jUrVrXiO7Sk"),
    sourceName: "Twins Bros Surfboards",
    sourceUrl: "https://www.jhonnysurfstore.com/loja?categoryGroup=surfboards&q=twins",
  },
  {
    id: "twins-retro-jewels",
    match: ["retro", "jewels"],
    title: "Twins Bros Retro Jewels",
    boardType: "retro mid / funboard",
    description:
      "Retro Jewels Custom brings classic mid/funboard curves with Twins Bros local craft — trim, cutbacks, and easy paddle for stylish sessions.",
    videoUrl: yt("jUrVrXiO7Sk"),
    sourceName: "Twins Bros Surfboards",
    sourceUrl: "https://www.jhonnysurfstore.com/loja?categoryGroup=surfboards&q=twins",
  },

  // —— Waveborn ——
  {
    id: "waveborn-mad-cat",
    match: ["mad", "cat"],
    title: "Waveborn Mad Cat",
    boardType: "performance hybrid",
    description:
      "Waveborn Mad Cat is a hybrid performance shape — volume for paddle with enough outline bite for progressive surfing in everyday Portuguese surf.",
    videoUrl: yt("jUrVrXiO7Sk"),
    sourceName: "Waveborn",
    sourceUrl: "https://www.jhonnysurfstore.com/loja?categoryGroup=surfboards&q=waveborn",
  },
  {
    id: "waveborn-coffin",
    match: ["coffin"],
    title: "Waveborn The Coffin",
    boardType: "performance hybrid",
    description:
      "The Coffin is a Waveborn hybrid with a fuller template for speed and forgiveness — built for fun in average beachbreak conditions.",
    videoUrl: yt("jUrVrXiO7Sk"),
    sourceName: "Waveborn",
    sourceUrl: "https://www.jhonnysurfstore.com/loja?categoryGroup=surfboards&q=waveborn",
  },
  {
    id: "waveborn-molotov",
    match: ["molotov"],
    title: "Waveborn The Molotov",
    boardType: "performance shortboard",
    description:
      "The Molotov is Waveborn’s more explosive shortboard option — tighter dims for intermediate-advanced surfers wanting a lively daily driver.",
    videoUrl: yt("jUrVrXiO7Sk"),
    sourceName: "Waveborn",
    sourceUrl: "https://www.jhonnysurfstore.com/loja?categoryGroup=surfboards&q=waveborn",
  },
  {
    id: "waveborn-rocket",
    match: ["waveborn", "rocket"],
    title: "Waveborn The Rocket",
    boardType: "performance hybrid",
    description:
      "The Rocket from Waveborn prioritises down-the-line speed with a hybrid outline — great for weaker days when you still want to generate pace.",
    videoUrl: yt("jUrVrXiO7Sk"),
    sourceName: "Waveborn",
    sourceUrl: "https://www.jhonnysurfstore.com/loja?categoryGroup=surfboards&q=waveborn",
  },

  // —— Onboard ——
  {
    id: "onboard-smoothie",
    match: ["smoothie"],
    title: "Onboard Smoothie",
    boardType: "mid-length",
    description:
      "Onboard Smoothie is a mid-length for easy glide and smooth rail transitions — local Portuguese shaping tuned for Lisbon coast conditions.",
    videoUrl: yt("jUrVrXiO7Sk"),
    sourceName: "Onboard Surfboards",
    sourceUrl: "https://www.jhonnysurfstore.com/loja?categoryGroup=surfboards&q=onboard",
  },
  {
    id: "onboard-egg",
    match: ["onboard", "egg"],
    title: "Onboard Egg",
    boardType: "egg",
    description:
      "Onboard Egg delivers classic egg paddle and trim with contemporary epoxy builds — forgiving and fun for intermediates.",
    videoUrl: yt("jUrVrXiO7Sk"),
    sourceName: "Onboard Surfboards",
    sourceUrl: "https://www.jhonnysurfstore.com/loja?categoryGroup=surfboards&q=onboard",
  },
  {
    id: "onboard-mini-bus",
    match: ["mini", "bus"],
    title: "Onboard Mini Bus",
    boardType: "mid-length",
    description:
      "Mini Bus is Onboard’s mid funboard — stable, paddle-rich, and easy to progress on in Carcavelos-size surf.",
    videoUrl: yt("jUrVrXiO7Sk"),
    sourceName: "Onboard Surfboards",
    sourceUrl: "https://www.jhonnysurfstore.com/loja?categoryGroup=surfboards&q=onboard",
  },
  {
    id: "onboard-onetool",
    match: ["onetool"],
    title: "Onboard Onetool",
    boardType: "performance hybrid",
    description:
      "Onetool aims to cover most of your week — a hybrid Onboard shape balancing paddle, speed, and turnability for Portuguese everyday waves.",
    videoUrl: yt("jUrVrXiO7Sk"),
    sourceName: "Onboard Surfboards",
    sourceUrl: "https://www.jhonnysurfstore.com/loja?categoryGroup=surfboards&q=onboard",
  },
  {
    id: "onboard-ss",
    match: ["onboard", "ss1"],
    title: "Onboard SS series",
    boardType: "performance shortboard",
    description:
      "Onboard SS1.0 / SS1.5 are performance shortboard options from the local label — responsive outlines for intermediate-advanced surfers.",
    videoUrl: yt("jUrVrXiO7Sk"),
    sourceName: "Onboard Surfboards",
    sourceUrl: "https://www.jhonnysurfstore.com/loja?categoryGroup=surfboards&q=onboard",
  },
  {
    id: "onboard-generic",
    match: ["onboard"],
    title: "Onboard Surfboards",
    boardType: "local performance / hybrid",
    description:
      "An Onboard surfboard shaped for Portuguese conditions — check dims and fins on this page, then confirm with the Jhonny team which Onboard model fits your surfing.",
    videoUrl: yt("jUrVrXiO7Sk"),
    sourceName: "Onboard Surfboards",
    sourceUrl: "https://www.jhonnysurfstore.com/loja?categoryGroup=surfboards&q=onboard",
  },
  {
    id: "onboard-twin",
    match: ["onboard", "twin"],
    title: "Onboard Twin",
    boardType: "twin fin",
    description:
      "Onboard Twin is a high-volume twin for loose, fast surfing in average beachbreaks — playful local alternative fin setup.",
    videoUrl: yt("jUrVrXiO7Sk"),
    sourceName: "Onboard Surfboards",
    sourceUrl: "https://www.jhonnysurfstore.com/loja?categoryGroup=surfboards&q=onboard",
  },
  {
    id: "onboard-custom",
    match: ["onboard", "custom"],
    title: "Onboard Custom",
    boardType: "custom / performance",
    description:
      "Onboard Custom pieces are locally shaped one-offs — check dims and fins in-store with the Jhonny team to match the board to your surfing and the day’s forecast.",
    videoUrl: yt("jUrVrXiO7Sk"),
    sourceName: "Onboard Surfboards",
    sourceUrl: "https://www.jhonnysurfstore.com/loja?categoryGroup=surfboards&q=onboard",
  },

  // —— Other specialty ——
  {
    id: "timmy-patterson",
    match: ["timmy", "patterson"],
    title: "Timmy Patterson",
    boardType: "performance hybrid / mid",
    description:
      "Timmy Patterson shapes are known for refined performance hybrids — this Blue Fin mid/hybrid brings paddle and flow with quality craftsmanship for intermediate-advanced surfers.",
    videoUrl: yt("cOHc2TSvCI8"),
    sourceName: "Timmy Patterson Surfboards",
    sourceUrl: "https://www.timmypatterson.com/",
  },
  {
    id: "mg-spud",
    match: ["spud"],
    title: "MG Spud",
    boardType: "performance groveler",
    description:
      "The Spud is a compact performance groveler — shorter, thicker dims for speed in weak waves with enough rocker to still do proper turns when a bank appears.",
    videoUrl: yt("jUrVrXiO7Sk"),
    sourceName: "Jhonny Surf Store",
    sourceUrl: "https://www.jhonnysurfstore.com/loja?categoryGroup=surfboards",
  },
  {
    id: "yerxa-spicy",
    match: ["yerxa", "spicy"],
    title: "Yerxa Spicy",
    boardType: "performance shortboard",
    description:
      "Yerxa Spicy is a refined performance shortboard — lower volume and critical rocker for advanced surfers wanting a spicy daily shortboard in better surf.",
    videoUrl: yt("MO73vfk2MKk"),
    sourceName: "Yerxa Surfboards",
    sourceUrl: "https://www.jhonnysurfstore.com/loja?categoryGroup=surfboards&q=yerxa",
  },
  {
    id: "arenque-nd21",
    match: ["arenque"],
    title: "Arenque ND21",
    boardType: "performance shortboard",
    description:
      "Arenque ND21 is a performance shortboard stocked by Jhonny Surf Store — check the listed dims and FCS II setup, then confirm rocker and volume with the shop team for your weight and local wave range.",
    videoUrl: yt("MO73vfk2MKk"),
    sourceName: "Jhonny Surf Store",
    sourceUrl: "https://www.jhonnysurfstore.com/loja?categoryGroup=surfboards",
  },
  {
    id: "osus",
    match: ["o", "sus"],
    title: "O’Sus",
    boardType: "performance hybrid",
    description:
      "O’Sus EPS boards offer lightweight epoxy performance hybrids — durable, paddle-friendly options for intermediates around the Lisbon coast.",
    videoUrl: yt("jUrVrXiO7Sk"),
    sourceName: "Jhonny Surf Store",
    sourceUrl: "https://www.jhonnysurfstore.com/loja?categoryGroup=surfboards",
  },
  {
    id: "dhd-juliette",
    match: ["juliette"],
    title: "DHD Juliette",
    boardType: "performance shortboard",
    description:
      "DHD Juliette is a performance shortboard from Darren Handley’s label — refined rocker and foil for intermediate-advanced surfers wanting Australian high-performance DNA in everyday-to-punchy waves.",
    videoUrl: yt("MO73vfk2MKk"),
    sourceName: "DHD Surfboards",
    sourceUrl: "https://www.dhdsurfboards.com/",
  },
];

export const SURFBOARD_BRAND_DEFAULTS: Array<{
  brandMatch: string[];
  sourceName: string;
  sourceUrl: string;
  videoUrl: string;
  descriptionLead: string;
}> = [
  {
    brandMatch: ["channel island", "al merrick"],
    sourceName: "Channel Islands Surfboards",
    sourceUrl: "https://cisurfboards.com/",
    videoUrl: yt("oacBXoxIw1s"),
    descriptionLead:
      "A Channel Islands / Al Merrick performance shape — Britt and the CI team’s approach to modern shortboard design for real-world waves.",
  },
  {
    brandMatch: ["firewire", "slater", "machado"],
    sourceName: "Firewire Surfboards",
    sourceUrl: "https://www.firewiresurfboards.com/",
    videoUrl: yt("vXyU298f0vk"),
    descriptionLead:
      "A Firewire (or Slater Designs / Machado) model in advanced lightweight construction — lively flex, durable builds, and progressive outlines.",
  },
  {
    brandMatch: ["lost", "mayhem"],
    sourceName: "Lost Surfboards",
    sourceUrl: "https://lostsurfboards.net/",
    videoUrl: yt("MO73vfk2MKk"),
    descriptionLead:
      "A Lost / Mayhem performance design from Matt Biolos — speed-first outlines tuned with elite team feedback.",
  },
  {
    brandMatch: ["hayden", "hypto"],
    sourceName: "Haydenshapes",
    sourceUrl: "https://www.haydenshapes.com/",
    videoUrl: yt("MO73vfk2MKk"),
    descriptionLead:
      "A Hayden Shapes model — FutureFlex/epoxy performance with Hayden Cox’s hybrid design philosophy.",
  },
  {
    brandMatch: ["sharp", "sharpeye"],
    sourceName: "Sharp Eye Surfboards",
    sourceUrl: "https://sharpeyesurfboards.com/",
    videoUrl: yt("MO73vfk2MKk"),
    descriptionLead:
      "A Sharp Eye performance shortboard — electric speed and acceleration associated with Filipe Toledo’s pro models.",
  },
  {
    brandMatch: ["indio"],
    sourceName: "Indio Surfboards",
    sourceUrl: "https://indiosurfboards.com/",
    videoUrl: yt("jUrVrXiO7Sk"),
    descriptionLead:
      "An Indio epoxy board — durable, accessible shapes for beginners through intermediates.",
  },
  {
    brandMatch: ["torq"],
    sourceName: "Torq Surfboards",
    sourceUrl: "https://www.torq-surfboards.com/",
    videoUrl: yt("jUrVrXiO7Sk"),
    descriptionLead:
      "A Torq epoxy surfboard — lightweight, tough construction for classic and progressive surfing.",
  },
  {
    brandMatch: ["softech"],
    sourceName: "Softech Softboards",
    sourceUrl: "https://www.softechsoftboards.com/",
    videoUrl: yt("jUrVrXiO7Sk"),
    descriptionLead:
      "A Softech soft/epoxy board — safer progression with modern fin systems and durable construction.",
  },
  {
    brandMatch: ["nsp"],
    sourceName: "NSP Surfboards",
    sourceUrl: "https://www.nspsurfboards.com/",
    videoUrl: yt("jUrVrXiO7Sk"),
    descriptionLead:
      "An NSP epoxy surfboard — durable Protech/Element constructions for everyday surfing.",
  },
];

export function normalizeSurfboardHaystack(brand?: string | null, name?: string | null) {
  return `${brand || ""} ${name || ""}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function haystackHasToken(haystack: string, token: string) {
  const normalized = token.toLowerCase().trim();
  if (!normalized) return false;
  if (normalized.includes(" ")) return haystack.includes(normalized);
  // Whole-word match so short tokens like "s" do not hit "seaside".
  return new RegExp(`(^|\\s)${normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`).test(
    haystack
  );
}

export function matchSurfboardModel(brand?: string | null, name?: string | null) {
  const haystack = normalizeSurfboardHaystack(brand, name);
  if (!haystack) return null;

  let best: SurfboardModelEnrichment | null = null;
  let bestScore = -1;

  for (const entry of SURFBOARD_MODEL_CATALOG) {
    if (!entry.match.every((token) => haystackHasToken(haystack, token))) continue;
    const score = entry.match.join(" ").length;
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }

  return best;
}

export function matchSurfboardBrandDefault(brand?: string | null, name?: string | null) {
  const haystack = normalizeSurfboardHaystack(brand, name);
  return (
    SURFBOARD_BRAND_DEFAULTS.find((entry) =>
      entry.brandMatch.some((token) => haystack.includes(token))
    ) || null
  );
}

export function youtubeVideoId(url?: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace("/", "") || null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      if (id) return id;
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" || parts[0] === "shorts") return parts[1] || null;
    }
  } catch {
    return null;
  }
  return null;
}
