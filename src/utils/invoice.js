import formatPrice from './formatPrice';
import { toast } from './alerts';

const PAY_LABELS = { PAID: 'Paid', COD: 'Cash', REFUNDED: 'Refunded', UNPAID: 'Unpaid' };

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

// Absolute, publicly reachable logo URL so it renders inside emails (a
// relative/localhost URL would break in the recipient's mail client).
const LOGO_URL = 'https://americanfriedchicken.co.uk/Logo.png';

// Builds the invoice HTML for an order. Email-safe: table layout + inline
// styles only (no flexbox / <style>, which Gmail and others strip). Used for
// both the admin "download/print" action and the emailed invoice.
export const buildInvoiceHtml = (order, { autoPrint = false } = {}) => {
  const items = order.items || [];
  const subtotal = items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 0), 0);
  const discount = order.discount?.amount || 0;
  const total = order.total ?? Math.max(0, subtotal - discount);
  const paid = order.amountPaid || 0;
  const remaining = total - paid;
  const dt = new Date(order.date);
  const dateStr = `${dt.toLocaleDateString('en-GB')} ${dt.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' })}`;
  const isDelivery = order.fulfillment === 'delivery';
  const contact = [order.phone, order.email].filter(Boolean).join('<br>') || '—';

  const cell = 'padding:11px 10px;border-bottom:1px solid #eee;font-size:13px;color:#222;';
  const rows = items.map(i => `
    <tr>
      <td style="${cell}">${esc(i.title)}</td>
      <td style="${cell}text-align:center;">${i.quantity}</td>
      <td style="${cell}text-align:right;">${formatPrice(i.price || 0)}</td>
      <td style="${cell}text-align:right;">${formatPrice((i.price || 0) * (i.quantity || 0))}</td>
    </tr>`).join('');

  const totalRow = (label, value, { bold = false, color = '#222' } = {}) => {
    const base = `padding:6px 0;font-size:${bold ? '16px' : '13px'};${bold ? 'font-weight:bold;' : ''}`;
    return `<tr>
      <td style="${base}color:${bold ? '#222' : '#555'};">${label}</td>
      <td style="${base}text-align:right;color:${color};">${value}</td>
    </tr>`;
  };

  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Invoice ${esc(order.id)}</title></head>
<body style="margin:0;padding:24px;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#222;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;margin:0 auto;background:#ffffff;border-radius:8px;">
    <tr><td style="padding:32px;">

      <!-- Header -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:top;">
            <img src="${LOGO_URL}" width="48" height="48" alt="" style="border:0;vertical-align:middle;border-radius:6px;">
            <span style="font-size:17px;font-weight:bold;letter-spacing:.5px;margin-left:8px;vertical-align:middle;">AMERICAN FRIED CHICKEN</span>
            <div style="color:#777;font-size:12px;margin-top:4px;">Bolton</div>
          </td>
          <td style="vertical-align:top;text-align:right;white-space:nowrap;">
            <div style="font-size:26px;font-weight:bold;color:#e31837;letter-spacing:2px;">INVOICE</div>
            <div style="font-size:12px;color:#555;margin-top:4px;"># ${esc(order.id)}<br>${dateStr}</div>
          </td>
        </tr>
      </table>
      <div style="border-bottom:3px solid #e31837;margin:18px 0;font-size:0;line-height:0;">&nbsp;</div>

      <!-- Parties -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:top;width:55%;">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:6px;">Billed to</div>
            <div style="font-size:13px;font-weight:bold;">${esc(order.customerName || 'Guest')}</div>
            <div style="font-size:13px;line-height:1.6;color:#333;">${contact}</div>
          </td>
          <td style="vertical-align:top;text-align:right;">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:6px;">${isDelivery ? 'Deliver to' : 'Collection'}</div>
            <div style="font-size:13px;line-height:1.6;color:#333;">${isDelivery ? (esc(order.address) || '—') : 'Pickup at store'}</div>
          </td>
        </tr>
      </table>

      <!-- Items -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:24px;">
        <tr style="background:#f4f4f4;">
          <th align="left" style="padding:10px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#555;">Item</th>
          <th align="center" style="padding:10px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#555;">Qty</th>
          <th align="right" style="padding:10px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#555;">Price</th>
          <th align="right" style="padding:10px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#555;">Amount</th>
        </tr>
        ${rows || '<tr><td colspan="4" style="text-align:center;color:#999;padding:16px;">No items recorded</td></tr>'}
      </table>

      <!-- Totals -->
      <table role="presentation" align="right" cellpadding="0" cellspacing="0" style="width:280px;margin-top:16px;">
        ${totalRow('Subtotal', formatPrice(subtotal))}
        ${discount ? totalRow(`Discount (${esc(order.discount.code)})`, `-${formatPrice(discount)}`, { color: '#1f9d55' }) : ''}
        <tr><td colspan="2" style="border-top:2px solid #222;font-size:0;line-height:0;">&nbsp;</td></tr>
        ${totalRow('Total', formatPrice(total), { bold: true })}
        ${totalRow('Amount paid', formatPrice(paid))}
        ${totalRow('Remaining', formatPrice(remaining))}
      </table>
      <div style="clear:both;"></div>

      <!-- Meta -->
      <div style="margin-top:80px;font-size:12px;color:#555;">
        <strong style="color:#222;">Payment:</strong> ${esc(PAY_LABELS[order.paymentStatus] || order.payment || '—')}
        &nbsp;&nbsp;&nbsp; <strong style="color:#222;">Status:</strong> ${esc(order.status || 'PENDING')}
        &nbsp;&nbsp;&nbsp; <strong style="color:#222;">Type:</strong> ${isDelivery ? 'Delivery' : 'Pickup'}
      </div>

      <!-- Footer -->
      <div style="margin-top:24px;border-top:1px solid #eee;padding-top:16px;text-align:center;color:#999;font-size:12px;">
        Thank you for your order! &middot; All amounts in GBP &middot; American Fried Chicken, Bolton
      </div>

    </td></tr>
  </table>
  ${autoPrint ? '<script>window.onload = function(){ window.print(); }</script>' : ''}
</body></html>`;
};

// Opens the invoice in a new tab and triggers the print dialog.
export const printInvoice = (order) => {
  const w = window.open('', '_blank');
  if (!w) { toast('Please allow pop-ups to generate the invoice.', 'warning'); return; }
  w.document.write(buildInvoiceHtml(order, { autoPrint: true }));
  w.document.close();
};
