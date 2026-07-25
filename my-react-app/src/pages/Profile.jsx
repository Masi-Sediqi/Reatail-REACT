import { profileIcons } from '../data/dashboardData.js'
import './Profile.css'

function Profile({ onNotify, t }) {
  const CameraIcon = profileIcons.camera
  const MailIcon = profileIcons.mail
  const PhoneIcon = profileIcons.phone
  const SaveIcon = profileIcons.save
  const ShieldIcon = profileIcons.shield
  const UserIcon = profileIcons.user

  return (
    <div className="profile-content">
      <div className="profile-heading">
        <div>
          <h1>{t.myProfile}</h1>
          <p>{t.manageAccount}</p>
        </div>
        <button className="save-btn" type="button" onClick={() => onNotify?.(t.savedSuccessfully)}>
          <SaveIcon size={18} />
          <span>{t.saveChanges}</span>
        </button>
      </div>

      <section className="profile-card">
        <h2>{t.profileInfo}</h2>
        <p>{t.updatePersonal}</p>

        <div className="profile-identity">
          <div className="profile-avatar">
            <span>A</span>
            <button type="button" aria-label="Change photo">
              <CameraIcon size={17} />
            </button>
          </div>
          <div>
            <strong>{t.administrator}</strong>
            <span>{t.admin}</span>
            <small>RetailPro</small>
          </div>
        </div>

        <form className="profile-form">
          <label>
            <span>
              <UserIcon size={17} />
              {t.fullName}
            </span>
            <input defaultValue={t.administrator} />
          </label>
          <label>
            <span>
              <ShieldIcon size={17} />
              {t.role}
            </span>
            <input defaultValue={t.admin} />
          </label>
          <label>
            <span>
              <MailIcon size={17} />
              {t.emailAddress}
            </span>
            <input placeholder="your.email@example.com" />
          </label>
          <label>
            <span>
              <PhoneIcon size={17} />
              {t.phoneNumber}
            </span>
            <input placeholder="+1 234 567 890" />
          </label>
        </form>
      </section>

      <section className="profile-card account-card">
        <h2>{t.accountInfo}</h2>
        <div className="account-stats">
          <div>
            <span>{t.memberSince}</span>
            <strong>June 2026</strong>
          </div>
          <div>
            <span>{t.lastUpdated}</span>
            <strong>Jun 29, 2026</strong>
          </div>
          <div>
            <span>{t.status}</span>
            <strong className="status-active">{t.active}</strong>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Profile
