import { z } from "zod";

const emailInputSchema = z.object({
  to: z.email(),
  subject: z.string().min(1).max(998),
  html: z.string().min(1),
  text: z.string().min(1),
  idempotencyKey: z.string().min(1).max(256).regex(/^[\x20-\x7E]+$/),
});

const resendResponseSchema = z.object({ id: z.string().min(1) });

let resendQueue: Promise<void> = Promise.resolve();
let lastResendRequestAt = 0;

async function respectResendRate<T>(operation: () => Promise<T>) {
  const previous = resendQueue;
  let release = () => {};
  resendQueue = new Promise<void>((resolve) => { release = resolve; });
  await previous;
  try {
    const waitMs = Math.max(0, 220 - (Date.now() - lastResendRequestAt));
    if (waitMs) await new Promise((resolve) => setTimeout(resolve, waitMs));
    lastResendRequestAt = Date.now();
    return await operation();
  } finally {
    release();
  }
}

export interface EmailSender {
  send(input: z.input<typeof emailInputSchema>): Promise<{ id: string }>;
}

interface ResendEmailClientOptions {
  apiKey?: string;
  from?: string;
  fetchImpl?: typeof fetch;
}

export class ResendEmailClient implements EmailSender {
  private readonly apiKey?: string;
  private readonly from?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ResendEmailClientOptions = {}) {
    if (typeof window !== "undefined") throw new Error("ResendEmailClient mag alleen server-side worden gebruikt.");
    this.apiKey = options.apiKey ?? process.env.RESEND_API_KEY;
    this.from = options.from ?? process.env.RESEND_FROM_EMAIL;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  isConfigured() {
    return Boolean(this.apiKey?.trim() && this.from?.trim());
  }

  async send(input: z.input<typeof emailInputSchema>) {
    const parsed = emailInputSchema.parse(input);
    if (!this.isConfigured()) throw new Error("Resend is niet geconfigureerd.");

    const response = await respectResendRate(() => this.fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": parsed.idempotencyKey,
        "User-Agent": "MandWijs/0.1 (+https://mandwijs.app)",
      },
      body: JSON.stringify({
        from: this.from,
        to: [parsed.to],
        subject: parsed.subject,
        html: parsed.html,
        text: parsed.text,
        tags: [{ name: "email_type", value: "weekly_advice" }],
      }),
      signal: AbortSignal.timeout(10_000),
    }));
    if (!response.ok) throw new Error(`Resend gaf HTTP ${response.status}.`);
    return resendResponseSchema.parse(await response.json());
  }
}
