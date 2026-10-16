// Dati statici del ristorante: le API non li forniscono (FRONTEND_HANDOFF.md §11).

const address = "Via Francesco Cilea, 88, 81031 Aversa (CE)";
// Testo usato per cercare il ristorante su Google Maps.
const mapsQuery = encodeURIComponent(`Antico Burger, Via Francesco Cilea 88, 81031 Aversa CE`);

export const restaurant = {
  name: "Antico Burger",
  address,
  phoneDisplay: "+39 376 253 7179",
  phoneHref: "tel:+393762537179",
  maps: {
    /** Mappa incorporabile senza chiave API. */
    embedUrl: `https://maps.google.com/maps?q=${mapsQuery}&z=16&hl=it&output=embed`,
    /** Apre la scheda del luogo in Google Maps (app su mobile). */
    placeUrl: `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`,
    /** Avvia le indicazioni stradali dalla posizione dell'utente. */
    directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`,
  },
  /** ⚠️ SEGNAPOSTO: orari indicativi da confermare, non usati per calcolare la disponibilità. */
  openingHours: [
    { days: "Martedì – Domenica", hours: "19:00 – 23:30" },
    { days: "Lunedì", hours: "Chiuso" },
  ],
} as const;
