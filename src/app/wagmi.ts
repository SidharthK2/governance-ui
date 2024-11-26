import { http, createConfig } from 'wagmi'
import { anvil } from 'wagmi/chains'
import { 
  injected, 
  metaMask, 
  walletConnect 
} from 'wagmi/connectors'

export const config = createConfig({
  chains: [anvil],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [anvil.id]: http('http://127.0.0.1:8545')
  }
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}