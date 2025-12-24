import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getProfile, updateProfile } from "@/lib/actions/user"

export default async function ProfilePage() {
  const profile = await getProfile()

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="border rounded-md p-6">
         <form action={async (formData) => {
             "use server"
             await updateProfile(formData)
         }} className="space-y-4">
             <h4 className="font-semibold">User Profile</h4>
            
            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                    id="email" 
                    value={profile?.email || ''} 
                    disabled 
                    className="bg-muted"
                />
                <p className="text-[0.8rem] text-muted-foreground">
                    Email cannot be changed securely from this dashboard yet.
                </p>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input 
                    id="full_name" 
                    name="full_name" 
                    defaultValue={profile?.full_name || ''} 
                    placeholder="Enter your name"
                />
            </div>

            <div className="pt-2">
                <Button type="submit">Update Profile</Button>
            </div>
         </form>
      </div>
    </div>
  )
}
