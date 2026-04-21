import { api } from "@/api"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { authStore, type Credentials } from "@/store/auth/authStore"
import { useMutation } from "@tanstack/react-query"
import { Controller, useForm, type SubmitHandler } from "react-hook-form"
import { useRouter } from "@tanstack/react-router"

export type LoginError = {
  status: number
}

export type LoginSuccess = {
  access_token: string
  token_type: string
}

export default function Login() {
  const login = authStore((s) => s.login)
  const router = useRouter()
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Credentials>({
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const { mutateAsync, isPending } = useMutation<
    LoginSuccess,
    LoginError,
    Credentials
  >({
    mutationFn: async (credentials) => {
      const { data } = await api.post("/authentication/login", credentials)
      return data
    },
    onSuccess: (data) => {
      login(data.access_token)
      router.navigate({ to: "/" })
      return data
    },
    onError: (e) => {
      if (e.status == 401) {
        setError("root", { message: "Invalid Credentials" })
      }
      return e
    },
  })

  const onsubmit: SubmitHandler<Credentials> = async (credentials) => {
    await mutateAsync(credentials)
  }

  return (
    <form
      className="grid w-105 gap-5 rounded-[12px] border p-10 shadow-lg"
      onSubmit={handleSubmit(onsubmit)}
    >
      <div className="text-center">
        <p className="mx-auto mb-3 w-[50%] text-xl font-bold text-[#5A2E15]">
          Biometrics Data Consolidator
        </p>
        <p className="text-[#8A96A3]">Sign in to LOCAL Portal</p>
      </div>
      <div className="grid gap-6">
        <Controller
          name="email"
          control={control}
          render={({ field }) => {
            return (
              <Field>
                <FieldLabel htmlFor="name">Email or Username</FieldLabel>
                <Input
                  id="name"
                  autoComplete="off"
                  placeholder="User001"
                  {...field}
                />
              </Field>
            )
          }}
        />

        <Controller
          name="password"
          control={control}
          render={({ field }) => {
            return (
              <Field>
                <FieldLabel htmlFor="name">Password</FieldLabel>
                <Input
                  id="name"
                  autoComplete="off"
                  placeholder="••••••••••••••"
                  type="password"
                  {...field}
                />
              </Field>
            )
          }}
        />

        {errors.root && <p className="text-red-500">{errors.root.message}</p>}

        <Button
          size={"lg"}
          className="rounded-xl text-[16px] font-semibold"
          disabled={isPending}
        >
          Login
        </Button>
      </div>
      <div>
        <Separator className="mb-5" />
        <p className="text-center text-sm text-[#8A96A3]">
          Powered by Mayan Solutions Inc.
        </p>
      </div>
    </form>
  )
}
