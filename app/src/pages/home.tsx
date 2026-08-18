export default HomePage

import { LayoutGrid } from "lucide-react"

import { Dashboard } from "@/module/scout/components/dashboard"
import { Gaps } from "@/module/scout/components/gaps"
import { StoreGate } from "@/module/scout/components/store-gate"

function HomePage() {
  return (
    <StoreGate title="Home" Icon={LayoutGrid}>
      {(store) => (
        <>
          <Gaps gaps={store.gaps} root={store.root} />
          <Dashboard dossiers={store.dossiers} />
        </>
      )}
    </StoreGate>
  )
}
