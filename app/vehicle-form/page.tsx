"use client"

export default function VehicleForm(){

 return(

<div className="p-10">

<h1 className="text-3xl font-bold">
Vehicle Information
</h1>

<form className="flex flex-col gap-4 mt-6 max-w-md">

<input
className="border p-3"
placeholder="License Plate"
/>

<input
className="border p-3"
placeholder="VIN"
/>

<input
className="border p-3"
placeholder="Vehicle Description"
/>

<textarea
className="border p-3"
placeholder="What's wrong with vehicle?"
/>

<button className="bg-red-500 text-white p-3 rounded">
Submit Ticket
</button>

</form>

</div>

)
}