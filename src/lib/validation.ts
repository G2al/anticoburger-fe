import type { FieldErrors, FieldValues, Resolver } from "react-hook-form";
import { z } from "zod";
import type { CreateReservationInput } from "@/lib/api/types";
import { EMPTY_GUEST_DETAILS, GUEST_FIELDS, type GuestDetails } from "@/lib/guest-details";
import { isValidPhone, PHONE_MAX_LENGTH } from "@/lib/phone";

export { EMPTY_GUEST_DETAILS, GUEST_FIELDS, type GuestDetails };

// Stesse regole del backend (FRONTEND_HANDOFF.md §6.4). Il backend fa trim e trasforma "" in null.

export const LIMITS = { name: 100, phone: PHONE_MAX_LENGTH, email: 190, notes: 500 } as const;

export const guestDetailsSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, "Inserisci il nome.")
    .max(LIMITS.name, `Il nome può contenere al massimo ${LIMITS.name} caratteri.`),
  last_name: z
    .string()
    .trim()
    .min(1, "Inserisci il cognome.")
    .max(LIMITS.name, `Il cognome può contenere al massimo ${LIMITS.name} caratteri.`),
  phone: z
    .string()
    .trim()
    .min(1, "Inserisci il numero di telefono.")
    .max(LIMITS.phone, `Il numero può contenere al massimo ${LIMITS.phone} caratteri.`)
    .refine((value) => value === "" || isValidPhone(value), "Numero di telefono non valido. Esempio: 333 123 4567."),
  email: z
    .string()
    .trim()
    .max(LIMITS.email, `L'email può contenere al massimo ${LIMITS.email} caratteri.`)
    .refine((value) => value === "" || z.email().safeParse(value).success, "Indirizzo email non valido."),
  notes: z
    .string()
    .trim()
    .max(LIMITS.notes, `Le note possono contenere al massimo ${LIMITS.notes} caratteri.`),
});


export function toReservationInput(
  details: GuestDetails,
  selection: { date: string; time: string; partySize: number },
): CreateReservationInput {
  const parsed = guestDetailsSchema.parse(details);
  return {
    date: selection.date,
    time: selection.time,
    party_size: selection.partySize,
    first_name: parsed.first_name,
    last_name: parsed.last_name,
    phone: parsed.phone,
    email: parsed.email || null,
    notes: parsed.notes || null,
  };
}

/** Resolver minimale Zod → react-hook-form (evita @hookform/resolvers, incompatibile con zod 4 via peer). */
export function zodResolver<T extends FieldValues>(schema: z.ZodType<unknown, T>): Resolver<T> {
  return async (values) => {
    const result = await schema.safeParseAsync(values);
    if (result.success) return { values: result.data as T, errors: {} };

    const errors: Record<string, { type: string; message: string }> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".");
      if (key && !errors[key]) errors[key] = { type: issue.code, message: issue.message };
    }
    return { values: {}, errors: errors as FieldErrors<T> };
  };
}
