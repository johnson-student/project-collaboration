import { useState } from "react";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { toggleDarkMode, selectDarkMode } from "../../features/ui/uiSlice.js";
import { useUpdateUserMutation } from "../../features/users/userApiSlice.js";
import { selectCurrentUser } from "../../features/auth/authSlice.js";
import { Button } from "../../components/ui/index.jsx";
import { Input, Select } from "../../components/forms/index.jsx";
import { Icon } from "../../components/common/icons.jsx";

function SettingSection({ title, description, children }) {
  return (
    <div className="rounded-2xl border border-white/6 p-5" style={{ background:"#111827" }}>
      <div className="mb-4">
        <h3 className="font-display font-semibold text-white text-base">{title}</h3>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-300">{label}</p>
        {description && <p className="text-xs text-slate-600 mt-0.5">{description}</p>}
      </div>
      <button onClick={() => onChange(!checked)} style={{ width:40, height:22 }}
        className={`relative rounded-full transition-all duration-200 ${checked ? "bg-brand-500" : "bg-white/10"}`}>
        <span style={{ width:18, height:18, top:2, left: checked ? 20 : 2 }}
          className="absolute rounded-full bg-white shadow transition-all duration-200"/>
      </button>
    </div>
  );
}

export default function Settings() {
  const dispatch    = useDispatch();
  const darkMode    = useSelector(selectDarkMode);
  const currentUser = useSelector(selectCurrentUser);
  const [updateUser] = useUpdateUserMutation();

  const [notifs, setNotifs] = useState({ email:true, taskAssigned:true, projectUpdates:false, deadlineReminders:true, weeklyDigest:false });
  const [pwForm, setPwForm] = useState({ current:"", newPw:"", confirm:"" });
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const handleSaveSettings = () => { setSettingsSaved(true); setTimeout(() => setSettingsSaved(false), 2500); };

  const handleChangePassword = async (e) => {
    e.preventDefault(); setPwError("");
    if (!pwForm.current)        return setPwError("Current password is required.");
    if (pwForm.newPw.length < 8) return setPwError("New password must be at least 8 characters.");
    if (pwForm.newPw !== pwForm.confirm) return setPwError("Passwords do not match.");
    try {
      // Backend endpoint: PUT /api/users/:id with { currentPassword, newPassword }
      await updateUser({ id: currentUser.id, currentPassword: pwForm.current, newPassword: pwForm.newPw }).unwrap();
      setPwForm({ current:"", newPw:"", confirm:"" });
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 2500);
    } catch (err) {
      setPwError(err?.data?.message || "Failed to change password.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Appearance */}
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
        <SettingSection title="Appearance" description="Customize the look and feel">
          <Toggle label="Dark Mode" description="Use dark theme across the interface" checked={darkMode} onChange={() => dispatch(toggleDarkMode())}/>
          <div className="pt-3">
            <Select label="Accent Color" options={[
              { value:"indigo",  label:"Indigo (Default)" },
              { value:"violet",  label:"Violet" },
              { value:"blue",    label:"Blue" },
              { value:"emerald", label:"Emerald" },
            ]}/>
          </div>
        </SettingSection>
      </motion.div>

      {/* Notifications */}
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}>
        <SettingSection title="Notifications" description="Control what alerts you receive">
          <Toggle label="Email Notifications"  description="Receive updates via email"           checked={notifs.email}             onChange={(v) => setNotifs({...notifs, email:v})}/>
          <Toggle label="Task Assigned"        description="When a task is assigned to you"      checked={notifs.taskAssigned}      onChange={(v) => setNotifs({...notifs, taskAssigned:v})}/>
          <Toggle label="Project Updates"      description="Status changes in your projects"    checked={notifs.projectUpdates}    onChange={(v) => setNotifs({...notifs, projectUpdates:v})}/>
          <Toggle label="Deadline Reminders"   description="24h before task deadlines"          checked={notifs.deadlineReminders}  onChange={(v) => setNotifs({...notifs, deadlineReminders:v})}/>
          <Toggle label="Weekly Digest"        description="Summary email every Monday"         checked={notifs.weeklyDigest}       onChange={(v) => setNotifs({...notifs, weeklyDigest:v})}/>
        </SettingSection>
      </motion.div>

      {/* Password */}
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>
        <SettingSection title="Change Password" description="Update your login credentials">
          <form onSubmit={handleChangePassword} className="space-y-4">
            {pwError && <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{pwError}</div>}
            {pwSaved && <div className="text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-3 py-2 flex items-center gap-1.5"><Icon name="check" className="w-3.5 h-3.5" />Password changed successfully</div>}
            <Input label="Current Password" type="password" placeholder="••••••••" value={pwForm.current} onChange={(e) => setPwForm({...pwForm, current:e.target.value})}/>
            <Input label="New Password"     type="password" placeholder="Min. 8 characters" value={pwForm.newPw} onChange={(e) => setPwForm({...pwForm, newPw:e.target.value})}/>
            <Input label="Confirm Password" type="password" placeholder="Repeat new password" value={pwForm.confirm} onChange={(e) => setPwForm({...pwForm, confirm:e.target.value})}/>
            <div className="flex justify-end">
              <Button type="submit">Update Password</Button>
            </div>
          </form>
        </SettingSection>
      </motion.div>

      {/* Workspace */}
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}>
        <SettingSection title="Workspace" description="Team and collaboration preferences">
          <div className="space-y-4">
            <Select label="Default Task View" options={[{ value:"list", label:"List View" },{ value:"kanban", label:"Kanban Board" }]}/>
            <Select label="Date Format" options={[{ value:"mdy", label:"MM/DD/YYYY" },{ value:"dmy", label:"DD/MM/YYYY" },{ value:"iso", label:"YYYY-MM-DD" }]}/>
          </div>
        </SettingSection>
      </motion.div>

      {/* Save */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {settingsSaved && <motion.span initial={{ opacity:0 }} animate={{ opacity:1 }} className="text-xs text-emerald-400 font-semibold inline-flex items-center gap-1"><Icon name="check" className="w-3.5 h-3.5" />Settings saved</motion.span>}
        <Button onClick={handleSaveSettings}>Save Settings</Button>
      </div>
    </div>
  );
}
