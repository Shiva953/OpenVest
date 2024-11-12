'use client'

import { Keypair, PublicKey } from '@solana/web3.js'
import { ellipsify, useTransactionToast } from '../ui/ui-layout'
import { ExplorerLink } from '../cluster/cluster-ui'
import { useVestingProgram, useVestingProgramAccount } from './vesting-data-access'
import { useState, useEffect, useMemo } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import VestingCard from './vesting-card'

export function VestingCreate() {
  const [newCompany, setNewCompany] = useState('') || 'neutron'
  const [newMintAddress, setNewMintAddress] = useState('') || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
  const {createVestingAccountMutation} = useVestingProgram();

  const {data, isError} = createVestingAccountMutation;
  
  return (
    <main className="container py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold">Token Vesting</h1>
          <p className="text-muted-foreground">
            Create a new vesting account.
          </p>
        </div>

        <div className="mb-8 flex justify-center">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
              >
                Create New Vesting Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Vesting Account</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="company" className="text-right">
                    Company Name
                  </Label>
                  <Input
                    id="company"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="mintAddress" className="text-right">
                    Token Mint Address
                  </Label>
                  <Input
                    id="mintAddress"
                    value={newMintAddress}
                    onChange={(e) => setNewMintAddress(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </div>
              <Button onClick={() => 
                createVestingAccountMutation.mutateAsync({
                  company_name: newCompany,
                  mint: newMintAddress
                })
              }
              disabled={createVestingAccountMutation.isPending}
              >
                Create New Vesting Account</Button>
            </DialogContent>
          </Dialog>
        </div>
        </main>
  )
}

export function VestingList() {
  const { program, getProgramAccount, vestingAccounts } = useVestingProgram()

  if (getProgramAccount.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }
  if (!getProgramAccount.data?.value) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>Program account not found. Make sure you have deployed the program and are on the correct cluster.</span>
      </div>
    )
  }
  return (
    <div className={'space-y-6'}>
      {vestingAccounts.isLoading ? (
        <span className="loading loading-spinner loading-lg"></span>
      ) : vestingAccounts.data?.length ? (
        <div className="grid md:grid-cols-2 gap-4">
          {vestingAccounts.data?.map((account) => (
            <VestingCard key={account.publicKey.toString()} account={account.publicKey.toBase58()} />
          ))}
        </div>
      ) : (
        <div className="text-center">
          <h2 className={'text-2xl'}>No Vesting Accounts</h2>
          No Vesting Accounts found. Create one above to get started.
        </div>
      )}
    </div>
  )
}