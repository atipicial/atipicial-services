import {
  BSError,
  type IWalletConnectService,
  type TBSAccount,
  type TWalletConnectServiceHandlers,
  type TWalletConnectServiceMethodHandler,
  type TWalletConnectServiceRequestMethodParams,
} from '@atipicial/blockchain-service'
import type { IBSAtipicial, TBSAtipicialName, TWalletConnectServiceAtipicialMethod } from '../../types'
import { BSAtipicialAtipicialDappKitSingletonHelper } from '../../helpers/BSAtipicialAtipicialDappKitSingletonHelper'
import { BSAtipicialAtipicialJsSingletonHelper } from '../../helpers/BSAtipicialAtipicialJsSingletonHelper'
import { z } from 'zod'

const contractInvocationParamsSchema = z.object({
  invocations: z.array(
    z.object({
      scriptHash: z.string(),
      operation: z.string(),
      args: z.array(
        z.discriminatedUnion('type', [
          z.object({ type: z.literal('Any'), value: z.any() }),
          z.object({ type: z.literal('String'), value: z.string() }),
          z.object({ type: z.literal('Boolean'), value: z.boolean() }),
          z.object({ type: z.literal('PublicKey'), value: z.string() }),
          z.object({ type: z.literal('Hash160'), value: z.string() }),
          z.object({ type: z.literal('Hash256'), value: z.string() }),
          z.object({ type: z.literal('Integer'), value: z.string() }),
          z.object({ type: z.literal('ByteArray'), value: z.string() }),
          z.object({ type: z.literal('Array'), value: z.array(z.any()) }),
          z.object({ type: z.literal('Map'), value: z.array(z.any()) }),
        ])
      ),
      abortOnFail: z.boolean().optional(),
    })
  ),
  signers: z.array(
    z.object({
      scopes: z.union([z.string(), z.number()]),
      account: z.string().optional(),
      allowedContracts: z.array(z.string()).optional(),
      allowedGroups: z.array(z.string()).optional(),
      rules: z.array(z.object({ action: z.string(), condition: z.any() })).optional(),
    })
  ),
  extraSystemFee: z.number().optional(),
  systemFeeOverride: z.number().optional(),
  extraNetworkFee: z.number().optional(),
  networkFeeOverride: z.number().optional(),
})

const signMessageParamsSchema = z.object({
  message: z.string(),
  version: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
})

const verifyMessageBaseParamsSchema = z.object({
  publicKey: z.string(),
  data: z.string(),
  salt: z.string().optional(),
})

const verifyMessageSchema = z.union([
  verifyMessageBaseParamsSchema.extend({
    messageHex: z.string(),
    message: z.string().optional(),
  }),
  verifyMessageBaseParamsSchema.extend({
    message: z.string(),
    messageHex: z.string().optional(),
  }),
])

const encryptParamsSchema = z.tuple([z.string(), z.array(z.string()).optional()])

const encryptedMessageSchema = z.object({
  randomVector: z.string(),
  cipherText: z.string(),
  dataTag: z.string(),
  ephemPublicKey: z.string(),
})

const decryptParamsSchema = z.tuple([encryptedMessageSchema])

const decryptFromArrayParamsSchema = z.tuple([z.array(encryptedMessageSchema)])

const traverseIteratorParamsSchema = z.tuple([z.string(), z.string(), z.number()])

export class WalletConnectServiceAtipicial implements IWalletConnectService<TBSAtipicialName, TWalletConnectServiceAtipicialMethod> {
  readonly namespace: string = 'atipicial'
  readonly chain: string

  // prettier-ignore
  readonly supportedMethods: TWalletConnectServiceAtipicialMethod[] = [
    'invokeFunction', 'testInvoke', 'signMessage', 'verifyMessage',
    'getWalletInfo', 'traverseIterator', 'getNetworkVersion', 'encrypt',
    'decrypt', 'decryptFromArray', 'calculateFee', 'signTransaction',
  ]

  readonly supportedEvents: string[] = []
  readonly calculableMethods: TWalletConnectServiceAtipicialMethod[] = ['invokeFunction', 'signTransaction']
  readonly autoApproveMethods: TWalletConnectServiceAtipicialMethod[] = [
    'testInvoke',
    'getWalletInfo',
    'traverseIterator',
    'getNetworkVersion',
    'calculateFee',
  ]

  readonly #service: IBSAtipicial

  handlers: TWalletConnectServiceHandlers<
    TBSAtipicialName,
    {
      invokeFunction: z.infer<typeof contractInvocationParamsSchema>
      testInvoke: z.infer<typeof contractInvocationParamsSchema>
      signTransaction: z.infer<typeof contractInvocationParamsSchema>
      calculateFee: z.infer<typeof contractInvocationParamsSchema>
      signMessage: z.infer<typeof signMessageParamsSchema>
      verifyMessage: z.infer<typeof verifyMessageSchema>
      encrypt: z.infer<typeof encryptParamsSchema>
      decrypt: z.infer<typeof decryptParamsSchema>
      decryptFromArray: z.infer<typeof decryptFromArrayParamsSchema>
      getNetworkVersion: any
      traverseIterator: z.infer<typeof traverseIteratorParamsSchema>
      getWalletInfo: any
    }
  >

  constructor(service: IBSAtipicial) {
    this.#service = service

    const networkId = service.network.type === 'custom' ? 'private' : this.#service.network.id.toString()

    this.chain = `${this.namespace}:${networkId}`

    this.handlers = {
      invokeFunction: this.#invokeFunctionHandler,
      testInvoke: this.#testInvokeHandler,
      signTransaction: this.#signTransactionHandler,
      calculateFee: this.#calculateFeeHandler,
      signMessage: this.#signMessageHandler,
      verifyMessage: this.#verifyMessageHandler,
      encrypt: this.#encryptHandler,
      decrypt: this.#decryptHandler,
      decryptFromArray: this.#decryptFromArrayHandler,
      getNetworkVersion: this.#getNetworkVersionHandler,
      traverseIterator: this.#traverseIteratorHandler,
      getWalletInfo: this.#getWalletInfoHandler,
    }
  }

  #invokeFunctionHandler: TWalletConnectServiceMethodHandler<
    TBSAtipicialName,
    z.infer<typeof contractInvocationParamsSchema>
  > = {
    validate: async params => await contractInvocationParamsSchema.parseAsync(params),
    process: async args => {
      const invoker = await this.#getInvoker(args.account)
      return await invoker.invokeFunction(args.params)
    },
  }

  #testInvokeHandler: TWalletConnectServiceMethodHandler<TBSAtipicialName, z.infer<typeof contractInvocationParamsSchema>> =
    {
      validate: async params => await contractInvocationParamsSchema.parseAsync(params),
      process: async args => {
        const invoker = await this.#getInvoker(args.account)
        return await invoker.testInvoke(args.params)
      },
    }

  #signTransactionHandler: TWalletConnectServiceMethodHandler<
    TBSAtipicialName,
    z.infer<typeof contractInvocationParamsSchema>
  > = {
    validate: async params => await contractInvocationParamsSchema.parseAsync(params),
    process: async args => {
      const invoker = await this.#getInvoker(args.account)
      return await invoker.signTransaction(args.params)
    },
  }

  #calculateFeeHandler: TWalletConnectServiceMethodHandler<
    TBSAtipicialName,
    z.infer<typeof contractInvocationParamsSchema>
  > = {
    validate: async params => await contractInvocationParamsSchema.parseAsync(params),
    process: async args => {
      const invoker = await this.#getInvoker(args.account)
      return await invoker.calculateFee(args.params)
    },
  }

  #signMessageHandler: TWalletConnectServiceMethodHandler<TBSAtipicialName, z.infer<typeof signMessageParamsSchema>> = {
    validate: async params => await signMessageParamsSchema.parseAsync(params),
    process: async args => {
      const signer = await this.#getSigner(args.account)
      return await signer.signMessage(args.params)
    },
  }

  #verifyMessageHandler: TWalletConnectServiceMethodHandler<TBSAtipicialName, z.infer<typeof verifyMessageSchema>> = {
    validate: async params => await verifyMessageSchema.parseAsync(params),
    process: async args => {
      const signer = await this.#getSigner(args.account)
      return await signer.verifyMessage(args.params)
    },
  }

  #encryptHandler: TWalletConnectServiceMethodHandler<TBSAtipicialName, z.infer<typeof encryptParamsSchema>> = {
    validate: async params => await encryptParamsSchema.parseAsync(params),
    process: async args => {
      const signer = await this.#getSigner(args.account)

      let publicKeys = args.params[1]
      if (!publicKeys || publicKeys.length === 0) {
        publicKeys = [signer.account!.getPublicKey()]
      }

      return await signer.encrypt(args.params[0], publicKeys)
    },
  }

  #decryptHandler: TWalletConnectServiceMethodHandler<TBSAtipicialName, z.infer<typeof decryptParamsSchema>> = {
    validate: async params => await decryptParamsSchema.parseAsync(params),
    process: async args => {
      const signer = await this.#getSigner(args.account)
      return await signer.decrypt(args.params[0])
    },
  }

  #decryptFromArrayHandler: TWalletConnectServiceMethodHandler<
    TBSAtipicialName,
    z.infer<typeof decryptFromArrayParamsSchema>
  > = {
    validate: async params => await decryptFromArrayParamsSchema.parseAsync(params),
    process: async args => {
      const signer = await this.#getSigner(args.account)
      return await signer.decryptFromArray(args.params[0])
    },
  }

  #getNetworkVersionHandler: TWalletConnectServiceMethodHandler<TBSAtipicialName> = {
    validate: async () => {},
    process: async () => {
      const { rpc } = BSAtipicialAtipicialJsSingletonHelper.getInstance()
      const rpcClient = new rpc.RPCClient(this.#service.network.url)
      const response = await rpcClient.getVersion()
      return {
        rpcAddress: this.#service.network.url,
        ...response,
      }
    },
  }

  #traverseIteratorHandler: TWalletConnectServiceMethodHandler<
    TBSAtipicialName,
    z.infer<typeof traverseIteratorParamsSchema>
  > = {
    validate: async params => await traverseIteratorParamsSchema.parseAsync(params),
    process: async args => {
      const invoker = await this.#getInvoker(args.account)
      return await invoker.traverseIterator(args.params[0], args.params[1], args.params[2])
    },
  }

  #getWalletInfoHandler: TWalletConnectServiceMethodHandler<TBSAtipicialName> = {
    validate: async () => {},
    process: async args => {
      return {
        isLedger: args.account.isHardware || false,
      }
    },
  }

  async #getInvoker(account: TBSAccount<TBSAtipicialName>) {
    const { atipicialJsAccount, signingCallback } = await this.#service._generateSigningCallback(account)

    const { AtipicialInvoker } = BSAtipicialAtipicialDappKitSingletonHelper.getInstance()

    const invoker = await AtipicialInvoker.init({
      rpcAddress: this.#service.network.url,
      account: atipicialJsAccount,
      signingCallback,
    })

    return invoker
  }

  async #getSigner(account: TBSAccount<TBSAtipicialName>) {
    const { atipicialJsAccount } = await this.#service._generateSigningCallback(account)

    const { AtipicialSigner } = BSAtipicialAtipicialDappKitSingletonHelper.getInstance()

    const signer = new AtipicialSigner(atipicialJsAccount)

    return signer
  }

  async calculateRequestFee(args: TWalletConnectServiceRequestMethodParams<TBSAtipicialName>): Promise<string> {
    const params = await this.#calculateFeeHandler.validate(args.params).catch(error => {
      throw new BSError('Params validation failed: ' + error.message, 'INVALID_PARAMS')
    })

    const { total } = await this.#calculateFeeHandler.process({ ...args, params })
    return total.toString()
  }
}
