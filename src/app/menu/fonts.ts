import { Great_Vibes, Playfair_Display } from "next/font/google";

// Font solo per la pagina menu: non pesano sul resto dell'app.

/** Titoli e prezzi: serif ad alto contrasto, come nella grafica del menu. */
export const menuSerif = Playfair_Display({
  variable: "--font-menu-serif",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

/** Corsivo calligrafico per la scritta "Special", come nella grafica originale. */
export const menuScript = Great_Vibes({
  variable: "--font-menu-script",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});
