export default SettingsPage

import { Settings02Icon } from "@hugeicons/core-free-icons"

import { ProfileGate } from "@/module/profile/components/profile-gate"
import { SettingsSurface } from "@/module/profile/components/settings-surface"

function SettingsPage() {
  return (
    <ProfileGate title="Account settings" Icon={Settings02Icon}>
      {(profile, save) => <SettingsSurface profile={profile} save={save} />}
    </ProfileGate>
  )
}
