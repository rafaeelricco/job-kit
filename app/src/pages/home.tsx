export default HomePage

import { LayoutGrid } from "lucide-react"

import { Dashboard } from "@/module/scout/components/dashboard"
import { StoreGate } from "@/module/scout/components/store-gate"

function HomePage() {
  return (
    <StoreGate title="Home" Icon={LayoutGrid}>
      {(store) => <Dashboard dossiers={store.dossiers} />}
    </StoreGate>
  )
}
