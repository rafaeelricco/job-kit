export { PermissionEmpty }

import { Button } from "@/components/ui/button"

type PermissionEmptyProps = {
  readonly onAllow: () => void
  readonly onReview: () => void
}

function PermissionEmpty({ onAllow, onReview }: PermissionEmptyProps) {
  return (
    <div className="grid min-h-svh place-items-center bg-background px-6 py-12">
      <div className="flex w-full max-w-100 flex-col items-center text-center">
        <img
          src="/permission-not-granted.png"
          alt=""
          className="size-56 object-contain"
        />
        <h1 className="pt-3 text-xl font-semibold">Permission not granted</h1>
        <p className="pt-1 text-sm text-balance text-muted-foreground">
          Your dossiers are on this machine, but this page has no permission to
          read them yet.
        </p>
        <div className="flex w-full flex-col gap-2 pt-6 sm:flex-row">
          <Button
            size="lg"
            onClick={onAllow}
            className="h-11 flex-1 rounded-full"
          >
            Allow access
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={onReview}
            className="h-11 flex-1 rounded-full"
          >
            Review permissions
          </Button>
        </div>
      </div>
    </div>
  )
}
