'use client'

import { useState } from 'react'

// ─── SVG ICONS ────────────────────────────────────────────────────────────────

const ICON_PATHS: Record<string, React.ReactNode> = {
  send:     <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>,
  check:    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>,
  close:    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>,
  calendar: <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>,
  loader: (
    <g fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
    </g>
  ),
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
        {(!options || options.length === 0) ? (
          <input
            style={STYLES.input}
            type="text"
            placeholder="Enter value (e.g. 'primary')..."
            onChange={e => onChange(fieldKey, e.target.value)}
          />
        ) : (
          options.map((opt: any, i) => {
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
          })
        )}
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

// Video Player
interface A2VideoPlayerProps extends FieldProps {
  src?: string
  title?: string
}

export function A2VideoPlayer({ label, src, title }: A2VideoPlayerProps) {
  if (!src) return null;
  
  // Basic youtube url converter for embed
  let embedUrl = src;
  if (src.includes('youtube.com/watch')) {
    try {
      const urlObj = new URL(src);
      const v = urlObj.searchParams.get('v');
      if (v) embedUrl = `https://www.youtube.com/embed/${v}`;
    } catch (e) {}
  } else if (src.includes('youtu.be/')) {
    const v = src.split('youtu.be/')[1]?.split('?')[0];
    if (v) embedUrl = `https://www.youtube.com/embed/${v}`;
  }
  
  return (
    <div style={STYLES.audioContainer}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ padding: '8px', background: '#e11d48', borderRadius: '10px', color: 'white' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
          </svg>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={STYLES.label}>{String(label || 'Video Playback')}</span>
          {title && <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>{String(title)}</span>}
        </div>
      </div>
      <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: '8px', overflow: 'hidden', marginTop: '8px' }}>
        <iframe 
          src={embedUrl}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen
        />
      </div>
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
    const parts = Object.entries(fieldValues)
      .filter(([, v]) => v !== '' && v !== undefined)
      .map(([k, v]) => {
        const keyName = k.replace(/_/g, ' ');
        const capKey = keyName.charAt(0).toUpperCase() + keyName.slice(1);
        return `${capKey}: ${v}`;
      })
    
    if (parts.length === 0) return "Submitted empty form.";
    return `Form submission:\n\n${parts.join('\n')}`
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
      case 'videoplayer':
      case 'video':
      case 'youtube':
        return <A2VideoPlayer key={key} {...commonProps} src={field.src} title={field.title} />
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

interface A2HumanApprovalProps {
  data: { a2ui: { action_id: string; tool_name: string; params: any } }
  onApprove: (actionId: string) => Promise<void> | void
  onReject: (actionId: string) => Promise<void> | void
}


export function A2HumanApproval({ data, onApprove, onReject }: A2HumanApprovalProps) {
  const a2uiData: any = data?.a2ui || {};
  const actionId = a2uiData.action_id || a2uiData.actionId;
  const toolName = a2uiData.tool_name || a2uiData.toolName;
  const params = a2uiData.params;

  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | 'executed'>('pending');

  const handleApprove = async () => {
    setStatus('approved');
    await onApprove(actionId);
    setStatus('executed');
  };

  const handleReject = async () => {
    setStatus('rejected');
    if (onReject) await onReject(actionId);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '12px 4px', background: 'transparent', width: '100%' }}>
      <div style={{ fontSize: '18px', fontWeight: 800, color: 'inherit', display: 'flex', alignItems: 'center', gap: '10px' }}>
        {status === 'pending' ? (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#f59e0b">
              <path d="M12 2L1 21h22L12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/>
            </svg>
            Action Requires Approval
          </>
        ) : status === 'executed' || status === 'approved' ? (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#10b981">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
            </svg>
            Action Approved
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#ef4444">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
            </svg>
            Action Rejected
          </>
        )}
      </div>

      {Object.keys(params || {}).length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', background: 'rgba(0,0,0,0.02)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)' }}>
          {Object.entries(params || {}).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {key.replace(/_/g, ' ')}
              </span>
              <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: 500, wordBreak: 'break-word' }}>
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </span>
            </div>
          ))}
        </div>
      )}
      
      {status === 'pending' ? (
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button 
            type="button" 
            style={{ 
              padding: '6px 16px', 
              borderRadius: '99px', 
              background: '#10b981', 
              color: 'white', 
              border: 'none',
              fontSize: '12px', 
              fontWeight: 700, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'opacity 0.2s',
              boxShadow: '0 2px 4px rgba(16,185,129,0.2)'
            }}
            onClick={handleApprove}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            <SvgIcon name="check" size={12} /> Approve
          </button>
          <button 
            type="button" 
            style={{ 
              padding: '6px 16px', 
              borderRadius: '99px', 
              background: 'transparent', 
              color: '#64748b', 
              border: '1px solid #e2e8f0',
              fontSize: '12px', 
              fontWeight: 700, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
            onClick={handleReject}
            onMouseOver={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fecaca'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
          >
            <SvgIcon name="close" size={12} /> Reject
          </button>
        </div>
      ) : (
        <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 'bold', color: status === 'executed' ? '#10b981' : status === 'approved' ? '#f59e0b' : '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {status === 'approved' ? (
            <>
              <SvgIcon name="loader" size={16} /> Executing Action...
            </>
          ) : status === 'executed' ? (
            <>
              <SvgIcon name="check" size={16} /> Action Executed
            </>
          ) : (
            <>
              <SvgIcon name="close" size={16} /> Action Rejected
            </>
          )}
        </div>
      )}
    </div>
  )
}


interface FlightSegment {
  flight_number: string
  airline: string
  logo_url?: string
  origin: string
  origin_name?: string
  destination: string
  destination_name?: string
  departure_time: string
  arrival_time: string
  duration: string
  cabin_class: string
  aircraft_name: string
  baggage_checked: string
  baggage_carry_on: string
  wifi: string
  power: string
  seat_pitch: string
  origin_terminal?: string | null
  destination_terminal?: string | null
  distance_km?: string | null
  layover?: string
}

interface FlightSlice {
  origin: string
  destination: string
  departure_time: string
  arrival_time: string
  duration: string
  duration_minutes: number
  stops_count: number
  stops_text: string
  carbon_emissions: string
  airline: string
  logo_url: string
  flight_number: string
  segments?: FlightSegment[]
  change_penalty?: string
  refund_penalty?: string
}

interface FlightOffer {
  airline: string
  logo_url?: string
  price: string
  currency: string
  offer_id: string
  redirect_url: string
  slices: FlightSlice[]
}

interface A2FlightsListProps {
  data: {
    a2ui: {
      component: string
      data: FlightOffer[]
    }
  }
}

export function A2FlightsList({ data }: A2FlightsListProps) {
  const offers = data?.a2ui?.data || []
  const [expandedOfferId, setExpandedOfferId] = useState<string | null>(null)

  const getCurrencySymbol = (code: string) => {
    switch (code?.toUpperCase()) {
      case 'USD': return '$'
      case 'EUR': return '€'
      case 'GBP': return '£'
      case 'INR': return '₹'
      default: return code + ' '
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedOfferId(expandedOfferId === id ? null : id)
  }

  if (offers.length === 0) {
    return (
      <div className="p-6 bg-slate-900/30 border border-slate-800 rounded-2xl text-center text-slate-400 text-sm font-medium mt-4">
        No flights found matching the criteria.
      </div>
    )
  }

  return (
    <div className="w-full space-y-4 mt-4">
      <div className="flex items-center gap-2 mb-1">
        <svg className="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l7 2.5z"/>
        </svg>
        <span className="text-sm font-bold tracking-wide text-slate-700 uppercase">Available Flights</span>
      </div>

      <div className="space-y-3">
        {offers.map((offer) => {
          const isExpanded = expandedOfferId === offer.offer_id
          const currencySymbol = getCurrencySymbol(offer.currency)
          const primarySlice = offer.slices?.[0]
          
          if (!primarySlice) return null

          const isRoundTrip = offer.slices.length > 1

          return (
            <div
              key={offer.offer_id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl overflow-hidden transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {/* Main row */}
              <div
                onClick={() => toggleExpand(offer.offer_id)}
                className="p-3 md:p-4 flex flex-nowrap items-center justify-between gap-3 md:gap-4 cursor-pointer select-none"
              >
                <div className="flex flex-nowrap items-center gap-3 md:gap-4 flex-1 min-w-0">
                  {/* Airline Logo & Name */}
                  <div className="flex flex-col items-center justify-center shrink-0 min-w-[64px] px-1">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50/80 border border-slate-100 rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
                      {offer.logo_url || primarySlice.logo_url ? (
                        <img
                          src={offer.logo_url || primarySlice.logo_url}
                          alt={offer.airline}
                          className="w-7 h-7 md:w-8 md:h-8 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling?.setAttribute('style', 'display:block')
                          }}
                        />
                      ) : null}
                      <div style={{ display: offer.logo_url || primarySlice.logo_url ? 'none' : 'block' }}>
                        {/* Premium fallback plane icon */}
                        <svg className="w-5 h-5 md:w-6 md:h-6 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l7 2.5z"/>
                        </svg>
                      </div>
                    </div>
                    <div className="text-[9px] md:text-[10px] text-slate-500 mt-1.5 font-bold text-center whitespace-nowrap">
                      {offer.airline}
                    </div>
                  </div>

                  {/* Flight Info - Sizes items naturally based on content length rather than rigid equal grid columns */}
                  <div className="flex items-center justify-between gap-2 md:gap-4 flex-1 min-w-0">
                    {/* Times */}
                    <div className="min-w-0 flex flex-col items-start">
                      <div className="text-[11px] md:text-xs font-bold text-slate-900 tracking-tight whitespace-nowrap">
                        {primarySlice.departure_time} – {primarySlice.arrival_time}
                      </div>
                      <div className="text-[9px] md:text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-bold whitespace-nowrap">Time</div>
                    </div>

                    {/* Duration & Route */}
                    <div className="min-w-0 flex flex-col items-start">
                      <div className="text-[11px] md:text-xs font-semibold text-slate-700 whitespace-nowrap">{primarySlice.duration}</div>
                      <div className="text-[10px] md:text-xs text-slate-500 mt-0.5 font-medium whitespace-nowrap">
                        {primarySlice.origin}–{primarySlice.destination}
                      </div>
                    </div>

                    {/* Stops */}
                    <div className="min-w-0 flex flex-col items-center">
                      <span className={`text-[11px] md:text-xs font-bold whitespace-nowrap ${primarySlice.stops_count === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {primarySlice.stops_text}
                      </span>
                    </div>

                    {/* CO2 Emissions */}
                    <div className="min-w-0 hidden sm:flex flex-col items-start">
                      <div className="text-[11px] md:text-xs font-semibold text-slate-700 whitespace-nowrap">
                        {primarySlice.carbon_emissions} kg CO2e
                      </div>
                      <div className="text-[9px] md:text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-bold whitespace-nowrap">Avg emissions</div>
                    </div>
                  </div>
                </div>

                {/* Price & Action */}
                <div className="flex items-center justify-end gap-2 md:gap-4 shrink-0 pl-2">
                  <div className="text-right">
                    <div className="text-base md:text-lg font-extrabold text-emerald-600 tracking-tight whitespace-nowrap">
                      {currencySymbol}{Number(offer.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5 font-bold whitespace-nowrap">
                      {isRoundTrip ? 'round trip' : 'one-way'}
                    </div>
                  </div>

                  <div className="text-slate-500">
                    <svg
                      className={`w-5 h-5 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-6 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-4">
                  {offer.slices.map((slice, sliceIdx) => (
                    <div key={sliceIdx} className="space-y-4">
                      {isRoundTrip && (
                        <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest mt-2">
                          {sliceIdx === 0 ? 'Outbound Flight' : 'Return Flight'}
                        </div>
                      )}

                      {/* Slice Conditions / Policies */}
                      {(slice.change_penalty || slice.refund_penalty) && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 border-b border-slate-200/40 pb-2 mb-2">
                          {slice.refund_penalty && slice.refund_penalty !== "Refund rules unavailable" && (
                            <div className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                              <span className="font-medium text-slate-600">{slice.refund_penalty}</span>
                            </div>
                          )}
                          {slice.change_penalty && slice.change_penalty !== "Change rules unavailable" && (
                            <div className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3 3L22 4" />
                              </svg>
                              <span className="font-medium text-slate-600">{slice.change_penalty}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Segments list */}
                      {(slice.segments && slice.segments.length > 0 ? slice.segments : [slice]).map((seg: any, segIdx) => {
                        const isSegmentObject = !!slice.segments
                        
                        return (
                          <div key={segIdx} className="space-y-3">
                            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:border-slate-300 transition-colors">
                              {/* Leg Details header */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
                                <div className="space-y-1">
                                  <div className="text-xs font-bold text-slate-600 flex items-center gap-2">
                                    <span>Flight Number:</span>
                                    <span className="font-mono text-slate-800 font-extrabold bg-slate-50 px-2 py-0.5 rounded border border-slate-200">{seg.flight_number || 'N/A'}</span>
                                    {isSegmentObject && (
                                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100/50">
                                        Leg {segIdx + 1}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    Airline: <span className="font-semibold text-slate-700">{seg.airline || offer.airline}</span>
                                    {seg.aircraft_name && seg.aircraft_name !== "Aircraft details not available" && (
                                      <span className="ml-2 pl-2 border-l border-slate-200">
                                        Aircraft: <span className="font-semibold text-slate-700">{seg.aircraft_name}</span>
                                      </span>
                                    )}
                                    {seg.distance_km && (
                                      <span className="ml-2 pl-2 border-l border-slate-200">
                                        Distance: <span className="font-semibold text-slate-700">{seg.distance_km} km</span>
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="text-xs text-slate-500 sm:text-right">
                                  <div>Departing: <span className="font-bold text-slate-800">{seg.departure_time}</span></div>
                                  <div className="mt-0.5">Arriving: <span className="font-bold text-slate-800">{seg.arrival_time}</span></div>
                                </div>
                              </div>

                              {/* Origin and Destination airports details */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
                                <div className="flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1 shrink-0" />
                                  <div>
                                    <div className="font-bold text-slate-800">
                                      {seg.origin} · {seg.origin_name || 'Airport'}
                                      {seg.origin_terminal && (
                                        <span className="ml-1.5 text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1 py-0.5 rounded">
                                          T{seg.origin_terminal}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">Origin Airport</div>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 shrink-0" />
                                  <div>
                                    <div className="font-bold text-slate-800">
                                      {seg.destination} · {seg.destination_name || 'Airport'}
                                      {seg.destination_terminal && (
                                        <span className="ml-1.5 text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1 py-0.5 rounded">
                                          T{seg.destination_terminal}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">Destination Airport</div>
                                  </div>
                                </div>
                              </div>

                              {/* Baggage & Amenities Grid */}
                              {isSegmentObject && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                                  {/* Baggage */}
                                  <div className="space-y-1">
                                    <span className="font-bold uppercase tracking-wider text-[9px] text-slate-400 block">Baggage Allowance</span>
                                    <div className="flex items-center gap-1.5">
                                      <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                      </svg>
                                      <span className="font-medium text-slate-700">{seg.baggage_checked}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                      </svg>
                                      <span className="font-medium text-slate-700">{seg.baggage_carry_on}</span>
                                    </div>
                                  </div>

                                  {/* Amenities */}
                                  <div className="space-y-1">
                                    <span className="font-bold uppercase tracking-wider text-[9px] text-slate-400 block">Onboard Amenities</span>
                                    {seg.wifi !== "Wifi details unavailable" && (
                                      <div className="flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071a10.5 10.5 0 0114.14 0M1.34 6.344a17.5 17.5 0 0121.32 0" />
                                        </svg>
                                        <span className="font-medium text-slate-700">{seg.wifi}</span>
                                      </div>
                                    )}
                                    {seg.power !== "Power details unavailable" && (
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <svg className="w-3.5 h-3.5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        <span className="font-medium text-slate-700">{seg.power}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Seat & Cabin */}
                                  <div className="space-y-1">
                                    <span className="font-bold uppercase tracking-wider text-[9px] text-slate-400 block">Class & Comfort</span>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-1.5 text-[9px] uppercase tracking-wider">
                                        {seg.cabin_class}
                                      </span>
                                      <span className="font-medium text-slate-700">{seg.seat_pitch}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Layover Alert */}
                            {seg.layover && (
                              <div className="flex items-center justify-center py-2 px-4 bg-amber-500/5 border border-dashed border-amber-200 rounded-xl text-xs font-semibold text-amber-700 gap-1.5 my-1">
                                <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{seg.layover}</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <a
                      href={offer.redirect_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-950/20 transition-all gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18 17H6v-2h12v2zm0-4H6v-2h12v2zm0-4H6V7h12v2zM3 5v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2zm16 14H5V5h14v14z"/>
                      </svg>
                      Book Now
                    </a>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigator.clipboard.writeText(offer.offer_id)
                        alert('Offer ID copied to clipboard!')
                      }}
                      className="inline-flex items-center justify-center px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 transition-all gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                      </svg>
                      Copy Offer ID
                    </button>
                    
                    <span className="text-[10px] font-mono text-slate-500 ml-auto break-all select-all">
                      ID: {offer.offer_id}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface A2MapProps {
  data: {
    a2ui: {
      component: string
      query?: string
      lat?: number | string
      lng?: number | string
      zoom?: number | string
      type?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain'
      title?: string
    }
  }
}

export function A2Map({ data }: A2MapProps) {
  const a2ui = data?.a2ui || {}
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>(
    a2ui.type || 'roadmap'
  )

  const query = a2ui.query || ''
  const lat = a2ui.lat
  const lng = a2ui.lng
  const zoom = a2ui.zoom || 13
  const title = a2ui.title || query || (lat && lng ? `Location (${lat}, ${lng})` : 'Map View')

  const mapTypeParam = mapType === 'satellite' ? 'k' : mapType === 'hybrid' ? 'h' : mapType === 'terrain' ? 'p' : 'm'
  const searchQuery = query ? query : (lat && lng ? `${lat},${lng}` : '')
  
  if (!searchQuery) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-medium mt-4">
        Invalid map location data provided.
      </div>
    )
  }

  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(searchQuery)}&t=${mapTypeParam}&z=${zoom}&ie=UTF8&iwloc=&output=embed`

  return (
    <div className="w-full bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 mt-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-12v8.25m-9.75 3.975c-.078.03-.154.07-.225.122A1.5 1.5 0 001.5 16.5v4.5A1.5 1.5 0 003 22.5h18a1.5 1.5 0 001.5-1.5v-4.5a1.5 1.5 0 00-1.225-1.403m-15.55 0L6 16.5m12 0l-1.225-1.403m0 0L12 13.5m0 0L7.05 16.5m4.95-3V3m0 0L8.25 6.75M12 3l3.75 3.75" />
          </svg>
          <span className="text-sm font-bold tracking-tight text-slate-800">{title}</span>
        </div>

        {/* Map Type Controls */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            onClick={() => setMapType('roadmap')}
            className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
              mapType === 'roadmap'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Map
          </button>
          <button
            onClick={() => setMapType('satellite')}
            className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
              mapType === 'satellite'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Satellite
          </button>
        </div>
      </div>

      {/* Map Iframe */}
      <div className="relative w-full h-[320px] rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-50">
        <iframe
          src={embedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen={false}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0"
        />
      </div>

      {/* Footer / Actions */}
      <div className="flex justify-end gap-3 mt-3">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 rounded-xl transition-all shadow-sm"
        >
          <span>Open in Google Maps</span>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      </div>
    </div>
  )
}

// ─── A2UI WEATHER CARD ─────────────────────────────────────────────────────────

export interface A2WeatherCardProps {
  data: {
    a2ui: {
      component: string;
      data?: {
        location: string;
        temp_max: number;
        temp_min: number;
        condition: string;
        forecast?: {
          day: string;
          condition: string;
          temp: number;
        }[];
      };
    };
  };
}

const SunnyIcon = () => (
  <img 
    src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Sun/3D/sun_3d.png" 
    alt="Sunny" 
    className="w-9 h-9 object-contain"
    loading="lazy"
  />
)

const PartlyCloudyIcon = () => (
  <img 
    src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Sun%20behind%20cloud/3D/sun_behind_cloud_3d.png" 
    alt="Partly Cloudy" 
    className="w-9 h-9 object-contain"
    loading="lazy"
  />
)

const CloudyIcon = () => (
  <img 
    src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Cloud/3D/cloud_3d.png" 
    alt="Cloudy" 
    className="w-9 h-9 object-contain"
    loading="lazy"
  />
)

const RainyIcon = () => (
  <img 
    src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Cloud%20with%20rain/3D/cloud_with_rain_3d.png" 
    alt="Rainy" 
    className="w-9 h-9 object-contain"
    loading="lazy"
  />
)

const SnowyIcon = () => (
  <img 
    src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Cloud%20with%20snow/3D/cloud_with_snow_3d.png" 
    alt="Snowy" 
    className="w-9 h-9 object-contain"
    loading="lazy"
  />
)

const StormyIcon = () => (
  <img 
    src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Cloud%20with%20lightning%20and%20rain/3D/cloud_with_lightning_and_rain_3d.png" 
    alt="Stormy" 
    className="w-9 h-9 object-contain"
    loading="lazy"
  />
)

const getWeatherIcon = (condition: string) => {
  const cond = (condition || '').toLowerCase()
  if (cond.includes('clear') || cond.includes('sun') || cond.includes('sunny')) return <SunnyIcon />
  if (cond.includes('partly') || cond.includes('scattered') || cond.includes('few clouds')) return <PartlyCloudyIcon />
  if (cond.includes('cloud') || cond.includes('overcast') || cond.includes('mist') || cond.includes('fog')) return <CloudyIcon />
  if (cond.includes('rain') || cond.includes('drizzle') || cond.includes('shower')) return <RainyIcon />
  if (cond.includes('snow') || cond.includes('sleet') || cond.includes('hail')) return <SnowyIcon />
  if (cond.includes('storm') || cond.includes('thunder') || cond.includes('lightning')) return <StormyIcon />
  return <SunnyIcon />
}

export function A2WeatherCard({ data }: A2WeatherCardProps) {
  const weather = data?.a2ui?.data
  
  if (!weather) {
    return (
      <div className="p-6 bg-slate-900/30 border border-slate-800 rounded-2xl text-center text-slate-400 text-sm font-medium mt-4">
        No weather data provided.
      </div>
    )
  }

  const { location = 'Unknown Location', temp_max = 0, temp_min = 0, condition = 'Unknown', forecast = [] } = weather
  const roundedMax = Math.round(temp_max)
  const roundedMin = Math.round(temp_min)
  const showSecondTemp = roundedMax !== roundedMin

  return (
    <div className="w-full max-w-[360px] bg-[#F7F8FA] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-[28px] p-5 shadow-[0_4px_16px_rgba(0,0,0,0.02)] mt-4">
      {/* Title */}
      <div className="text-[13px] font-medium text-[#7E7E7E] dark:text-slate-400 mb-3 pl-1">
        Weather Current
      </div>

      {/* Main card */}
      <div className="bg-white dark:bg-slate-950 border border-[#E5E7EB] dark:border-slate-800/80 rounded-[20px] p-5 flex flex-col">
        {/* Temp block - left aligned, big bold black fonts */}
        <div className="flex justify-start mb-6">
          <div className="flex items-baseline gap-2.5 pl-1">
            <span className="text-[40px] font-semibold text-[#111827] dark:text-white leading-none">
              {roundedMax}°
            </span>
            {showSecondTemp && (
              <span className="text-[26px] font-semibold text-[#6B7280] dark:text-slate-400 leading-none">
                {roundedMin}°
              </span>
            )}
          </div>
        </div>

        {/* Location Name */}
        <div className="text-[24px] font-semibold text-[#111827] dark:text-white mb-2 text-center">
          {location}
        </div>

        {/* Condition */}
        <div className="text-[15px] font-medium text-[#4B5563]/80 dark:text-slate-400 text-center mb-8">
          {condition}
        </div>

        {/* 5-day Forecast - Grid with no top border, updated font weights/sizes */}
        {forecast && forecast.length > 0 && (
          <div className="grid grid-cols-5 gap-1">
            {forecast.slice(0, 5).map((f, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <span className="text-[14px] font-medium text-[#9CA3AF] dark:text-slate-500 mb-3">
                  {f.day}
                </span>
                <div className="h-9 w-9 flex items-center justify-center mb-3">
                  {getWeatherIcon(f.condition)}
                </div>
                <span className="text-[15px] font-medium text-[#4B5563] dark:text-slate-300">
                  {Math.round(f.temp)}°
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


