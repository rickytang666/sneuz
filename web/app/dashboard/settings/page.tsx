export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your sleep goals and application preferences.
        </p>
      </div>
      <div className="grid gap-6">
         
         <div className="p-4 border rounded-md">
            <h4 className="font-semibold mb-2">Sleep Goals</h4>
            <p className="text-sm text-muted-foreground mb-4">Target Bedtime, Wake Time, Duration</p>
            {/* TODO: Add Sleep Settings Form */}
         </div>
      </div>
    </div>
  )
}
