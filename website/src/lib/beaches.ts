export type Beach = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  cam: string;
};

const CAM = "https://beachcam.meo.pt/livecams";

export const BEACHES: Beach[] = [
  { id: "carcavelos", name: "Carcavelos", lat: 38.679, lon: -9.337, cam: `${CAM}/praia-de-carcavelos/` },
  { id: "caparica", name: "Costa da Caparica", lat: 38.64, lon: -9.235, cam: `${CAM}/costa-da-caparica-tarquinio/` },
  { id: "guincho", name: "Guincho", lat: 38.732, lon: -9.473, cam: `${CAM}/praia-do-guincho-sul/` },
  { id: "ericeira", name: "Ericeira", lat: 38.984, lon: -9.42, cam: `${CAM}/ericeira-praia-do-sul/` },
  { id: "supertubos", name: "Supertubos", lat: 39.342, lon: -9.366, cam: `${CAM}/peniche-supertubos-molhe-leste/` },
  { id: "nazare", name: "Nazaré", lat: 39.605, lon: -9.085, cam: `${CAM}/praia-do-norte/` },
  { id: "sagres", name: "Sagres", lat: 37.009, lon: -8.949, cam: `${CAM}/` },
];

export type BeachConditions = {
  id: string;
  name: string;
  cam: string;
  waveHeight: number | null;
  wavePeriod: number | null;
  waveDirection: number | null;
  windSpeed: number | null;
  windDirection: number | null;
};

export type SurfResponse = {
  updatedAt: string;
  beaches: BeachConditions[];
};
