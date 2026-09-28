// Single source of truth for brand identity and store details.
//
// Everything user-facing (nav, footer, legal pages, invoices, admin, PWA
// copy) reads from here, so a rebrand or an address change is one edit.
//
// NOTE: the Bolton contact details below are PLACEHOLDERS. Replace them with
// the real registered address, phone and email before going live — they also
// appear in the Terms and Privacy pages, which are legal documents.
const brand = {
  name: "American Fried Chicken",
  legalName: "American Fried Chicken Ltd",
  shortName: "American Fried Chicken",
  tagline: "Bolton's home of proper fried chicken",

  // Logo lives at /public/Logo.png — swap that file to change it everywhere.
  logo: "/Logo.png",

  city: "Bolton",
  addressLine1: "Bolton Town Centre",       // placeholder
  addressLine2: "Bolton, BL1 1AA",          // placeholder
  postcode: "BL1 1AA",                      // placeholder
  country: "United Kingdom",

  phone: "+44 7534 571279",
  phoneHref: "tel:+447534571279",
  email: "hello@americanfriedchicken.co.uk", // placeholder
  website: "www.americanfriedchicken.co.uk", // placeholder

  hours: "Mon – Sun: 10:00 – 22:59",

  // Order id prefix, used in track-order copy and invoices
  orderPrefix: "AFC",

  // localStorage namespace
  storageKey: "afc-bolton",
};

export default brand;
