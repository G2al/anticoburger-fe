/** Promozione in evidenza (home e menu). Per toglierla: `activePromo = null`, oppure lascia scadere `endsAt`. */
export type Promo = {
  id: string;
  title: string;
  /** Riga breve sotto il titolo nel banner. */
  summary: string;
  /** Locandina completa mostrata al tocco (in /public). */
  image: { src: string; width: number; height: number; alt: string };
  /** Dopo questo istante il banner sparisce da solo. */
  endsAt: string;
};

export const activePromo: Promo | null = {
  id: "2-anni-2026",
  title: "2 anni di Antico Burger",
  summary: "19 novembre dalle 18:30 · Antipasto + panino + bibita a 10€",
  image: {
    src: "/promo/2-anni.webp",
    width: 900,
    height: 1600,
    alt: "2 anni di Antico Burger, 19 novembre 2026 dalle ore 18:30: antipasto più panino a scelta tra Ispanico o Classicum più bibita, solo 10 euro.",
  },
  endsAt: "2026-11-20T00:00:00+01:00",
};
