import { useId, useState } from 'react';
import { ruleResults, type PasswordContext } from '../store/password';

/** Password input with a show/hide toggle and, optionally, a live checklist of the password rules. */
export function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  showRules = false,
  context,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  showRules?: boolean;
  context?: PasswordContext;
}) {
  const [visible, setVisible] = useState(false);
  const listId = useId();
  const results = ruleResults(value, context);

  return (
    <div>
      <label className="block">
        <span className="label mb-1 block">{label}</span>
        <span className="relative block">
          <input
            type={visible ? 'text' : 'password'}
            value={value}
            autoComplete={autoComplete}
            aria-describedby={showRules ? listId : undefined}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-lg border-2 border-ink bg-cream py-2 pl-3 pr-16 text-[15px] focus:shadow-stamp"
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-pressed={visible}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-bold underline underline-offset-2"
          >
            {visible ? 'Hide' : 'Show'}
          </button>
        </span>
      </label>
      {showRules && (
        <ul id={listId} className="mt-3 grid gap-1 text-[13px]" aria-label="Password rules">
          {results.map((r) => (
            <li key={r.id} className={`flex items-center gap-2 ${r.ok ? 'font-medium text-teal-dark' : 'text-ink/70'}`}>
              <span
                aria-hidden
                className={`grid h-4 w-4 place-items-center rounded-full border-2 text-[10px] font-bold leading-none ${
                  r.ok ? 'border-teal-dark bg-teal-dark text-white' : 'border-ink/40'
                }`}
              >
                {r.ok ? '✓' : ''}
              </span>
              <span>
                {r.label}
                <span className="sr-only">{r.ok ? ', done' : ', not yet'}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
