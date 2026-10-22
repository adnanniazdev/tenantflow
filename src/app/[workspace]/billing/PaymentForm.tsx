"use client";

import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";
import type React from "react";
import { useState } from "react";

interface PaymentFormProps {
  onCancel: () => void;
}

export function PaymentForm({ onCancel }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${window.location.pathname}?success=true`,
      },
    });

    if (confirmError) {
      setError(confirmError.message || "An unexpected error occurred.");
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {error && (
        <div className="p-3 bg-destructive/20 border border-destructive-border text-destructive-foreground text-xs rounded-md">
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-end pt-4 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="px-4 py-2 text-xs font-medium border border-border text-foreground hover:bg-muted rounded-md transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="flex items-center gap-2 px-5 py-2 text-xs font-medium bg-primary hover:bg-primary-hover text-primary-foreground rounded-md transition-colors disabled:opacity-50"
        >
          {processing && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-foreground" />
          )}
          {processing ? "Processing..." : "Pay & Subscribe"}
        </button>
      </div>
    </form>
  );
}
