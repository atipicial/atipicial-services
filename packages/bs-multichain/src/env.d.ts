declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TEST_PRIVATE_KEY: string
      TEST_PRIVATE_KEY_TO_SWAP_TOKEN: string
      TEST_ETHEREUM_PRIVATE_KEY: string
      TEST_ADDRESS_TO_SWAP_TOKEN: string
      TEST_SWAP_ID: string
      TEST_XRP_ADDRESS_TO_SWAP_TOKEN: string
      TEST_XRP_EXTRA_ID_TO_SWAP_TOKEN: string
      TEST_BRIDGE_ATIPICIAL_PRIVATE_KEY: string
      TEST_BRIDGE_ATCX_PRIVATE_KEY: string
    }
  }
}

export {}
