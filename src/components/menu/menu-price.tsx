import { cn } from "@/lib/utils";

const currency = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

/**
 * Prezzo nello stile della grafica del menu: "€14" grande e ",90" più piccolo in apice ("€12" senza ",00").
 * Le parti vengono da Intl (it-IT, EUR); agli screen reader arriva il formato standard "14,90 €".
 */
export function MenuPrice({ price, className }: { price: string; className?: string }) {
  const value = Number(price);
  const parts = currency.formatToParts(value);
  const integer = parts
    .filter((part) => part.type === "integer" || part.type === "group")
    .map((part) => part.value)
    .join("");
  const fraction = parts.find((part) => part.type === "fraction")?.value ?? "00";
  const symbol = parts.find((part) => part.type === "currency")?.value ?? "€";

  return (
    <p
      className={cn(
        "font-[family-name:var(--font-menu-serif)] leading-none font-bold tracking-tight lining-nums",
        className,
      )}
    >
      <span className="sr-only">Prezzo: {currency.format(value)}</span>
      <span aria-hidden className="inline-flex items-start">
        <span>
          {symbol}
          {integer}
        </span>
        {fraction !== "00" && <span className="mt-[0.08em] text-[0.55em] tracking-normal">,{fraction}</span>}
      </span>
    </p>
  );
}
