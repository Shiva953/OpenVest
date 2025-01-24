'use client'

import { useVestingProgram } from './vesting-data-access'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import VestingCard from './vesting-card'
import { useWallet } from '@solana/wallet-adapter-react'
import { useTokenList } from '@/hooks/useTokenList'
import { formatAddress } from '@/app/lib/utils'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ExternalLink, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export type Token = {
  address: string,
  decimals: number,
  symbol: string,
  logoURI: string
}

export function VestingCreate() {
  const [newCompany, setNewCompany] = useState('')
  const [newMintAddress, setNewMintAddress] = useState('');
  const [treasuryAmount, setTreasuryAmount] = useState('');
  const { tokenList, isLoading, error } = useTokenList()
  const [selectedToken, setSelectedToken] = useState<Token>({
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,
    symbol: "USDC",
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png"
  });
  const { createVestingAccountMutation } = useVestingProgram();

  if (error) {
    return (
      <div className="flex justify-center p-4">
        <div className="bg-red-900 text-white px-6 py-4 rounded-lg max-w-2xl text-center">
          <span className="font-semibold">Failed to load tokens.</span>
          <p className="mt-2">Please try again later.</p>
        </div>
      </div>
    )
  }
  
  return (
    <motion.main 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container relative w-full mt-16 pb-8 px-4 md:px-8 lg:px-16 rounded-3xl flex justify-center"
    >
      <div className="space-y-8 w-full max-w-3xl bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl shadow-2xl">
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
            <Label htmlFor="company" className="text-right text-base text-gray-300 md:col-span-1">
              Company
            </Label>
            <Input
              id="company"
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
              className="md:col-span-3 rounded-full h-14 w-full px-4 py-3 text-base bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all duration-300"
              placeholder="Company Name"
              autoComplete="off"
            />
          </div>

      <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
          <Label htmlFor="token" className="text-right text-base text-gray-300 md:col-span-1">
            Token
          </Label>
          <Input
              id="mint"
              type="text"
              onChange={(e) => setNewMintAddress(e.target.value)}
              className="md:col-span-3 rounded-full h-14 w-full px-4 py-3 text-base bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all duration-300"
              placeholder={`Token Mint Address`}
              autoComplete="off"
            />
            {/* <Select
              defaultValue="USDC"
              value={selectedToken.address}
              onValueChange={(val) => {
                const requiredToken = tokenList.find((token: Token) => token.address === val);
                setNewMintAddress(val)
                setSelectedToken({
                  address: val, 
                  decimals: requiredToken?.decimals || 6, 
                  symbol: requiredToken?.symbol || 'USDC', 
                  logoURI: requiredToken?.logoURI || 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png'
                })
              }}
            >
            <SelectTrigger className="w-full rounded-full h-14 px-4 py-3 cursor-pointer text-base bg-gray-800 border border-gray-700 text-white">
              <SelectValue placeholder="Select token" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border border-gray-700 text-white">
              <SelectGroup>
                <SelectLabel className="text-gray-400">Token</SelectLabel>
                {tokenList.map((token: Token) => (
                  <SelectItem 
                    key={token.address} 
                    value={`${token.address}`} 
                    className="cursor-pointer flex flex-row items-center gap-2 py-2 px-3"
                  >
                    <div className="flex flex-row items-center gap-2 w-full">
                      <img 
                        src={`${token.logoURI}`} 
                        alt="" 
                        width={24} 
                        height={24} 
                        className="rounded-full flex-shrink-0" 
                      />
                      <span className="truncate">{token.symbol}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select> */}
        </div>
          <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
            <Label htmlFor="treasuryAmount" className="text-right text-base text-gray-300 md:col-span-1">
              Treasury Amount
            </Label>
            <Input
              id="treasuryAmount"
              type="number"
              value={treasuryAmount}
              onChange={(e) => setTreasuryAmount(e.target.value)}
              className="md:col-span-3 rounded-full h-14 w-full px-4 py-3 text-base bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all duration-300"
              placeholder={`Amount of tokens to lock in treasury`}
              autoComplete="off"
            />
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <Button 
            onClick={() => 
              createVestingAccountMutation.mutateAsync({
                company_name: newCompany,
                mint: newMintAddress,
                treasuryAmount: Number(treasuryAmount)
              })}
            disabled={createVestingAccountMutation.isPending || !treasuryAmount}
            className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-8 h-12 rounded-full text-lg transition-colors duration-300"
          >
            {createVestingAccountMutation.isPending ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : null}
            Create New Company Vesting Account
          </Button>
        </div>
      </div>
    </motion.main>
  );  
}

export function VestingList() {
  const { getProgramAccount, vestingAccounts } = useVestingProgram();
  const wallet = useWallet()
  const pubKeyString = wallet.publicKey?.toString() || "";
  const user = formatAddress(pubKeyString)

  if (getProgramAccount.isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!getProgramAccount.data?.value) {
    return (
      <div className="flex justify-center p-4">
        <div className="bg-red-900 text-white px-6 py-4 rounded-lg max-w-2xl text-center">
          <span className="font-semibold">Program account not found.</span>
          <p className="mt-2">Make sure you have deployed the program and are on the correct cluster.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-12 bg-gradient-to-b from-gray-900 to-black min-h-screen">
      <div className="max-w-7xl mx-auto rounded-xl p-4">
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='z-40 font-bold text-center pb-12 text-3xl text-white'
        >
          Company Vestings for{' '}
          <a
            href={`https://solscan.io/address/${pubKeyString}`}
            rel="noopener noreferrer"
            target="_blank"
            className='inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors duration-200'
          >
            <span className="font-semibold">{user}</span>
            <ExternalLink size={20}/>
          </a>
        </motion.h2>
        {vestingAccounts.isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          </div>
        ) : vestingAccounts.data?.length ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {vestingAccounts.data?.map((account, index) => (
              <motion.div 
                key={account.publicKey.toString()} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="transform transition-all duration-200 hover:scale-[1.02]"
              >
                <VestingCard account={account.publicKey.toBase58()} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12 bg-gray-800 rounded-xl shadow-2xl"
          >
            <h2 className="text-3xl font-bold mb-4 text-white">No Vesting Accounts</h2>
            <p className="text-gray-400 text-lg">
              No Vesting Accounts found. Create one above to get started.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}