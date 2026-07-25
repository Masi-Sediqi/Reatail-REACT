import CustomSelect from './CustomSelect.jsx'
import './CustomFieldInputs.css'

function CustomFieldInputs({ className = '', fields = [], onChange, submitted = false, title = 'CUSTOM FIELDS', values = {} }) {
  if (!fields.length) return null

  return (
    <div className={`custom-field-inputs wide ${className}`.trim()}>
      <h3>{title}</h3>
      {fields.map((field) => {
        const value = values[field.id] ?? ''
        const isInvalid = submitted && field.required && !String(value).trim()
        const dropdownOptions = (field.options || []).map((option) => ({ value: option, label: option }))

        return (
          <label className="custom-field-input" key={field.id}>
            <span>
              {field.label}
              {field.required && <em>*</em>}
            </span>
            {field.type === 'dropdown' && dropdownOptions.length ? (
              <CustomSelect
                ariaLabel={field.label}
                options={[{ value: '', label: field.placeholder || 'Select option' }, ...dropdownOptions]}
                value={value}
                onChange={(nextValue) => onChange(field.id, nextValue)}
              />
            ) : (
              <input
                className={isInvalid ? 'field-invalid' : ''}
                placeholder={field.placeholder}
                type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                value={value}
                onChange={(event) => onChange(field.id, event.target.value)}
              />
            )}
          </label>
        )
      })}
    </div>
  )
}

export default CustomFieldInputs
