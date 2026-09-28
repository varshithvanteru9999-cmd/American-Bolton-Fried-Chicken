// Helpers for item customisation option groups (admin-defined add-ons + the
// built-in groups in menuData). Shared by the desktop and mobile item modals.

// Admin groups are stored kind-based: { kind:'required'|'optional', choose, choices }.
// Normalize them into the render shape the modals use. Built-in groups (already
// render-shaped with `required`/`multi`) pass through unchanged.
export const normalizeOptions = (opts) => {
  if (!Array.isArray(opts)) return opts;
  return opts.map((g, i) => {
    if (g && g.kind === 'required') {
      const choose = Math.max(1, Number(g.choose) || 1);
      return {
        id: g.id || `req${i}`,
        kind: 'required',
        label: g.label || 'Please select',
        required: true,
        multi: choose > 1,
        choose,
        note: `Choose ${choose}`,
        choices: (g.choices || []).map(c => ({ name: c.name })),
      };
    }
    if (g && g.kind === 'optional') {
      return {
        id: g.id || `opt${i}`,
        kind: 'optional',
        label: g.label || 'Please select',
        required: false,
        multi: true,
        note: '',
        choices: (g.choices || []).map(c => ({ name: c.name, price: Number(c.price) || 0 })),
      };
    }
    return g; // built-in render-shaped group
  });
};

// Sum of the prices of selected choices (optional add-ons carry a price).
export const optionsPrice = (item, sel) => {
  if (!item?.options) return 0;
  return item.options.reduce((sum, g) =>
    sum + (sel[g.id] || []).reduce((s, name) => {
      const c = g.choices.find(ch => ch.name === name);
      return s + (c?.price || 0);
    }, 0), 0);
};

// Required groups must have exactly `choose` selections (default 1). Returns the
// ids of any required groups that aren't satisfied (for highlighting warnings).
export const invalidOptionGroups = (item, sel) => {
  if (!item?.options) return [];
  return item.options
    .filter(g => g.required && (sel[g.id]?.length || 0) !== (g.choose || 1))
    .map(g => g.id);
};

export const optionsValid = (item, sel) => invalidOptionGroups(item, sel).length === 0;

// Toggle a choice within a group, respecting radio vs multi and the `choose` cap.
export const toggleOptionChoice = (sel, group, name) => {
  if (!group.multi) return { ...sel, [group.id]: [name] };
  const cur = sel[group.id] || [];
  if (cur.includes(name)) return { ...sel, [group.id]: cur.filter(n => n !== name) };
  if (group.required && group.choose && cur.length >= group.choose) return sel; // cap reached
  return { ...sel, [group.id]: [...cur, name] };
};
