'use client'

import { useState } from 'react'

// ─── SVG ICONS ────────────────────────────────────────────────────────────────

const ICON_PATHS: Record<string, React.ReactNode> = {
  send:     <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>,
  check:    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>,
  close:    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>,
  calendar: <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>,
}

function SvgIcon({ name, size = 16 }: { name: string; size?: number }) {
  const path = ICON_PATHS[name] ?? ICON_PATHS.send
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      {path}
    </svg>
  )
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
// Inline styles that adapt to the existing dark/light theme of the app

const STYLES = {
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
    padding: '16px 18px',
    borderRadius: '14px',
    background: 'hsl(var(--muted) / 0.4)',
    border: '1px solid hsl(var(--border))',
    width: '100%',
  },
  formTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: 'hsl(var(--foreground))',
    marginBottom: '2px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  formSubtitle: {
    fontSize: '11px',
    color: 'hsl(var(--muted-foreground))',
    marginBottom: '4px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '5px',
  },
  label: {
    fontSize: '11px',
    fontWeight: 600,
    color: 'hsl(var(--muted-foreground))',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  requiredStar: {
    color: 'hsl(var(--destructive))',
    marginLeft: '2px',
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '10px',
    border: '1px solid hsl(var(--border))',
    background: 'hsl(var(--background) / 0.6)',
    color: 'hsl(var(--foreground))',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  textarea: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '10px',
    border: '1px solid hsl(var(--border))',
    background: 'hsl(var(--background) / 0.6)',
    color: 'hsl(var(--foreground))',
    fontSize: '13px',
    outline: 'none',
    resize: 'vertical' as const,
    minHeight: '80px',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
  },
  choiceOptions: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '6px',
  },
  choiceBtn: (selected: boolean) => ({
    padding: '5px 14px',
    borderRadius: '20px',
    border: `1px solid ${selected ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
    background: selected ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--background) / 0.5)',
    color: selected ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
    fontSize: '12px',
    fontWeight: selected ? 700 : 400,
    cursor: 'pointer',
    transition: 'all 0.15s',
  }),
  submitBtn: {
    padding: '9px 20px',
    borderRadius: '10px',
    border: 'none',
    background: 'hsl(var(--primary))',
    color: 'hsl(var(--primary-foreground))',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    alignSelf: 'flex-start' as const,
    transition: 'opacity 0.15s, transform 0.1s',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  checkboxBox: (checked: boolean) => ({
    width: '18px',
    height: '18px',
    borderRadius: '5px',
    border: `2px solid ${checked ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
    background: checked ? 'hsl(var(--primary))' : 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.15s',
    color: 'hsl(var(--primary-foreground))',
  }),
  sliderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  sliderVal: {
    fontSize: '12px',
    fontWeight: 700,
    color: 'hsl(var(--primary))',
    minWidth: '30px',
    textAlign: 'center' as const,
  },
}

// ─── FIELD COMPONENTS ─────────────────────────────────────────────────────────

interface FieldProps {
  label?: string
  required?: boolean
}

// Text / Textarea field
interface A2TextFieldProps extends FieldProps {
  placeholder?: string
  value?: string
  multiline?: boolean
  fieldKey: string
  onChange: (key: string, value: string) => void
}

export function A2TextField({ label, required, placeholder = 'Type here…', value = '', multiline = false, fieldKey, onChange }: A2TextFieldProps) {
  return (
    <div style={STYLES.fieldGroup}>
      {label && (
        <span style={STYLES.label}>
          {label}
          {required && <span style={STYLES.requiredStar}>*</span>}
        </span>
      )}
      {multiline ? (
        <textarea
          style={STYLES.textarea}
          placeholder={placeholder}
          defaultValue={value}
          onChange={e => onChange(fieldKey, e.target.value)}
        />
      ) : (
        <input
          style={STYLES.input}
          type="text"
          placeholder={placeholder}
          defaultValue={value}
          onChange={e => onChange(fieldKey, e.target.value)}
        />
      )}
    </div>
  )
}

// Number field
interface A2NumberFieldProps extends FieldProps {
  placeholder?: string
  value?: number | string
  min?: number
  max?: number
  fieldKey: string
  onChange: (key: string, value: string) => void
}

export function A2NumberField({ label, required, placeholder = '0', value = '', min, max, fieldKey, onChange }: A2NumberFieldProps) {
  return (
    <div style={STYLES.fieldGroup}>
      {label && (
        <span style={STYLES.label}>
          {label}
          {required && <span style={STYLES.requiredStar}>*</span>}
        </span>
      )}
      <input
        style={STYLES.input}
        type="number"
        placeholder={placeholder}
        defaultValue={value as number}
        min={min}
        max={max}
        onChange={e => onChange(fieldKey, e.target.value)}
      />
    </div>
  )
}

// Choice picker (single or multi)
interface A2ChoicePickerProps extends FieldProps {
  options?: string[]
  multi?: boolean
  fieldKey: string
  onChange: (key: string, value: string) => void
}

export function A2ChoicePicker({ label, required, options = [], multi = false, fieldKey, onChange }: A2ChoicePickerProps) {
  const [selected, setSelected] = useState<string[]>([])

  const toggle = (opt: string) => {
    const next = multi
      ? selected.includes(opt) ? selected.filter(x => x !== opt) : [...selected, opt]
      : [opt]
    setSelected(next)
    onChange(fieldKey, next.join(', '))
  }

  return (
    <div style={STYLES.fieldGroup}>
      {label && (
        <span style={STYLES.label}>
          {label}
          {required && <span style={STYLES.requiredStar}>*</span>}
        </span>
      )}
      <div style={STYLES.choiceOptions}>
        {options.map((opt, i) => (
          <button
            key={i}
            type="button"
            style={STYLES.choiceBtn(selected.includes(opt))}
            onClick={() => toggle(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

// Checkbox
interface A2CheckBoxProps extends FieldProps {
  checked?: boolean
  fieldKey: string
  onChange: (key: string, value: string) => void
}

export function A2CheckBox({ label, required, checked: initial = false, fieldKey, onChange }: A2CheckBoxProps) {
  const [checked, setChecked] = useState(initial)

  const toggle = () => {
    const next = !checked
    setChecked(next)
    onChange(fieldKey, next ? 'true' : 'false')
  }

  return (
    <div style={STYLES.checkboxRow} onClick={toggle}>
      <div style={STYLES.checkboxBox(checked)}>
        {checked && <SvgIcon name="check" size={12} />}
      </div>
      <span style={{ fontSize: '13px', color: 'hsl(var(--foreground))' }}>
        {label}
        {required && <span style={STYLES.requiredStar}>*</span>}
      </span>
    </div>
  )
}

// Slider
interface A2SliderProps extends FieldProps {
  min?: number
  max?: number
  value?: number
  step?: number
  fieldKey: string
  onChange: (key: string, value: string) => void
}

export function A2Slider({ label, required, min = 0, max = 100, value: initial = 50, step = 1, fieldKey, onChange }: A2SliderProps) {
  const [value, setValue] = useState(initial)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value)
    setValue(v)
    onChange(fieldKey, String(v))
  }

  return (
    <div style={STYLES.fieldGroup}>
      {label && (
        <span style={STYLES.label}>
          {label}
          {required && <span style={STYLES.requiredStar}>*</span>}
        </span>
      )}
      <div style={STYLES.sliderRow}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          style={{ flex: 1, accentColor: 'hsl(var(--primary))' }}
        />
        <span style={STYLES.sliderVal}>{value}</span>
      </div>
    </div>
  )
}

// Date / DateTime
interface A2DateTimeInputProps extends FieldProps {
  type?: 'date' | 'datetime-local' | 'time'
  fieldKey: string
  onChange: (key: string, value: string) => void
}

export function A2DateTimeInput({ label, required, type = 'date', fieldKey, onChange }: A2DateTimeInputProps) {
  return (
    <div style={STYLES.fieldGroup}>
      {label && (
        <span style={STYLES.label}>
          {label}
          {required && <span style={STYLES.requiredStar}>*</span>}
        </span>
      )}
      <input
        style={STYLES.input}
        type={type}
        onChange={e => onChange(fieldKey, e.target.value)}
      />
    </div>
  )
}

// ─── A2UI INPUT FORM ──────────────────────────────────────────────────────────
// Top-level component: renders the full input form described by the agent's a2ui JSON

export interface A2UIField {
  component: string      // textfield | number | choicepicker | checkbox | slider | datetime
  key: string            // unique key for the field value
  label?: string
  placeholder?: string
  required?: boolean
  multiline?: boolean
  options?: string[]     // for choicepicker
  multi?: boolean        // for choicepicker
  min?: number
  max?: number
  step?: number
  value?: string | number | boolean
  type?: string          // for datetime: 'date' | 'datetime-local' | 'time'
}

export interface A2UIFormNode {
  component: 'form' | 'column' | 'card'
  title?: string
  subtitle?: string
  submit_label?: string
  children?: (A2UIField | A2UIFormNode)[]
  // flat field shorthand (when node is itself a field)
  key?: string
  label?: string
  placeholder?: string
  required?: boolean
  multiline?: boolean
  options?: string[]
  multi?: boolean
  min?: number
  max?: number
  step?: number
  value?: string | number | boolean
  type?: string
}

interface A2InputFormProps {
  data: { a2ui: A2UIFormNode }
  onSubmit: (message: string) => void
}

export function A2InputForm({ data, onSubmit }: A2InputFormProps) {
  const root = data.a2ui
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const handleFieldChange = (key: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [key]: value }))
  }

  const buildMessage = () => {
    // Build a natural-language message from the collected field values
    const parts = Object.entries(fieldValues)
      .filter(([, v]) => v !== '' && v !== undefined)
      .map(([k, v]) => `${k}: ${v}`)
    return parts.join('\n')
  }

  const handleSubmit = () => {
    if (submitted) return
    const msg = buildMessage()
    if (!msg.trim()) return
    setSubmitted(true)
    onSubmit(msg)
  }

  const collectFields = (node: A2UIFormNode | A2UIField): A2UIField[] => {
    // If this node is itself a field (has a key and is not a layout component)
    const layoutComponents = ['form', 'column', 'card', 'row']
    const comp = (node.component || '').toLowerCase()
    if (!layoutComponents.includes(comp) && (node as A2UIField).key) {
      return [node as A2UIField]
    }
    // Otherwise recurse into children
    const children = (node as A2UIFormNode).children || []
    return children.flatMap(c => collectFields(c as A2UIFormNode | A2UIField))
  }

  const renderField = (field: A2UIField, idx: number) => {
    const key = field.key || `field_${idx}`
    const comp = (field.component || '').toLowerCase()
    const commonProps = { key, label: field.label, required: field.required, fieldKey: key, onChange: handleFieldChange }

    switch (comp) {
      case 'textfield':
      case 'input':
      case 'text':
        return <A2TextField {...commonProps} placeholder={field.placeholder} multiline={field.multiline} value={String(field.value ?? '')} />
      case 'number':
      case 'numberfield':
        return <A2NumberField {...commonProps} placeholder={field.placeholder} value={field.value as number} min={field.min} max={field.max} />
      case 'choicepicker':
      case 'select':
      case 'choice':
        return <A2ChoicePicker {...commonProps} options={field.options} multi={field.multi} />
      case 'checkbox':
      case 'check':
        return <A2CheckBox {...commonProps} checked={Boolean(field.value)} />
      case 'slider':
        return <A2Slider {...commonProps} min={field.min} max={field.max} value={field.value as number} step={field.step} />
      case 'datetime':
      case 'datetimeinput':
      case 'date':
        return <A2DateTimeInput {...commonProps} type={(field.type as 'date' | 'datetime-local' | 'time') || 'date'} />
      default:
        return null
    }
  }

  const fields = collectFields(root)
  const title = root.title
  const subtitle = root.subtitle
  const submitLabel = root.submit_label || 'Submit'

  return (
    <div style={STYLES.form}>
      {title && (
        <div style={STYLES.formTitle}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="hsl(var(--primary))">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-9 11H7v-2h4v2zm6-4H7V7h10v2z"/>
          </svg>
          {title}
        </div>
      )}
      {subtitle && <div style={STYLES.formSubtitle}>{subtitle}</div>}

      {fields.map((field, idx) => renderField(field, idx))}

      <button
        type="button"
        style={{ ...STYLES.submitBtn, opacity: submitted ? 0.5 : 1 }}
        onClick={handleSubmit}
        disabled={submitted}
      >
        <SvgIcon name="send" size={13} />
        {submitted ? 'Sent!' : submitLabel}
      </button>
    </div>
  )
}
