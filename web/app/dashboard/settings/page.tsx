import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getUserSettings } from "@/lib/actions/sleep"
import { updateSettings } from "@/lib/actions/user"

export default async function SettingsPage() {
  const settings = await getUserSettings()
  
  // Calculate duration for display
  const bed = new Date(`2000-01-01T${settings?.target_bedtime || '23:00'}`)
  const wake = new Date(`2000-01-01T${settings?.target_wake_time || '07:00'}`)
  if (wake < bed) wake.setDate(wake.getDate() + 1)
  const duration = (wake.getTime() - bed.getTime()) / (1000 * 60 * 60)

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-medium">Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your sleep goals and application preferences.
        </p>
      </div>
      
      <div className="border rounded-md p-6">
         <form action={async (formData) => {
            "use server"
            await updateSettings(formData)
         }} className="space-y-4">
            <h4 className="font-semibold">Sleep Schedule Targets</h4>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="target_bedtime">Target Bedtime</Label>
                    <Input 
                        id="target_bedtime" 
                        name="target_bedtime" 
                        type="time" 
                        defaultValue={settings?.target_bedtime || '23:00'}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="target_wake_time">Target Wake Time</Label>
                    <Input 
                        id="target_wake_time" 
                        name="target_wake_time" 
                        type="time" 
                        defaultValue={settings?.target_wake_time || '07:00'}
                    />
                </div>
            </div>

            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                Goal Duration: <span className="font-semibol text-foreground">{duration.toFixed(1)} hours</span>
            </div>

            <div className="pt-2">
                <Button type="submit">Save Changes</Button>
            </div>
         </form>
      </div>
    </div>
  )
}
