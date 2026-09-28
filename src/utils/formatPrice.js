// All displayed prices flow through here. Currency is GBP, but the symbol is
// intentionally NOT rendered — prices show as `8.95`, never `£8.95`.
//
// Exceptions that may keep the symbol (and so must not call this):
//   * promotional/offer wording, e.g. "Up to £25 savings"
//   * admin-only form labels and the bill column in the dashboard
// Number <input> fields use raw values and must NOT call this either.
const formatPrice = (amount) => Number(amount || 0).toFixed(2);
export default formatPrice;
