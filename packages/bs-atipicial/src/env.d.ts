declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TEST_PRIVATE_KEY: string
      TEST_BRIDGE_PRIVATE_KEY: string
      TEST_BRIDGE_ATCX_ADDRESS: string
    }
  }
}

export {}
