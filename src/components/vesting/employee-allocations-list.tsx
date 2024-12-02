import { useVestingProgram, useVestingProgramAccount } from './vesting-data-access'
import { useState, useMemo } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { PublicKey } from '@solana/web3.js'
import { format, getTime } from "date-fns"
import { BN } from "@coral-xyz/anchor"
import { ExternalLink } from 'lucide-react'
import useTokenDecimals from '../../hooks/useTokenDecimals';
import { formatDate, formatAddress, compressPublicKey, } from '@/app/lib/utils';

export function AllocationList(){
    const { getProgramAccount, employeeAccounts } = useVestingProgram();
  
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
          {employeeAccounts.isLoading ? (
            <div className="flex justify-center items-center h-24">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : employeeAccounts.data?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employeeAccounts.data?.map((account) => (
                <div key={account.publicKey.toString()} className="transform transition-all duration-200 hover:scale-[1.02]">
                  <AllocationCard account={account.publicKey.toBase58()} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <h2 className="text-2xl font-semibold mb-1">No Employee Vesting Accounts</h2>
              <p className="text-gray-600">
                No Employee Vesting Accounts found. Create one to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }
  

export function AllocationCard({account} : { account: string }){
    const { getEmployeeVestingAccountStateQuery, claimTokensMutation } = useVestingProgramAccount({account: new PublicKey(account)})

    const companyVestingAccount = useMemo(
      () => getEmployeeVestingAccountStateQuery.data?.vestingAccount,
      [getEmployeeVestingAccountStateQuery.data?.vestingAccount]
    );

    const { getVestingAccountStateQuery } = useVestingProgramAccount({account: companyVestingAccount!});

    const allData = useMemo(
      () => getEmployeeVestingAccountStateQuery.data,
      [getEmployeeVestingAccountStateQuery.data]
    );

    
    const startTime = allData?.startTime || new BN(0)
    const endTime = allData?.endTime || new BN(0);
    const cliff_time = allData?.cliff || new BN(0)
  
    const total_allocation_amount = useMemo(
      () => getEmployeeVestingAccountStateQuery.data?.tokenAllocationAmount ?? new BN(0),
      [getEmployeeVestingAccountStateQuery.data?.tokenAllocationAmount]
    );
  
    const cliff_period_in_mins = ((cliff_time.sub(startTime)).toNumber())/60;

    const withdrawn_amount = useMemo(
      () => getEmployeeVestingAccountStateQuery.data?.withdrawnAmount ?? new BN(0),
      [getEmployeeVestingAccountStateQuery.data?.withdrawnAmount]
    );

      const vestingAccountData = useMemo(
      () => getVestingAccountStateQuery.data,
      [getVestingAccountStateQuery.data])

      const tokenMint = vestingAccountData?.mint ?? new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr");
      const token_mint = tokenMint?.toString();
      console.log("benef here: ,", allData?.beneficiary.toString())
      const company_name = vestingAccountData?.companyName ?? "Unknown company"

      const decimals = useTokenDecimals(tokenMint.toString())

      const actualTotalAllocationAmount = Math.floor(total_allocation_amount?.toNumber() /(10**decimals));
      const actualWithdrawnAmount = Math.floor(withdrawn_amount?.toNumber() /(10**decimals));

    // withdrawn amount progress bar
    const progressPercentage = useMemo(() => {
      const totalAllocation = parseFloat(total_allocation_amount.toString());
      const withdrawn = parseFloat(withdrawn_amount.toString());
      return totalAllocation > 0 
        ? Math.min((withdrawn / totalAllocation) * 100, 100) 
        : 0;
    }, [total_allocation_amount, withdrawn_amount]);

    const isClaimExpired = (Date.now()/1000) > endTime.toNumber();
  
    return (
      <Card className="w-full mx-auto no-underline group relative shadow-2xl shadow-zinc-900 p-px leading-6 inline-block">
        <span className="absolute inset-0 overflow-hidden">
          <span className="absolute inset-0 bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(56,189,248,0.6)_0%,rgba(56,189,248,0)_75%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"></span>
        </span>
        <CardContent className="p-6 space-y-4">
          <h2 className='mx-auto'>
            <div className='flex flex-row mx-auto'>
              <span>Token allocation for {' '}</span>
            <span className='text-medium text-teal-400'>{compressPublicKey(allData?.beneficiary.toString() || 'yobenefwasnotdefinedforthis....') }</span>
            <a 
                  href={`https://solscan.io/address/${allData?.beneficiary.toString()}?cluster=devnet`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                >
                  <ExternalLink size={16} />
                </a>
            </div>
          </h2>
          <div className="grid grid-cols-2 gap-4 space-x-4">
            <div className="space-y-1">
              <h4 className="text-sm text-gray-500 tracking-tighter">Start Date</h4>
              <p className="text-md text-white font-semibold">
                {formatDate(startTime)}
              </p>
            </div>
            <div className="space-y-1 text-right">
              <h4 className="text-sm text-gray-500 tracking-tighter">End Date</h4>
              <p className="text-md text-white font-semibold">
                {formatDate(endTime)}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 space-x-4">
            <div className="space-y-1">
              <h4 className="text-sm text-gray-500 tracking-tighter">Total Tokens</h4>
              <p className="text-md text-white font-semibold">
                {actualTotalAllocationAmount.toLocaleString()}
              </p>
            </div>
            <div className="space-y-1 text-right">
              <h4 className="text-sm text-gray-500 tracking-tighter">Cliff Period(Mins)</h4>
              <p className="text-md text-white font-semibold">
                {cliff_period_in_mins.toFixed(2).toString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 space-x-4">
            <div className="space-y-1">
              <h4 className="text-sm text-gray-500 tracking-tighter">Company</h4>
              <p className="text-md text-white font-semibold">
                {company_name}
              </p>
            </div>
            <div className="space-y-1 text-right">
              <h4 className="text-sm text-gray-500 tracking-tighter">Token Mint</h4>
              <div className="flex items-center justify-end space-x-2">
                <p className="text-md text-white font-semibold">
                  {compressPublicKey(token_mint)}
                </p>
                <a 
                  href={`https://solscan.io/token/${token_mint}?cluster=devnet`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-500 hover:text-blue-700 z-20"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          </div>

          {/* Withdrawn Tokens Progress Bar */}
          <div className="space-y-4 mt-4">
            <div className="flex justify-between text-sm text-gray-600 mt-8">
              <span className='mb--24 tracking-tight text-gray-300'>Unlocked Tokens</span>
              <span className='text-white font-bold'>{actualWithdrawnAmount.toLocaleString()} / {actualTotalAllocationAmount.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-2.5">
              <div 
                className="bg-green-500 h-2.5 rounded-full" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
        
        {/* claim period expired check */}
        <CardFooter className="flex justify-center pb-6">
          {!isClaimExpired ? (
            <Button 
            className="z-20 bg-white text-black px-8 py-2 rounded-lg transition-colors duration-300"
            onClick={() => claimTokensMutation.mutateAsync()}
            disabled={claimTokensMutation.isPending}
          >
            Claim Tokens
          </Button>
          ) : (
            <Button 
            className="bg-gray-800 text-white px-8 py-2 rounded-lg transition-colors duration-300"
            disabled={true}
            >
            Claim Expired
          </Button>
          )}
          {/* <Button 
            className="bg-black text-white px-8 py-2 rounded-lg transition-colors duration-300"
            onClick={() => claimTokensMutation.mutateAsync()}
            disabled={claimTokensMutation.isPending}
          >
            Claim Tokens
          </Button> */}
        </CardFooter>
      </Card>
    );
  }