import { QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { domAnimation, LazyMotion } from "motion/react";
import type { ReactElement } from "react";
import { createQueryClient } from "@/lib/query";

/** Render con un QueryClient nuovo per ogni test (retry e default identici all'app). */
export function renderWithProviders(ui: ReactElement) {
  const queryClient = createQueryClient();
  const user = userEvent.setup();
  const result = render(
    <QueryClientProvider client={queryClient}>
      <LazyMotion features={domAnimation} strict>
        {ui}
      </LazyMotion>
    </QueryClientProvider>,
  );
  return { ...result, user, queryClient };
}
