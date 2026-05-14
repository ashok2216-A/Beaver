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
    gap: '16px',
    padding: '24px',
    borderRadius: '24px',
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    width: '100%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    fontFamily: 'inherit',
    color: 'inherit',
  },
  formTitle: {
    fontSize: '15px',
    fontWeight: 800,
    color: 'inherit',
    marginBottom: '2px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    letterSpacing: '-0.025em',
  },
  formSubtitle: {
    fontSize: '12px',
    opacity: 0.6,
    marginBottom: '4px',
    fontWeight: 500,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    padding: '12px',
    background: 'rgba(0, 0, 0, 0.05)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  label: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  requiredStar: {
    color: '#ef4444',
    marginLeft: '3px',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1.5px solid #cbd5e1',
    background: 'white',
    color: '#1e293b',
    fontSize: '13px',
    fontWeight: 500,
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'all 0.2s ease',
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1.5px solid #cbd5e1',
    background: 'white',
    color: '#1e293b',
    fontSize: '13px',
    fontWeight: 500,
    outline: 'none',
    resize: 'vertical' as const,
    minHeight: '80px',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
  },
  choiceOptions: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '6px',
  },
  choiceBtn: (selected: boolean) => ({
    padding: '6px 14px',
    borderRadius: '8px',
    border: `2px solid ${selected ? '#0f172a' : '#e2e8f0'}`,
    background: selected ? '#0f172a' : 'white',
    color: selected ? 'white' : '#475569',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  }),
  submitBtn: {
    padding: '12px 24px',
    borderRadius: '12px',
    border: 'none',
    background: '#0f172a',
    color: 'white',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    alignSelf: 'stretch' as const,
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.2)',
    marginTop: '4px',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    padding: '12px',
    borderRadius: '16px',
    background: '#f8fafc',
    border: '1px solid #f1f5f9',
    transition: 'all 0.2s ease',
  },
  checkboxBox: (checked: boolean) => ({
    width: '20px',
    height: '20px',
    borderRadius: '6px',
    border: `2px solid ${checked ? '#0f172a' : '#cbd5e1'}`,
    background: checked ? '#0f172a' : 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.2s ease',
    color: 'white',
  }),
  sliderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: '#f8fafc',
    borderRadius: '16px',
    border: '1px solid #f1f5f9',
  },
  sliderVal: {
    fontSize: '13px',
    fontWeight: 800,
    color: '#0f172a',
    minWidth: '35px',
    textAlign: 'center' as const,
  },
  audioContainer: {
    padding: '16px',
    background: '#f8fafc',
    borderRadius: '16px',
    border: '1px solid #f1f5f9',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  audioPlayer: {
    width: '100%',
    height: '40px',
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
  onChange: (key: string, value: any) => void
}

export function A2TextField({ label, required, placeholder = 'Type here…', value = '', multiline = false, fieldKey, onChange }: A2TextFieldProps) {
  return (
    <div style={STYLES.fieldGroup}>
      {label && (
        <span style={STYLES.label}>
          {String(label)}
          {required && <span style={STYLES.requiredStar}>*</span>}
        </span>
      )}
      {multiline ? (
        <textarea
          style={STYLES.textarea}
          placeholder={placeholder}
          defaultValue={String(value)}
          onChange={e => onChange(fieldKey, e.target.value)}
        />
      ) : (
        <input
          style={STYLES.input}
          type="text"
          placeholder={placeholder}
          defaultValue={String(value)}
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
  onChange: (key: string, value: any) => void
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
        onChange={e => onChange(fieldKey, Number(e.target.value))}
      />
    </div>
  )
}

// Choice picker (single or multi)
interface A2ChoicePickerProps extends FieldProps {
  options?: string[]
  multi?: boolean
  fieldKey: string
  onChange: (key: string, value: any) => void
}

export function A2ChoicePicker({ label, required, options = [], multi = false, fieldKey, onChange }: A2ChoicePickerProps) {
  const [selected, setSelected] = useState<string[]>([])

  const toggle = (opt: any) => {
    const optValue = typeof opt === 'object' ? (opt.value ?? opt.id ?? String(opt)) : String(opt)
    const next = multi
      ? selected.includes(optValue) ? selected.filter(x => x !== optValue) : [...selected, optValue]
      : [optValue]
    setSelected(next)
    onChange(fieldKey, next.length === 1 && !multi ? next[0] : next)
  }

  return (
    <div style={STYLES.fieldGroup}>
      {label && (
        <span style={STYLES.label}>
          {String(label)}
          {required && <span style={STYLES.requiredStar}>*</span>}
        </span>
      )}
      <div style={STYLES.choiceOptions}>
        {options.map((opt: any, i) => {
          const optLabel = typeof opt === 'object' ? (opt.label ?? opt.name ?? String(opt)) : String(opt)
          const optValue = typeof opt === 'object' ? (opt.value ?? opt.id ?? String(opt)) : String(opt)
          return (
            <button
              key={i}
              type="button"
              style={STYLES.choiceBtn(selected.includes(optValue))}
              onClick={() => toggle(opt)}
            >
              {optLabel}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Checkbox
interface A2CheckBoxProps extends FieldProps {
  checked?: boolean
  fieldKey: string
  onChange: (key: string, value: any) => void
}

export function A2CheckBox({ label, required, checked: initial = false, fieldKey, onChange }: A2CheckBoxProps) {
  const [checked, setChecked] = useState(initial)

  const toggle = () => {
    const next = !checked
    setChecked(next)
    onChange(fieldKey, next)
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
  onChange: (key: string, value: any) => void
}

export function A2Slider({ label, required, min = 0, max = 100, value: initial = 50, step = 1, fieldKey, onChange }: A2SliderProps) {
  const [value, setValue] = useState(initial)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value)
    setValue(v)
    onChange(fieldKey, v)
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
  onChange: (key: string, value: any) => void
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

// Audio Player
interface A2AudioPlayerProps extends FieldProps {
  src?: string
  data?: string
  title?: string
}

export function A2AudioPlayer({ label, src, data, title }: A2AudioPlayerProps) {
  // If data is provided without the prefix, add it
  const audioSrc = src || (data ? (data.startsWith('data:') ? data : `data:audio/mpeg;base64,${data}`) : '')
  
  return (
    <div style={STYLES.audioContainer}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ padding: '8px', background: '#0f172a', borderRadius: '10px', color: 'white' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={STYLES.label}>{String(label || 'Audio Playback')}</span>
          {title && <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>{String(title)}</span>}
        </div>
      </div>
      <audio 
        controls 
        src={audioSrc} 
        style={STYLES.audioPlayer} 
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
  src?: string           // for audioplayer
  data?: string          // for audioplayer
  title?: string         // for audioplayer
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
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({})
  const [submitted, setSubmitted] = useState(false)

  const handleFieldChange = (key: string, value: any) => {
    setFieldValues(prev => ({ ...prev, [key]: value }))
  }

  const buildMessage = () => {
    const payload = JSON.stringify(fieldValues, null, 2)
    return `Form submission:\n\`\`\`json\n${payload}\n\`\`\``
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
    const commonProps = { label: field.label, required: field.required, fieldKey: key, onChange: handleFieldChange }

    switch (comp) {
      case 'textfield':
      case 'input':
      case 'text':
        return <A2TextField key={key} {...commonProps} placeholder={field.placeholder} multiline={field.multiline} value={String(field.value ?? '')} />
      case 'number':
      case 'numberfield':
        return <A2NumberField key={key} {...commonProps} placeholder={field.placeholder} value={field.value as number} min={field.min} max={field.max} />
      case 'choicepicker':
      case 'select':
      case 'choice':
        return <A2ChoicePicker key={key} {...commonProps} options={field.options} multi={field.multi} />
      case 'checkbox':
      case 'check':
        return <A2CheckBox key={key} {...commonProps} checked={Boolean(field.value)} />
      case 'slider':
        return <A2Slider key={key} {...commonProps} min={field.min} max={field.max} value={field.value as number} step={field.step} />
      case 'datetime':
      case 'datetimeinput':
      case 'date':
        return <A2DateTimeInput key={key} {...commonProps} type={(field.type as 'date' | 'datetime-local' | 'time') || 'date'} />
      case 'audioplayer':
      case 'audio':
      case 'media':
        return <A2AudioPlayer key={key} {...commonProps} src={field.src} data={field.data} title={field.title} />
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
          {String(title)}
        </div>
      )}
      {subtitle && <div style={STYLES.formSubtitle}>{String(subtitle)}</div>}

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
