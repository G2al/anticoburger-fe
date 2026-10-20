# Orari nella home

La home legge `GET /api/v1/booking-hours` sul backend. Pubblicare prima il backend aggiornato e poi il frontend; senza endpoint mostra “Orari al momento non disponibili” e i contatti, senza ripiegare su orari statici.

Il backend restituisce `{ data: { timezone, days: [{ day_of_week, ranges: [{ first_booking_time, last_booking_time }] }] } }`, con sette giorni ISO (1 lunedì, 7 domenica). Una lista di fasce vuota indica il giorno di chiusura settimanale.

Le fasce provengono dai tavoli attivi con almeno una dimensione del gruppo ammessa. Gli intervalli sovrapposti vengono uniti, quelli separati restano distinti. Non sono gli orari di apertura del locale: sono le fasce configurate per gli arrivi delle prenotazioni. Le chiusure straordinarie e la disponibilità effettiva continuano a essere verificate nel calendario.

Non occorrono migrazioni o modifiche alla configurazione dei tavoli. Gli aggiornamenti nell’admin vengono letti dall’endpoint a ogni richiesta. La home mantiene i dati in memoria per cinque minuti e li aggiorna al ritorno sulla finestra quando scaduti; il service worker non conserva questo endpoint offline.
