export type TGhostMarketNDSAtipicialAssetApiResponse = {
  tokenId: string
  contract: {
    chain?: string
    hash: string
    symbol: string
  }
  creator: {
    address: string
    offchainName?: string
  }
  apiUrl?: string
  ownerships: {
    owner: {
      address?: string
    }
  }[]
  collection: {
    name?: string
    logoUrl?: string
  }
  metadata: {
    description: string
    mediaType: string
    mediaUri: string
    mintDate: number
    mintNumber: number
    name: string
  }
}

export type TGhostMarketNDSAtipicialGetAssetsApiResponse = {
  assets: TGhostMarketNDSAtipicialAssetApiResponse[]
  next: string
}

export type TFlamingoForthewinEDSFlamingoPricesApiResponse = {
  symbol: string
  usd_price: number
  hash: string
}[]

export type TFlamingoForthewinEDSForthewinPricesApiResponse = {
  [key: string]: number
}

export type TCryptoCompareEDSDataResponse = {
  RAW: {
    [symbol: string]: {
      [currency: string]: {
        PRICE: number
      }
    }
  }
}

export type TCryptoCompareEDSHistoryResponse = {
  Data: {
    time: number
    close: number
  }[]
}

export type THexString = `0x${string}`

export type TBSUtilsHelperRetryOptions = {
  retries?: number
  delay?: number
  shouldRetry?: (error: any) => boolean
}
