import { Mail, Phone, Contact, UserPlus } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface ProgramAuthenticationProps {
  authEmail: boolean;
  authPhone: boolean;
  authIdentity: boolean;
  authAccount: string;
  setAuthEmail: (val: boolean) => void;
  setAuthPhone: (val: boolean) => void;
  setAuthIdentity: (val: boolean) => void;
  setAuthAccount: (val: string) => void;
}

export function ProgramAuthentication({
  authEmail,
  authPhone,
  authIdentity,
  authAccount,
  setAuthEmail,
  setAuthPhone,
  setAuthIdentity,
  setAuthAccount,
}: ProgramAuthenticationProps) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-[15px] font-extrabold text-slate-900">Patient Authentication</h3>
        <p className="text-[11px] text-slate-400 mt-1 max-w-2xl leading-relaxed font-medium">
          How patients verify their identity when starting this eligibility. Settings apply only when patients reach this eligibility directly via its URL slug — when reached through a custom form, the form's settings apply instead.
        </p>
      </div>

      <div className="divide-y divide-slate-100 p-6 space-y-4">
        {/* Email */}
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 rounded-lg bg-[#eff6ff] p-2 border border-[#dbeafe]">
              <Mail className="h-5 w-5 text-[#2563eb]" />
            </div>
            <div>
              <div className="text-[13px] font-extrabold text-slate-900">Email verification</div>
              <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                Send a verification email before the patient can submit. Strongly recommended for all eligibilities.
              </div>
            </div>
          </div>
          <Switch checked={authEmail} onCheckedChange={setAuthEmail} />
        </div>

        {/* Phone */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 rounded-lg bg-[#eff6ff] p-2 border border-[#dbeafe]">
              <Phone className="h-5 w-5 text-[#2563eb]" />
            </div>
            <div>
              <div className="text-[13px] font-extrabold text-slate-900">Phone verification (SMS OTP)</div>
              <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                One-time code sent via SMS. Useful for controlled substances or high-value treatments.
              </div>
            </div>
          </div>
          <Switch checked={authPhone} onCheckedChange={setAuthPhone} />
        </div>

        {/* Identity */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 rounded-lg bg-[#eff6ff] p-2 border border-[#dbeafe]">
              <Contact className="h-5 w-5 text-[#2563eb]" />
            </div>
            <div>
              <div className="text-[13px] font-extrabold text-slate-900">Identity verification (photo ID)</div>
              <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                Patient uploads a government-issued ID. Required for scheduled medications and TRT.
              </div>
            </div>
          </div>
          <Switch checked={authIdentity} onCheckedChange={setAuthIdentity} />
        </div>

        {/* Account Creation */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 rounded-lg bg-[#eff6ff] p-2 border border-[#dbeafe]">
              <UserPlus className="h-5 w-5 text-[#2563eb]" />
            </div>
            <div>
              <div className="text-[13px] font-extrabold text-slate-900">Account creation</div>
              <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                When patients must create a WellieMD account to proceed.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">Required:</span>
            <select
              value={authAccount}
              onChange={(e) => setAuthAccount(e.target.value)}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 outline-none shadow-sm focus:border-blue-400"
            >
              <option value="At intake start (recommended)">At intake start (recommended)</option>
              <option value="At checkout submit">At checkout submit</option>
              <option value="Optional">Optional</option>
            </select>
          </div>
        </div>
      </div>
    </section>
  );
}
