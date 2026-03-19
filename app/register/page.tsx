import { RegisterForm } from "@/components/auth/register-form"

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Registrati</h1>
          <p className="mt-2 text-sm text-gray-600">Crea un nuovo account</p>
        </div>
        <div className="mt-8">
          <RegisterForm />
        </div>
      </div>
    </div>
  )
}

