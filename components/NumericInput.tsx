'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  'data-overridden'?: string;
}

/**
 * A numeric input that behaves the way people expect: you can clear it and
 * type a new value without it snapping back to "0" mid-edit.
 *
 * The naive `value={num} onChange={e => set(parseFloat(e.target.value) || 0)}`
 * pattern breaks the moment the field is empty — parseFloat('') is NaN, the
 * `|| 0` fallback commits 0 immediately, and the controlled value re-renders
 * to "0" before the next keystroke lands. This keeps its own text buffer
 * while focused (so it can sit empty or mid-number), only forwards valid
 * parsed numbers to the parent live, and finalizes (defaulting blank/invalid
 * to 0) on blur. type="text" + inputMode="decimal" is deliberate — it's what
 * avoids the browser's own number-input reformatting fighting the same way,
 * while still getting a numeric keypad on mobile.
 */
export function NumericInput({ value, onChange, className, style, disabled, ...rest }: Props) {
  const [text, setText] = useState(() => String(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(String(value));
  }, [value]);

  return (
    <input
      type="text"
      inputMode="decimal"
      className={className}
      style={style}
      disabled={disabled}
      value={text}
      onFocus={() => {
        focused.current = true;
      }}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        const parsed = parseFloat(raw);
        if (raw.trim() !== '' && Number.isFinite(parsed)) {
          onChange(parsed);
        }
      }}
      onBlur={() => {
        focused.current = false;
        const parsed = parseFloat(text);
        const final = Number.isFinite(parsed) ? parsed : 0;
        setText(String(final));
        if (final !== value) onChange(final);
      }}
      {...rest}
    />
  );
}
