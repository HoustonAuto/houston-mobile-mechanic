export default function SignupPage() {
  return (
    <div className="p-10">

      <h1 className="text-3xl font-bold">
        Create Account
      </h1>

      <form className="mt-6 flex flex-col gap-4 max-w-md">

        <input
          className="border p-3"
          placeholder="Full Name"
        />

        <input
          className="border p-3"
          placeholder="Email"
        />

        <input
          className="border p-3"
          placeholder="Phone"
        />

        <input
          className="border p-3"
          type="password"
          placeholder="Password"
        />

        <button className="bg-red-500 text-white p-3 rounded">
          Create Account
        </button>

      </form>
    </div>
  )
}