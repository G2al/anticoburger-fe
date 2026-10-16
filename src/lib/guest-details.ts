// Tipo e valori iniziali dei dati anagrafici, senza dipendenze: usati dalla bozza del flusso
// senza caricare Zod (che arriva solo con lo step "I tuoi dati").

export type GuestDetails = {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  notes: string;
};

export const EMPTY_GUEST_DETAILS: GuestDetails = {
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  notes: "",
};

export const GUEST_FIELDS = Object.keys(EMPTY_GUEST_DETAILS) as (keyof GuestDetails)[];
