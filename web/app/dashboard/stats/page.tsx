export default function StatsPage() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
         <div className="text-sm font-medium">Total Sleep</div>
         <div className="text-2xl font-bold">-- hr</div>
      </div>
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
         <div className="text-sm font-medium">Avg. Duration</div>
         <div className="text-2xl font-bold">-- hr</div>
      </div>
    </div>
  )
}
