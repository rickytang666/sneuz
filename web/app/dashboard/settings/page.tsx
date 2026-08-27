import { ApiKeysManager } from "@/components/dashboard/api-keys-manager";
import { ConnectedAccounts } from "@/components/dashboard/connected-accounts";
import { TimezoneField } from "@/components/dashboard/timezone-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiKeys } from "@/lib/actions/api-keys";
import { getIdentities } from "@/lib/actions/identities";
import { getUserSettings } from "@/lib/actions/sleep";
import { updateSettings } from "@/lib/actions/user";

export default async function SettingsPage() {
  const [settings, apiKeys, identities] = await Promise.all([
    getUserSettings(),
    getApiKeys(),
    getIdentities(),
  ]);

  // Calculate duration for display
  const bed = new Date(`2000-01-01T${settings?.target_bedtime || "23:00"}`);
  const wake = new Date(`2000-01-01T${settings?.target_wake_time || "07:00"}`);
  if (wake < bed) wake.setDate(wake.getDate() + 1);
  const duration = (wake.getTime() - bed.getTime()) / (1000 * 60 * 60);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="border rounded-md p-6">
        <form
          action={async (formData) => {
            "use server";
            await updateSettings(formData);
          }}
          className="space-y-4"
        >
          <h4 className="font-semibold">Sleep Schedule Targets</h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="target_bedtime">Target Bedtime</Label>
              <Input
                className="text-sm sm:text-base"
                id="target_bedtime"
                name="target_bedtime"
                type="time"
                defaultValue={settings?.target_bedtime || "23:00"}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="target_wake_time">Target Wake Time</Label>
              <Input
                className="text-sm sm:text-base"
                id="target_wake_time"
                name="target_wake_time"
                type="time"
                defaultValue={settings?.target_wake_time || "07:00"}
              />
            </div>
          </div>

          <TimezoneField value={settings?.timezone ?? null} />

          <div className="text-sm text-muted-foreground p-3 rounded-md">
            Goal Duration:{" "}
            <span className="font-semibold text-primary">
              {duration.toFixed(1)} hours
            </span>
          </div>

          <div className="pt-2">
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </div>
      <div className="border rounded-md p-6 space-y-4">
        <h4 className="font-semibold">Connected Accounts</h4>
        <p className="text-sm text-muted-foreground">
          Sign in to this account with any connected method.
        </p>
        <ConnectedAccounts initialIdentities={identities} />
      </div>
      <div className="border rounded-md p-6 space-y-4">
        <h4 className="font-semibold">API Keys</h4>
        <p className="text-sm text-muted-foreground">
          Generate keys for external services to access your data via the API.
        </p>
        <ApiKeysManager initialKeys={apiKeys} />
      </div>
    </div>
  );
}
