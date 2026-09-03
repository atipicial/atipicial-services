import type { TBridgeToken, TBSBridgeName } from '@atipicial/blockchain-service'
import { BSAtipicial } from '@atipicial/bs-atipicial'
import { BSAtipicialX } from '@atipicial/bs-atipicialx'

export type TAtipicialXBridgeOrchestratorInitParams = {
  atipicialService: BSAtipicial
  atipicialXService: BSAtipicialX
  initialFromServiceName?: TBSBridgeName
}

export type TAtipicialXBridgeOrchestratorWaitParams = {
  atipicialService: BSAtipicial
  atipicialXService: BSAtipicialX
  transactionHash: string
  tokenToUse: TBridgeToken<TBSBridgeName>
  tokenToReceive: TBridgeToken<TBSBridgeName>
}
