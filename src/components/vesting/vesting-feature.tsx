'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useState } from 'react'
import { WalletButton } from '../solana/solana-provider'
import { AppHero, ellipsify } from '../ui/ui-layout'
import { Button } from '../ui/button'
import { ExplorerLink } from '../cluster/cluster-ui'
import { useVestingProgram } from './vesting-data-access'
import { VestingCreate, VestingList } from './vesting-ui'
import { AllocationList } from './employee-allocations-list'

export default function VestingFeature() {
  const { publicKey } = useWallet()
  const { programId } = useVestingProgram()
  const [activeTab, setActiveTab] = useState('vesting')

  return publicKey ? (
    <div className="flex flex-col w-full"> {/* Added w-full here */}
      <AppHero
        title="Token Vesting"
        subtitle={'Reward Employees using Vested Tokens'}
      >
        <p className="mb-2">
          <ExplorerLink path={`account/${programId}`} label={ellipsify(programId.toString())} />
        </p>
        <VestingCreate />
      </AppHero>

      <div className="w-full px-4 md:px-6 lg:px-8"> {/* Full width container with responsive padding */}
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-4">
          <TabButton 
            active={activeTab === 'vesting'} 
            onClick={() => setActiveTab('vesting')}
          >
            Vesting Accounts
          </TabButton>
          <TabButton 
            active={activeTab === 'allocation'} 
            onClick={() => setActiveTab('allocation')}
          >
            Allocations
          </TabButton>
        </div>

        {/* Tab Content */}
        <div className="w-full bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          {activeTab === 'vesting' ? (
            <VestingList />
          ) : (
            <AllocationList />
          )}
        </div>
      </div>
    </div>
  ) : (
    <div className="max-w-4xl mx-auto">
      <div className="hero py-8">
        <div className="hero-content text-center">
          <WalletButton />
        </div>
      </div>
    </div>
  )
}

const TabButton = ({ active, onClick, children }: TabButtonProps) => (
  <Button
    onClick={onClick}
    className={`px-4 py-2 font-semibold rounded-t-lg ${
      active 
        ? 'bg-white text-blue-600 border-t border-x border-gray-200' 
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`}
  >
    {children}
  </Button>
)

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}