// Client helpers for Viva.com Smart Checkout (talks to our server endpoints).

// Create a Viva payment order and return the hosted-checkout redirect URL.
// `amount` is in pounds; converted to pence for Viva.
export const startVivaPayment = async ({ amount, fullName, email, phone, customerTrns }) => {
  const res = await fetch('/api/viva/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: Math.round((Number(amount) || 0) * 100),
      fullName, email, phone, customerTrns,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.redirectUrl) {
    throw new Error(data.error || 'Could not start the payment. Please try again.');
  }
  return data.redirectUrl;
};

// Verify a transaction after the customer returns from Viva.
export const verifyVivaPayment = async (transactionId) => {
  try {
    const res = await fetch(`/api/viva/verify?t=${encodeURIComponent(transactionId)}`);
    if (!res.ok) return { success: false };
    return await res.json();
  } catch {
    return { success: false };
  }
};
