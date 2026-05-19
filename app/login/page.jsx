export default function LoginPage() {
  return (
    <div className="p-10">

      <h1 className="text-3xl font-bold">
        Login
      </h1>

      <form className="mt-6 flex flex-col gap-4 max-w-md">

        <input
          className="border p-3"
          placeholder="Email"
        />

        <input
          className="border p-3"
          type="password"
          placeholder="Password"
        />

        <button className="bg-black text-white p-3 rounded">
          Login
        </button>

      </form>
    </div>
  )
}