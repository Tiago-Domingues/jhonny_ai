export type Athlete = {
  handle: string;
  name: string;
  url: string;
  photo: string;
  instagramAvatarUrl: string;
  bio: string;
  couponCode: string;
};

export function athleteCouponCode(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toUpperCase();
}

function athlete(input: Omit<Athlete, "couponCode" | "instagramAvatarUrl">): Athlete {
  return {
    ...input,
    instagramAvatarUrl: `/api/instagram/${encodeURIComponent(input.handle)}/avatar`,
    couponCode: athleteCouponCode(input.name),
  };
}

// Photos: API/static media can replace these paths; the UI keeps a branded
// fallback so every athlete card remains visually complete.
export const ATHLETES: Athlete[] = [
  athlete({
    handle: "madalenamguerreiro",
    name: "Madalena Guerreiro",
    url: "https://www.instagram.com/madalenamguerreiro",
    photo: "/brand/athletes/madalenamguerreiro.svg",
    bio: "Surfista da equipa JSS · Carcavelos",
  }),
  athlete({
    handle: "hortafrancisco",
    name: "Francisco Horta",
    url: "https://www.instagram.com/hortafrancisco",
    photo: "/brand/athletes/hortafrancisco.svg",
    bio: "Rider local das ondas de Carcavelos",
  }),
  athlete({
    handle: "tomasslacerda",
    name: "Tomás Lacerda",
    url: "https://www.instagram.com/tomasslacerda",
    photo: "/brand/athletes/tomasslacerda.svg",
    bio: "Jovem talento da equipa JSS",
  }),
  athlete({
    handle: "miguel_kilford",
    name: "Miguel Kilford",
    url: "https://www.instagram.com/miguel_kilford",
    photo: "/brand/athletes/miguel_kilford.svg",
    bio: "Surfista e rider da equipa JSS",
  }),
  athlete({
    handle: "erica_maximo_surf",
    name: "Érica Máximo",
    url: "https://www.instagram.com/erica_maximo_surf",
    photo: "/brand/athletes/erica_maximo_surf.svg",
    bio: "Surf no feminino · equipa JSS",
  }),
  athlete({
    handle: "bernardo_tome",
    name: "Bernardo Tomé",
    url: "https://www.instagram.com/bernardo_tome",
    photo: "/brand/athletes/bernardo_tome.svg",
    bio: "Surfista local da equipa JSS",
  }),
  athlete({
    handle: "mariohenriquezm",
    name: "Mário Henrique",
    url: "https://www.instagram.com/mariohenriquezm",
    photo: "/brand/athletes/mariohenriquezm.svg",
    bio: "Rider da equipa JSS, sempre na água",
  }),
  athlete({
    handle: "_antonio_dantas_",
    name: "António Dantas",
    url: "https://www.instagram.com/_antonio_dantas_",
    photo: "/brand/athletes/_antonio_dantas_.svg",
    bio: "Surfista local · equipa JSS",
  }),
  athlete({
    handle: "_joaodantas_",
    name: "João Dantas",
    url: "https://www.instagram.com/_joaodantas_",
    photo: "/brand/athletes/_joaodantas_.svg",
    bio: "Rider das ondas de Carcavelos",
  }),
  athlete({
    handle: "franciscoxixo",
    name: "Francisco Xixo",
    url: "https://www.instagram.com/franciscoxixo",
    photo: "/brand/athletes/franciscoxixo.svg",
    bio: "Jovem talento da equipa JSS",
  }),
  athlete({
    handle: "xico.mittermayer",
    name: "Xico Mittermayer",
    url: "https://www.instagram.com/xico.mittermayer",
    photo: "/brand/athletes/xico.mittermayer.svg",
    bio: "Surfista da equipa JSS",
  }),
  athlete({
    handle: "tomasbettencourt",
    name: "Tomás Bettencourt",
    url: "https://www.instagram.com/tomasbettencourt",
    photo: "/brand/athletes/tomasbettencourt.svg",
    bio: "Rider local · equipa JSS",
  }),
  athlete({
    handle: "gagau.pereira",
    name: "Gagau Pereira",
    url: "https://www.instagram.com/gagau.pereira",
    photo: "/brand/athletes/gagau.pereira.svg",
    bio: "Surf na equipa JSS",
  }),
  athlete({
    handle: "_melendezzz",
    name: "Andres Melendez",
    url: "https://www.instagram.com/_melendezzz",
    photo: "/brand/athletes/_melendezzz.svg",
    bio: "Rider da equipa JSS",
  }),
];
