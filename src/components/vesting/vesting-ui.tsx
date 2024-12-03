'use client'

import { useVestingProgram, useVestingProgramAccount } from './vesting-data-access'
import { useState, useMemo } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import VestingCard from './vesting-card'
import { useWallet } from '@solana/wallet-adapter-react'
import { formatAddress } from '@/app/lib/utils'
import { ExternalLink } from 'lucide-react'

export function VestingCreate() {
  const [newCompany, setNewCompany] = useState('')
  const [newMintAddress, setNewMintAddress] = useState('');
  const {createVestingAccountMutation} = useVestingProgram();
  
  return (
    <main className="container relative bg-white w-full py-8 pb-8 px-32 mt--32 rounded-3xl flex justify-center">
      {/* // before:absolute before:inset-1 before:-z-10 
      // before:bg-blue-500/25 
      // before:blur-0 
      // before:rounded-[1.5rem] 
      // before:animate-pulse-soft
      // before:shadow-[0_0_40px_10px_rgba(59,130,246,0.6)]"> */}
      <div className="space-y-8 w-full max-w-3xl">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="company" className="text-right text-base text-black">
            Company
          </Label>
          <Input
            id="company"
            value={newCompany}
            onChange={(e) => setNewCompany(e.target.value)}
            className="
              col-span-3 
              rounded-full 
              h-[3.5rem] 
              w-full 
              px-4 
              py-3 
              text-base 
              sm:text-sm 
              md:text-base 
              lg:text-lg 
              xl:text-xl 
              border 
              border-gray-300 
              focus:border-blue-500 
              focus:ring-2 
              focus:ring-blue-200 
              transition-all 
              duration-300
            "
            placeholder="Company Name"
            autoComplete="off"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="mintAddress" className="text-right text-base text-black">
            Token Mint
          </Label>
          <Input
            id="mintAddress"
            value={newMintAddress}
            onChange={(e) => setNewMintAddress(e.target.value)}
            className="
              col-span-3 
              rounded-full 
              h-[3.5rem] 
              w-full 
              px-4 
              py-3 
              text-base 
              sm:text-sm 
              md:text-base 
              lg:text-lg 
              xl:text-xl 
              border 
              border-gray-300 
              focus:border-blue-500 
              focus:ring-2 
              focus:ring-blue-200 
              transition-all 
              duration-300
            "
            placeholder="Mint Address"
            autoComplete="off"
          />
        </div>
        <div className="flex justify-center">
          <Button 
            onClick={() => 
              createVestingAccountMutation.mutateAsync({
                company_name: newCompany,
                mint: newMintAddress
              })}
            disabled={createVestingAccountMutation.isPending}
            className="bg-[#39C3EF] hover:bg-[#39C3EF]/90 text-white"
            style={{
              boxShadow:
                "0px -1px 0px 0px #ffffff40 inset, 0px 1px 0px 0px #ffffff40 inset",
            }}
          >
            Create New Company Vesting Account
          </Button>
        </div>
      </div>
    </main>
  );  
}

export function VestingList() {
  const { getProgramAccount, vestingAccounts } = useVestingProgram();
  const wallet = useWallet()
  const pubKeyString = wallet.publicKey?.toString() || "";
  const user = formatAddress(pubKeyString)

  if (getProgramAccount.isLoading) {
    return (
      <div className="flex justify-center items-center h-24">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!getProgramAccount.data?.value) {
    return (
      <div className="flex justify-center p-2">
        <div className="bg-blue-50 text-black px-4 py-2 rounded-lg max-w-2xl">
          <span>Program account not found. Make sure you have deployed the program and are on the correct cluster.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4">
      <div className="max-w-7xl mx-auto rounded-xl p-4">
      <h2 className='z-40 font-bold text-center pb-8 text-2xl text-white'>
        Company Vestings for{' '}
        <a
          href={`https://solscan.io/address/${pubKeyString}`}
          rel="noopener noreferrer"
          target="_blank"
          className='inline-flex items-center gap-1 text-cyan-400 hover:text-blue-800'
        >
          <span className="font-semibold">{user}</span>
          <ExternalLink size={16}/>
        </a>
      </h2>
        {vestingAccounts.isLoading ? (
          <div className="flex justify-center items-center h-24">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : vestingAccounts.data?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vestingAccounts.data?.map((account) => (
              <div key={account.publicKey.toString()} className="transform transition-all duration-200 hover:scale-[1.02]">
                <VestingCard account={account.publicKey.toBase58()} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <h2 className="text-2xl font-semibold mb-1">No Vesting Accounts</h2>
            <p className="text-gray-600">
              No Vesting Accounts found. Create one above to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}