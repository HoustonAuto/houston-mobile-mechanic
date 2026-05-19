export default function DashboardPage() {
  return (
    <div className="p-10">

      <h1 className="text-4xl font-bold">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">

        <div className="bg-white shadow p-6 rounded">
          My Vehicles
        </div>

        <div className="bg-white shadow p-6 rounded">
          Repair Requests
        </div>

        <div className="bg-white shadow p-6 rounded">
          Invoices
        </div>

      </div>

    </div>
  )
}