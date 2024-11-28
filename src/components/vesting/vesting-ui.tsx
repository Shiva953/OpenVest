'use client'

import { useVestingProgram, useVestingProgramAccount } from './vesting-data-access'
import { useState, useMemo } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import VestingCard from './vesting-card'
import { PublicKey } from '@solana/web3.js'
import { format } from "date-fns"
import {BN} from "@coral-xyz/anchor"

export function VestingCreate() {
  const [newCompany, setNewCompany] = useState('')
  const [newMintAddress, setNewMintAddress] = useState('');
  const {createVestingAccountMutation} = useVestingProgram();

  const {data, isError} = createVestingAccountMutation;
  
  return (
    <main className="container py-4">
        <div className="mb-2 flex justify-center">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                className="bg-black"
              >
                Create New Vesting Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Vesting Account</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-1">
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
  const { program, getProgramAccount, vestingAccounts } = useVestingProgram();

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
    <div className="px-4 -mt-4">
      <div className="max-w-7xl mx-auto rounded-xl shadow-sm p-4">
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