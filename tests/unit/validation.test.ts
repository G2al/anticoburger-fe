import { describe, expect, it } from "vitest";
import { buildIcs } from "@/lib/ics";
import { EMPTY_GUEST_DETAILS, guestDetailsSchema, toReservationInput, zodResolver } from "@/lib/validation";

const valid = { ...EMPTY_GUEST_DETAILS, first_name: "D'Artagnan", last_name: "Rossi-Bianchi", phone: "333 123 4567" };

describe("guestDetailsSchema", () => {
  it("accetta apostrofi, accenti e trattini e campi facoltativi vuoti", () => {
    expect(guestDetailsSchema.safeParse({ ...valid, first_name: "Niccolò" }).success).toBe(true);
    expect(guestDetailsSchema.safeParse(valid).success).toBe(true);
  });

  it("richiede nome, cognome e telefono con messaggi in italiano", () => {
    const result = guestDetailsSchema.safeParse({ ...EMPTY_GUEST_DETAILS, first_name: "   " });
    expect(result.success).toBe(false);
    const messages = Object.fromEntries(result.error!.issues.map((issue) => [issue.path[0], issue.message]));
    expect(messages).toEqual({
      first_name: "Inserisci il nome.",
      last_name: "Inserisci il cognome.",
      phone: "Inserisci il numero di telefono.",
    });
  });

  it("applica le lunghezze massime del backend", () => {
    const long = (n: number) => "a".repeat(n);
    expect(guestDetailsSchema.safeParse({ ...valid, first_name: long(100) }).success).toBe(true);
    expect(guestDetailsSchema.safeParse({ ...valid, first_name: long(101) }).success).toBe(false);
    expect(guestDetailsSchema.safeParse({ ...valid, notes: long(500) }).success).toBe(true);
    expect(guestDetailsSchema.safeParse({ ...valid, notes: long(501) }).success).toBe(false);
    expect(guestDetailsSchema.safeParse({ ...valid, email: `${long(186)}@x.it` }).success).toBe(false);
  });

  it("valida telefono ed email", () => {
    expect(guestDetailsSchema.safeParse({ ...valid, phone: "123" }).success).toBe(false);
    expect(guestDetailsSchema.safeParse({ ...valid, email: "non-email" }).success).toBe(false);
    expect(guestDetailsSchema.safeParse({ ...valid, email: "mario@example.com" }).success).toBe(true);
  });

  it("costruisce il corpo della POST con trim e null per i facoltativi", () => {
    expect(
      toReservationInput(
        { ...valid, first_name: "  Mario ", email: " ", notes: "" },
        { date: "2026-10-20", time: "20:30", partySize: 2 },
      ),
    ).toEqual({
      date: "2026-10-20",
      time: "20:30",
      party_size: 2,
      first_name: "Mario",
      last_name: "Rossi-Bianchi",
      phone: "333 123 4567",
      email: null,
      notes: null,
    });
  });

  it("zodResolver restituisce gli errori per campo", async () => {
    const resolver = zodResolver(guestDetailsSchema);
    const result = await resolver({ ...valid, phone: "abc" }, undefined, {
      fields: {},
      shouldUseNativeValidation: false,
    });
    expect(result.errors.phone?.message).toContain("non valido");
  });
});

describe("buildIcs", () => {
  it("usa gli istanti UTC e non contiene il token", () => {
    const ics = buildIcs(
      {
        reference: "abc",
        starts_at: "2026-10-25T20:30:00+01:00",
        ends_at: "2026-10-25T22:00:00+01:00",
        party_size: 2,
      },
      new Date("2026-10-16T08:00:00Z"),
    );
    expect(ics).toContain("DTSTART:20261025T193000Z");
    expect(ics).toContain("DTEND:20261025T210000Z");
    expect(ics).toContain("UID:abc@anticoburger.it");
    expect(ics).not.toMatch(/token/i);
  });
});
