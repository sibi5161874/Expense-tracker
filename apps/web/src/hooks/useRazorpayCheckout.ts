import { useCallback, useState } from 'react';
import { APP_BRANDING } from '@repo/shared/config';

/**
 * Minimal surface of Razorpay's Checkout.js global — enough to open a modal
 * and read its callback payload, not a full SDK typing.
 */
interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill?: { email?: string };
  theme?: { color?: string };
  handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

const CHECKOUT_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

function loadCheckoutScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();

  const existing = document.querySelector(`script[src="${CHECKOUT_SCRIPT_SRC}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load payment checkout')));
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CHECKOUT_SCRIPT_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load payment checkout'));
    document.body.appendChild(script);
  });
}

export type PaymentPurpose = 'trial_verification' | 'lifetime_purchase';

interface CheckoutParams {
  purpose: PaymentPurpose;
  description: string;
  userEmail?: string;
  onSuccess: () => void | Promise<void>;
}

/**
 * Drives the full Razorpay flow: create-order -> open Checkout -> verify.
 * The DB tier change happens server-side in /api/payments/verify (and again,
 * idempotently, in the webhook) — this hook never writes tier state itself,
 * it only triggers the request and reports success/failure for the UI.
 */
export function useRazorpayCheckout() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = useCallback(async ({ purpose, description, userEmail, onSuccess }: CheckoutParams) => {
    setError(null);
    setIsProcessing(true);
    try {
      await loadCheckoutScript();

      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.error ?? "Couldn't start checkout");

      if (!window.Razorpay) throw new Error('Payment checkout failed to load');

      await new Promise<void>((resolve, reject) => {
        const checkout = new window.Razorpay!({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          order_id: order.orderId,
          name: APP_BRANDING.name,
          description,
          prefill: userEmail ? { email: userEmail } : undefined,
          theme: { color: '#0f172a' },
          handler: async (response) => {
            try {
              const verifyRes = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(response),
              });
              const verifyData = await verifyRes.json();
              if (!verifyRes.ok) throw new Error(verifyData.error ?? 'Payment verification failed');
              await onSuccess();
              resolve();
            } catch (e) {
              reject(e instanceof Error ? e : new Error('Payment verification failed'));
            }
          },
          modal: {
            ondismiss: () => reject(new Error('CANCELLED')),
          },
        });
        checkout.open();
      });
    } catch (e) {
      // A user closing the checkout modal isn't a real error — don't show one.
      if (e instanceof Error && e.message !== 'CANCELLED') {
        setError(e.message);
      }
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return { startCheckout, isProcessing, error };
}
