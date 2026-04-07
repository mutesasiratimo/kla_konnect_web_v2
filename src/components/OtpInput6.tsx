import {
  useRef,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
} from 'react'
import './OtpInput6.css'

export const OTP_INPUT_LEN = 6

export type OtpInput6Props = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  id?: string
  'aria-label'?: string
  autoFocus?: boolean
}

function digitsOnly(s: string): string {
  return s.replace(/\D/g, '').slice(0, OTP_INPUT_LEN)
}

export function OtpInput6({
  value,
  onChange,
  disabled,
  id,
  'aria-label': ariaLabel = 'One-time code',
  autoFocus,
}: OtpInput6Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const d = digitsOnly(value)

  const setRef = (i: number) => (el: HTMLInputElement | null) => {
    refs.current[i] = el
  }

  const focusAt = (i: number) => {
    const clamped = Math.max(0, Math.min(i, OTP_INPUT_LEN - 1))
    const el = refs.current[clamped]
    el?.focus()
    el?.select()
  }

  const handleChange =
    (i: number) => (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, '')
      if (raw.length > 1) {
        const next = raw.slice(0, OTP_INPUT_LEN)
        onChange(next)
        focusAt(Math.min(next.length, OTP_INPUT_LEN - 1))
        return
      }
      if (raw === '') {
        onChange(d.slice(0, i) + d.slice(i + 1))
        return
      }
      const ch = raw.slice(-1)
      const next = (d.slice(0, i) + ch + d.slice(i + 1)).slice(
        0,
        OTP_INPUT_LEN,
      )
      onChange(next)
      if (ch && i < OTP_INPUT_LEN - 1) {
        focusAt(i + 1)
      }
    }

  const handleKeyDown =
    (i: number) => (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !d[i] && i > 0) {
        e.preventDefault()
        const next = d.slice(0, i - 1) + d.slice(i)
        onChange(next)
        focusAt(i - 1)
        return
      }
      if (e.key === 'ArrowLeft' && i > 0) {
        e.preventDefault()
        focusAt(i - 1)
      }
      if (e.key === 'ArrowRight' && i < OTP_INPUT_LEN - 1) {
        e.preventDefault()
        focusAt(i + 1)
      }
    }

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    const next = digitsOnly(e.clipboardData.getData('text'))
    onChange(next)
    focusAt(Math.min(next.length, OTP_INPUT_LEN - 1))
  }

  return (
    <div
      className="otp-input-6"
      role="group"
      aria-label={ariaLabel}
      onPaste={handlePaste}
    >
      {Array.from({ length: OTP_INPUT_LEN }, (_, i) => (
        <input
          key={i}
          ref={setRef(i)}
          id={id ? `${id}-${i}` : undefined}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          autoCorrect="off"
          spellCheck={false}
          className="otp-input-6__cell"
          value={d[i] ?? ''}
          onChange={handleChange(i)}
          onKeyDown={handleKeyDown(i)}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          autoFocus={Boolean(autoFocus && i === 0)}
          maxLength={1}
          aria-label={`${ariaLabel} digit ${i + 1} of ${OTP_INPUT_LEN}`}
        />
      ))}
    </div>
  )
}
