export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Profile</h3>
        <p className="text-sm text-muted-foreground">
          Manage your public profile and sleep habits.
        </p>
      </div>
      <div className="grid gap-6">
         {/* Placeholders for Profile Form and Sleep Goal Form */}
         <div className="p-4 border rounded-md">
            <h4 className="font-semibold mb-2">User Profile</h4>
            <p className="text-sm text-muted-foreground mb-4">Name, Email, Avatar</p>
            {/* TODO: Add Profile Form */}
         </div>
         
         <div className="p-4 border rounded-md">
            <h4 className="font-semibold mb-2">Sleep Goals</h4>
            <p className="text-sm text-muted-foreground mb-4">Target Bedtime, Wake Time, Duration</p>
            {/* TODO: Add Sleep Settings Form */}
         </div>
      </div>
    </div>
  )
}
