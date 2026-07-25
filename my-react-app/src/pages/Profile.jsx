import { useEffect, useRef, useState } from 'react'
import { profileIcons } from '../data/dashboardData.js'
import './Profile.css'

const emptyProfile = {
  fullName: '',
  role: '',
  email: '',
  phone: '',
  photo: '',
}

function Profile({ companyInfo, onCompanyInfoChange, onNotify, t }) {
  const CameraIcon = profileIcons.camera
  const MailIcon = profileIcons.mail
  const PhoneIcon = profileIcons.phone
  const SaveIcon = profileIcons.save
  const ShieldIcon = profileIcons.shield
  const UserIcon = profileIcons.user
  const fileInputRef = useRef(null)
  const storedProfile = companyInfo?.profile ?? {}
  const [form, setForm] = useState(() => ({
    ...emptyProfile,
    fullName: storedProfile.fullName || t.administrator || 'Administrator',
    role: storedProfile.role || t.admin || 'Admin',
    email: storedProfile.email || '',
    phone: storedProfile.phone || '',
    photo: storedProfile.photo || '',
  }))

  useEffect(() => {
    setForm({
      ...emptyProfile,
      fullName: storedProfile.fullName || t.administrator || 'Administrator',
      role: storedProfile.role || t.admin || 'Admin',
      email: storedProfile.email || '',
      phone: storedProfile.phone || '',
      photo: storedProfile.photo || '',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyInfo?.profile, t.admin, t.administrator])

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const uploadPhoto = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => update('photo', String(reader.result || ''))
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const saveProfile = () => {
    onCompanyInfoChange?.((current) => ({
      ...current,
      profile: {
        ...form,
        updatedAt: new Date().toISOString(),
      },
    }))
    onNotify?.(t.savedSuccessfully)
  }

  const initial = (form.fullName || 'A').trim().charAt(0).toUpperCase()

  return (
    <main className="profile-content">
      <header className="profile-heading">
        <div className="profile-heading-copy">
          <h1>{t.myProfile}</h1>
          <p>{t.manageAccount}</p>
        </div>

        <button
          className="save-btn profile-save-btn"
          type="button"
          onClick={saveProfile}
        >
          <SaveIcon size={16} />
          <span>{t.saveChanges}</span>
        </button>
      </header>

      <section className="profile-card profile-information-card">
        <header className="profile-card-heading">
          <h2>{t.profileInfo}</h2>
          <p>{t.updatePersonal}</p>
        </header>

        <div className="profile-identity">
          <div className="profile-photo-container">
            {form.photo ? (
              <img alt="" className="profile-photo-preview" src={form.photo} />
            ) : (
              <span className="profile-photo-initial">{initial}</span>
            )}

            <button
              className="profile-photo-upload"
              type="button"
              aria-label="Change profile photo"
              title="Change profile photo"
              onClick={() => fileInputRef.current?.click()}
            >
              <CameraIcon size={16} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={uploadPhoto} hidden />
          </div>

          <div className="profile-identity-details">
            <strong>{form.fullName || t.administrator}</strong>
            <span>{form.role || t.admin}</span>
            <small>{companyInfo?.name || 'RetailPro'}</small>
          </div>
        </div>

        <form
          className="profile-form"
          onSubmit={(event) => {
            event.preventDefault()
            saveProfile()
          }}
        >
          <label>
            <span className="profile-field-label">
              <UserIcon size={16} />
              {t.fullName}
            </span>

            <input
              type="text"
              value={form.fullName}
              onChange={(event) => update('fullName', event.target.value)}
            />
          </label>

          <label>
            <span className="profile-field-label">
              <ShieldIcon size={16} />
              {t.role}
            </span>

            <input
              type="text"
              value={form.role}
              onChange={(event) => update('role', event.target.value)}
            />
          </label>

          <label>
            <span className="profile-field-label">
              <MailIcon size={16} />
              {t.emailAddress}
            </span>

            <input
              type="email"
              placeholder="your.email@example.com"
              value={form.email}
              onChange={(event) => update('email', event.target.value)}
            />
          </label>

          <label>
            <span className="profile-field-label">
              <PhoneIcon size={16} />
              {t.phoneNumber}
            </span>

            <input
              type="tel"
              placeholder="+1 234 567 890"
              value={form.phone}
              onChange={(event) => update('phone', event.target.value)}
            />
          </label>
        </form>
      </section>

      <section className="profile-card account-card">
        <header className="profile-card-heading">
          <h2>{t.accountInfo}</h2>
        </header>

        <div className="account-stats">
          <article>
            <span>{t.memberSince}</span>
            <strong>July 2026</strong>
          </article>

          <article>
            <span>{t.lastUpdated}</span>
            <strong>{storedProfile.updatedAt ? new Date(storedProfile.updatedAt).toLocaleDateString() : 'July 2026'}</strong>
          </article>

          <article>
            <span>{t.status}</span>
            <strong className="status-active">
              {t.active}
            </strong>
          </article>
        </div>
      </section>
    </main>
  )
}

export default Profile
