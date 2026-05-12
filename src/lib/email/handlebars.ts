import Handlebars from 'handlebars';

let registered = false;

function register() {
  if (registered) return;
  registered = true;

  Handlebars.registerHelper('money', (cents: unknown, currency: unknown) => {
    const n = typeof cents === 'number' ? cents : Number(cents);
    if (!isFinite(n)) return '';
    const cur = typeof currency === 'string' && currency ? currency : 'USD';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(n / 100);
  });

  Handlebars.registerHelper('date', (value: unknown, fmt?: unknown) => {
    if (!value) return '';
    const d = value instanceof Date ? value : new Date(String(value));
    if (isNaN(d.getTime())) return '';
    if (fmt === 'long') {
      return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  });

  Handlebars.registerHelper('upper', (s: unknown) => String(s ?? '').toUpperCase());
  Handlebars.registerHelper('lower', (s: unknown) => String(s ?? '').toLowerCase());
  Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
}

export function compile(source: string): Handlebars.TemplateDelegate {
  register();
  return Handlebars.compile(source, { noEscape: false });
}

export function render(source: string, vars: Record<string, unknown>): string {
  return compile(source)(vars);
}
