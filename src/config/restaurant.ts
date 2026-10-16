// Dati statici del ristorante: le API non li forniscono (FRONTEND_HANDOFF.md §11).
// ⚠️ SEGNAPOSTO — sostituire indirizzo, telefono e orari con i valori reali prima della pubblicazione.

export const restaurant = {
  name: "Antico Burger",
  /** SEGNAPOSTO */
  address: "Via Esempio 1, 00000 Città",
  /** SEGNAPOSTO: numero mostrato e usato per il link tel: */
  phoneDisplay: "+39 000 000 0000",
  phoneHref: "tel:+390000000000",
  /** SEGNAPOSTO: orari indicativi, non usati per calcolare la disponibilità. */
  openingHours: [
    { days: "Martedì – Domenica", hours: "19:00 – 23:30" },
    { days: "Lunedì", hours: "Chiuso" },
  ],
  /** Diventa `false` quando i dati sopra sono quelli reali. */
  isPlaceholder: true,
} as const;
