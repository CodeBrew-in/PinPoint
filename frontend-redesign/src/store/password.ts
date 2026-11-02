/** Password policy used when creating an account or changing a password. */

export type PasswordContext = { username?: string; email?: string };

type Rule = { id: string; label: string; short: string; test: (p: string, ctx?: PasswordContext) => boolean };

const personalParts = (ctx?: PasswordContext) =>
  [ctx?.username, ctx?.email?.split('@')[0]].map((s) => (s ?? '').trim().toLowerCase()).filter((s) => s.length >= 3);

export const PASSWORD_RULES: Rule[] = [
  { id: 'len', label: 'At least 10 characters', short: 'at least 10 characters', test: (p) => p.length >= 10 },
  { id: 'upper', label: 'One uppercase letter (A to Z)', short: 'an uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'One lowercase letter (a to z)', short: 'a lowercase letter', test: (p) => /[a-z]/.test(p) },
  { id: 'digit', label: 'One number (0 to 9)', short: 'a number', test: (p) => /[0-9]/.test(p) },
  { id: 'special', label: 'One special character, like ! @ # $ %', short: 'a special character', test: (p) => /[^A-Za-z0-9\s]/.test(p) },
  { id: 'space', label: 'No spaces', short: 'no spaces', test: (p) => !/\s/.test(p) },
  {
    id: 'personal',
    label: 'Does not contain your username or email name',
    short: 'no part of your username or email name',
    test: (p, ctx) => !personalParts(ctx).some((part) => p.toLowerCase().includes(part)),
  },
];

export const ruleResults = (password: string, ctx?: PasswordContext) =>
  // An empty field ticks nothing, even the "no spaces" style rules that an empty string trivially satisfies.
  PASSWORD_RULES.map((r) => ({ id: r.id, label: r.label, ok: password.length > 0 && r.test(password, ctx) }));

/** Returns what is still missing, as short phrases. Empty when the password is fine. */
export const passwordProblems = (password: string, ctx?: PasswordContext) =>
  PASSWORD_RULES.filter((r) => !r.test(password, ctx)).map((r) => r.short);

export const passwordError = (password: string, ctx?: PasswordContext) => {
  const problems = passwordProblems(password, ctx);
  return problems.length ? `Password needs ${problems.join(', ')}.` : null;
};
