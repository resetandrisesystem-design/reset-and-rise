"use client";

import { useEffect, useState } from "react";
import { convertAmount, detectCountry, fetchRate, formatMoney } from "@/lib/currency";
import { checkoutCurrencyFor } from "@/lib/adaptivePricing";

interface Local {
  code: string;
  rate: number;
}

/** One location check and one rate lookup, shared by every plan card on the page. */
let lookup: Promise<Local | null> | null = null;

function localCurrency(): Promise<Local | null> {
  if (!lookup) {
    lookup = (async () => {
      const code = checkoutCurrencyFor(await detectCountry());
      if (!code) return null;
      const rate = await fetchRate("GBP", code);
      return rate ? { code, rate } : null;
    })().catch(() => null);
  }
  return lookup;
}

/** Under a GBP price, the rough equivalent in the visitor's currency when
 *  Stripe will present that currency at checkout. Renders nothing for UK
 *  visitors and for countries Stripe does not localise. */
export default function LocalPrice({ gbp, featured = false }: { gbp: number; featured?: boolean }) {
  const [local, setLocal] = useState<Local | null>(null);

  useEffect(() => {
    let active = true;
    localCurrency().then((result) => { if (active) setLocal(result); });
    return () => { active = false; };
  }, []);

  if (!local) return null;
  const amount = convertAmount(gbp, local.rate, local.code);
  return (
    <p className={"text-xs mb-1 " + (featured ? "text-ivory-300" : "text-navy-400")}>
      About {formatMoney(amount, local.code)} a month in your currency, converted at checkout.
    </p>
  );
}
