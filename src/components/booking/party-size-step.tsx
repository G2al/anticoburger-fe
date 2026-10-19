"use client";

import { ArrowRight, Phone, Users } from "lucide-react";
import { m } from "motion/react";
import type { ReactNode } from "react";
import { ContactRestaurant } from "@/components/common/contact-restaurant";
import { ErrorState, OfflineState } from "@/components/common/error-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { restaurant } from "@/config/restaurant";
import { useBookingSettings } from "@/hooks/use-booking-settings";
import { onlinePartySizes } from "@/lib/party-size";
import { SelectableChip } from "./selectable-chip";
import { StepHeader } from "./step-header";
import { StepLayout } from "./step-layout";

const listVariants = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };
const itemVariants = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

export function PartySizeStep({
  selected,
  onSelect,
  onContinue,
  onBack,
  notice,
  focusTitle,
}: {
  selected: number | null;
  onSelect: (size: number) => void;
  onContinue: () => void;
  onBack: () => void;
  notice?: ReactNode;
  focusTitle: boolean;
}) {
  const settings = useBookingSettings();
  const sizes = settings.data ? onlinePartySizes(settings.data.party_sizes) : undefined;
  const validSelection = selected !== null && sizes?.includes(selected) ? selected : null;

  const header = (
    <StepHeader
      index={0}
      title="Quante persone?"
      description="Scegli il numero di persone, compreso te."
      onBack={onBack}
      focusOnMount={focusTitle}
    />
  );

  if (sizes && sizes.length === 0) {
    return (
      <StepLayout header={header} notice={notice}>
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-muted/60 px-6 py-8 text-center">
          <Users className="size-7 text-brass" aria-hidden />
          <h2 className="text-lg font-semibold">Prenotazioni online non disponibili</h2>
          <p className="text-pretty text-muted-foreground">
            Al momento non è possibile prenotare online. Contattaci e saremo felici di trovarti un tavolo.
          </p>
          <ContactRestaurant className="items-center" compact />
        </div>
      </StepLayout>
    );
  }

  return (
    <StepLayout
      header={header}
      notice={notice}
      actions={
        <Button size="xl" disabled={validSelection === null} onClick={onContinue}>
          Continua
          <ArrowRight aria-hidden data-icon="inline-end" />
        </Button>
      }
    >
      {sizes ? (
        <>
          <m.div
            role="group"
            aria-label="Numero di persone"
            className="grid grid-cols-4 gap-2.5"
            variants={listVariants}
            initial="hidden"
            animate="show"
          >
            {sizes.map((size) => (
              <m.div key={size} variants={itemVariants}>
                <SelectableChip
                  selected={validSelection === size}
                  indicatorId="party-indicator"
                  onClick={() => onSelect(size)}
                  aria-label={size === 1 ? "1 persona" : `${size} persone`}
                  className="h-16 w-full text-xl"
                >
                  {size}
                </SelectableChip>
              </m.div>
            ))}
          </m.div>
          <LargeGroupNotice maxOnline={Math.max(...sizes)} />
        </>
      ) : settings.isPending && settings.fetchStatus === "paused" ? (
        <OfflineState />
      ) : settings.isError ? (
        <ErrorState error={settings.error} onRetry={() => settings.refetch()} retrying={settings.isFetching} />
      ) : (
        <PartySizeSkeleton />
      )}
    </StepLayout>
  );
}

/** Gruppi oltre il limite online: si prenota solo chiamando il locale. */
function LargeGroupNotice({ maxOnline }: { maxOnline: number }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3 rounded-3xl bg-card p-4 ring-1 ring-border"
    >
      <div className="flex gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent">
          <Users className="size-4 text-accent-foreground" aria-hidden />
        </span>
        <div className="flex flex-col gap-0.5">
          <p className="font-semibold">Siete più di {maxOnline} persone?</p>
          <p className="text-sm text-pretty text-muted-foreground">
            Per i gruppi numerosi la prenotazione si fa solo per telefono: chiamaci e organizziamo il tavolo insieme.
          </p>
        </div>
      </div>
      <a href={restaurant.phoneHref} className={buttonVariants({ variant: "outline", size: "lg" })}>
        <Phone aria-hidden data-icon="inline-start" />
        Chiama {restaurant.phoneDisplay}
      </a>
    </m.div>
  );
}

export function PartySizeSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-2.5" aria-busy="true" aria-label="Caricamento">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-16" />
      ))}
    </div>
  );
}
