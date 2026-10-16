import { describe, expect, it } from "vitest";
import { isValidPhone, normalizePhone } from "@/lib/phone";

// Stessi casi verificati dal backend (FRONTEND_HANDOFF.md §6.4).
describe("normalizePhone", () => {
  it.each([
    ["333 123 4567", "+393331234567"],
    ["+39 3331234567", "+393331234567"],
    ["0039 3331234567", "+393331234567"],
    ["333-123.4567", "+393331234567"],
    ["(+39) 333 1234567", "+393331234567"],
    ["06 1234567", "+39061234567"],
    ["+39 06 1234567", "+39061234567"],
    ["0039 06 1234567", "+39061234567"],
    ["+44 20 7946 0958", "+442079460958"],
    ["0049 151 12345678", "+4915112345678"],
    ["333/1234567", "+393331234567"],
  ])("%s → %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each(["", "abc", "123", "+0123456789", "+12", "333 abc 4567", "+1234567890123456", "333123456789", "39 3331234567"])(
    "%j non è valido",
    (input) => {
      expect(normalizePhone(input)).toBeNull();
      expect(isValidPhone(input)).toBe(false);
    },
  );

  it("rifiuta input oltre 30 caratteri anche se normalizzabile", () => {
    expect(isValidPhone("3 3 3 1 2 3 4 5 6 7 . . . . . . . .")).toBe(false);
  });
});
