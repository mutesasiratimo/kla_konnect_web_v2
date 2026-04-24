import { useId } from 'react'
import { CheckboxInput } from '@react-beauty/ui-checkbox'

type CheckboxProps = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  id?: string
  name?: string
  ariaLabel?: string
  className?: string
}

export function Checkbox({
  checked,
  onCheckedChange,
  label,
  disabled = false,
  id,
  name,
  ariaLabel,
  className,
}: CheckboxProps) {
  const autoId = useId()
  const fieldId = id ?? `checkbox-${autoId}`
  const checkboxValue = name ?? fieldId

  return (
    <CheckboxInput
      value={checkboxValue}
      checked={checked}
      onValueChange={onCheckedChange}
      isDisabled={disabled}
      className={className ? `app-checkbox-group ${className}` : 'app-checkbox-group'}
    >
      <CheckboxInput.Field id={fieldId} aria-label={ariaLabel ?? label ?? 'Checkbox'} />
      {label ? <CheckboxInput.Label>{label}</CheckboxInput.Label> : null}
    </CheckboxInput>
  )
}
