'use client'

import { useState } from 'react'
import { 
  WagmiProvider, 
  useAccount, 
  useWriteContract, 
  useReadContract,
  useConnect,
  useDisconnect
} from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './wagmi'
import { governorABI, tokenABI } from './abis'
import {encodeFunctionData, parseEther} from 'viem'

const queryClient = new QueryClient()

export default function Home() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <GovernanceUI />
      </QueryClientProvider>
    </WagmiProvider>
  )
}

function GovernanceUI() {
  const account = useAccount()
  const { disconnectAsync } = useDisconnect()
  const { connectors, connect } = useConnect()

  const GOVERNOR_ADDRESS = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0' as `0x${string}`
  const TOKEN_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3' as `0x${string}`
  const TIMELOCK_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' as `0x${string}`


   // State for proposal creation
   const [proposalTargets, setProposalTargets] = useState<string[]>([])
   const [proposalValues, setProposalValues] = useState<bigint[]>([])
   const [proposalCalldatas, setProposalCalldatas] = useState<string[]>([])
   const [proposalDescription, setProposalDescription] = useState('')
 
  // Contract interaction hooks
  const { 
    writeContract: proposeAction, 
    isPending: isProposing,
    error: proposeError 
  } = useWriteContract()

  const { 
    writeContract: castVote, 
    isPending: isVoting,
    error: voteError 
  } = useWriteContract()


  // Handle wallet disconnection
  const handleDisconnect = async () => {
    try {
      await disconnectAsync()
    } catch (error) {
      console.error('Disconnection failed', error)
    }
  }

   // Create sample proposal
   const handleCreateSampleProposal = () => {
    try {
      const targets = [TOKEN_ADDRESS]
      const values = [0n]
      const calldatas = [
        encodeFunctionData({abi: tokenABI, functionName: 'transfer', args: [
          '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          parseEther('10')
        ]})
      ]
      const description = 'Transfer 10 Tokens'

      proposeAction({
        address: GOVERNOR_ADDRESS,
        abi: governorABI,
        functionName: 'propose',
        args: [
          targets,
          values,
          calldatas,
          description
        ]
      })
    } catch (error) {
      console.error('Proposal creation failed', error)
    }
  }

  const handleVote = (proposalId: bigint, support: number) => {
    try {
      castVote({
        address: GOVERNOR_ADDRESS,
        abi: governorABI,
        functionName: 'castVote',
        args: [proposalId, support]
      })
    } catch (error) {
      console.error('Voting failed', error)
    }
  }

   const handleQueueProposal = (proposalId: `0x${string}`) => {
    try {
      proposeAction({
        address: GOVERNOR_ADDRESS,
        abi: governorABI,
        functionName: 'queue',
        args: [proposalId] //getting type error here, need to investigate
      })
    } catch (error) {
      console.error('Queueing proposal failed', error)
    }
  }

   const handleExecuteProposal = (proposalId: bigint) => {
    try {
      proposeAction({
        address: GOVERNOR_ADDRESS,
        abi: governorABI,
        functionName: 'execute',
        args: [proposalId] //getting type error here, need to investigate
      })
    } catch (error) {
      console.error('Executing proposal failed', error)
    }
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl mb-4 font-bold">Governance Dashboard</h1>
      
      {account.isConnected ? (
        <>
          <div className="mb-4 flex justify-between items-center">
            <p className="text-lg">
              Connected: {account.address?.slice(0, 6)}...{account.address?.slice(-4)}
            </p>
            <button 
              onClick={handleDisconnect}
              className="bg-red-500 text-white p-2 rounded"
              type="button"
            >
              Disconnect
            </button>
          </div>

          <div className="mb-4">
            <button 
              onClick={handleCreateSampleProposal}
              disabled={isProposing}
              className="bg-blue-500 text-white p-2 rounded w-full"
              type="button"
            >
              {isProposing ? 'Creating Proposal...' : 'Create Proposal'}
            </button>
            {proposeError && (
              <p className="text-red-500 mt-2">
                Proposal Error: {proposeError.message}
              </p>
            )}
          </div>

          <div className="mb-4">
            <h2 className="text-xl mb-2">Vote on Proposals</h2>
            <div className="flex space-x-2">
              <button 
                onClick={() => handleVote(1n, 1)}
                className="bg-green-500 text-white p-2 rounded flex-1"
                type="button"
              >
                Vote For
              </button>
              <button 
                onClick={() => handleVote(1n, 0)}
                className="bg-red-500 text-white p-2 rounded flex-1"
                type="button"
              >
                Vote Against
              </button>
            </div>
            {voteError && (
              <p className="text-red-500 mt-2">
                Voting Error: {voteError.message}
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="text-center">
          {connectors.map((connector) => (
            <button
              disabled={!connector.isAuthorized}
              key={connector.id}
              onClick={() => connect({ connector })}
              className="bg-blue-500 text-white p-2 rounded w-full mb-2"
              type="button"
            >
              {connector.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}