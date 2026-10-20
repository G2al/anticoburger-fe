import { Playfair_Display } from "next/font/google";

// Font solo per la pagina menu: non pesano sul resto dell'app.

/** Titoli e prezzi: serif ad alto contrasto, come nella grafica del menu. */
export const menuSerif = Playfair_Display({
  variable: "--font-menu-serif",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

