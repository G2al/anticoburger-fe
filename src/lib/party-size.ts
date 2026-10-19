import { restaurant } from "@/config/restaurant";

/**
 * Numeri di persone prenotabili online: quelli accettati dal backend, entro il limite del locale.
 * Oltre il limite si prenota solo per telefono.
 */
export function onlinePartySizes(partySizes: readonly number[]): number[] {
  return partySizes.filter((size) => size <= restaurant.maxOnlinePartySize);
}
