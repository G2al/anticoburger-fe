"use client";

import { useSyncExternalStore } from "react";
import {
  getServerReservationsSnapshot,
  listStoredReservations,
  subscribeToReservations,
} from "@/lib/reservation-storage";

export function useStoredReservations() {
  return useSyncExternalStore(subscribeToReservations, listStoredReservations, getServerReservationsSnapshot);
}
