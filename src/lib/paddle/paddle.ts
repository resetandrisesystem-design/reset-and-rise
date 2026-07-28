const PADDLE_API_BASE = "https://api.paddle.com";

function paddleHeaders() {
  return {
    "Authorization": `Bearer ${process.env.PADDLE_API_KEY}`,
    "Content-Type": "application/json",
  };
}

export function priceIdToPlan(priceId: string): "core" | "premium" | "vip" | null {
  if (priceId === process.env.PADDLE_PRICE_CORE)    return "core";
  if (priceId === process.env.PADDLE_PRICE_PREMIUM) return "premium";
  if (priceId === process.env.PADDLE_PRICE_VIP)     return "vip";
  return null;
}

export async function createPaddleCheckout(params: {
  priceId: string;
  customerEmail?: string;
  successUrl: string;
  plan: string;
}) {
  const body: Record<string, any> = {
    items: [{ price_id: params.priceId, quantity: 1 }],
    checkout: { url: params.successUrl },
    custom_data: { plan: params.plan },
  };

  if (params.customerEmail) {
    body.customer = { email: params.customerEmail };
  }

  const res = await fetch(`${PADDLE_API_BASE}/transactions`, {
    method: "POST",
    headers: paddleHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Paddle transaction creation failed: ${err}`);
  }

  const data = await res.json();
  const checkoutUrl = data?.data?.checkout?.url;
  if (!checkoutUrl) throw new Error("Paddle did not return a checkout URL");
  return { url: checkoutUrl, transactionId: data?.data?.id };
}

export async function verifyPaddleWebhook(
  rawBody: string,
  signatureHeader: string | null
): Promise<boolean> {
  if (!signatureHeader || !process.env.PADDLE_WEBHOOK_SECRET) return false;

  try {
    const parts: Record<string, string> = {};
    signatureHeader.split(";").forEach((part) => {
      const [k, v] = part.split("=");
      if (k && v) parts[k.trim()] = v.trim();
    });

    const timestamp = parts["ts"];
    const signature = parts["h1"];
    if (!timestamp || !signature) return false;

    const signedPayload = `${timestamp}:${rawBody}`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(process.env.PADDLE_WEBHOOK_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const sigBuffer = await crypto.subtle.sign(
      "HMAC", key, new TextEncoder().encode(signedPayload)
    );

    const expectedSig = Array.from(new Uint8Array(sigBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return expectedSig === signature;
  } catch {
    return false;
  }
}
