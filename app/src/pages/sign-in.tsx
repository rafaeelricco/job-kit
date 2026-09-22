export default SignInPage

import { useEffect, useRef, useState, type FormEvent } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { type Cancel } from "@lib/future"
import { Failed, Loading, NotAsked, type RemoteData } from "@lib/remote-data"
import { fetchErrorToString, type FetchError } from "@lib/request"
import { sessionGate, signIn, signUp } from "@module/session/session"
import { useSession } from "@module/session/helpers/use-session"
import { returnTo } from "@module/session/helpers/return-to"
import { SessionPending } from "@module/session/components/protected-route"
import { Alert, AlertDescription, AlertTitle } from "@ui/alert"
import { Button } from "@ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@ui/field"
import { Input } from "@ui/input"

type Mode = "sign-in" | "sign-up"

function SignInPage() {
  const session = useSession()
  const location = useLocation()
  const [mode, setMode] = useState<Mode>("sign-in")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submit, setSubmit] = useState<RemoteData<FetchError, never>>(NotAsked())
  // A no-op start, not null: cancelling a settled fork is harmless, so there's no absence to model.
  const cancel = useRef<Cancel>(() => {})
  useEffect(() => () => cancel.current(), [])

  const gate = sessionGate(session)
  switch (gate) {
    case "pending":
      return <SessionPending />
    case "signed-in":
      // Sign-in success lands here too: setSession broadcasts, SessionRoot re-renders, this redirects.
      return <Navigate to={returnTo(location.state)} replace />
    case "anonymous":
      break
    default: {
      const _exhaustiveCheck: never = gate
      throw new Error(`Unknown: ${JSON.stringify(_exhaustiveCheck)}`)
    }
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    cancel.current()
    setSubmit(Loading())
    cancel.current = (mode === "sign-in" ? signIn : signUp)(email, password).fork(
      (error) => setSubmit(Failed(error)),
      () => {}
    )
  }
  const switchMode = (): void => {
    // Drop the other mode's request, or its failure would land under this mode's form.
    cancel.current()
    setMode(mode === "sign-in" ? "sign-up" : "sign-in")
    setSubmit(NotAsked())
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{mode === "sign-in" ? "Sign in to Job Kit" : "Create your Job Kit account"}</CardTitle>
          <CardDescription>
            {mode === "sign-in" ? "Use the email and password you registered with." : "You'll be signed in right after."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* The boot whoAmI failed: signing in will fail the same way, so say why up front. */}
          {session.next instanceof Failed && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Session check failed</AlertTitle>
              <AlertDescription>{fetchErrorToString(session.next.error)}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={onSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field data-invalid={submit instanceof Failed}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                  minLength={mode === "sign-up" ? 12 : undefined}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {mode === "sign-up" && <FieldDescription>At least 12 characters.</FieldDescription>}
                {submit instanceof Failed && <FieldError>{fetchErrorToString(submit.error)}</FieldError>}
              </Field>
              <Button type="submit" disabled={submit instanceof Loading}>
                {mode === "sign-in" ? "Sign in" : "Create account"}
              </Button>
              <Button type="button" variant="link" onClick={switchMode}>
                {mode === "sign-in" ? "Need an account? Create one" : "Have an account? Sign in"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
