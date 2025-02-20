import { useVestingProgram, useVestingProgramAccount } from './vesting-data-access'
import { Button } from '../ui/button'
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { PublicKey } from '@solana/web3.js'
import { BN } from "@coral-xyz/anchor"
import { ExternalLink } from 'lucide-react'
import useTokenDecimals from '../../hooks/useTokenDecimals';
import { AllocationCardParamsT } from '@/types';
import { formatDate, compressPublicKey } from '@/app/lib/utils';
import { progressPercentageCalc } from '@/app/lib/utils';
import { useWallet } from '@solana/wallet-adapter-react';

export function AllocationList(){
    const { getProgramAccount, employeeAccountsWithMetadata } = useVestingProgram();
    const wallet = useWallet();
  
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
          {employeeAccountsWithMetadata.isLoading ? (
            <div className="flex justify-center items-center h-24">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : employeeAccountsWithMetadata?.data?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employeeAccountsWithMetadata.data?.map((a) => {

                const acp:AllocationCardParamsT = {
                  ownerOfVestingAccountForGivenEmployee: a.ownerOfVestingAccountForGivenEmployee || 'CUdHPZyyuMCzBJEgTZnoopxhp9zjp1pog3Tgx2jEKP7E',
                  start_time: a.start_time ?? new BN(0),
                  end_time: a.end_time ?? new BN(0),
                  cliff: a.cliff ?? 0,
                  total_allocation_amount: a.total_allocation_amount ?? new BN(0),
                  withdrawn_amount: a.withdrawn_amount ?? new BN(0),
                  actualTotalAllocationAmount: a.actualTotalAllocationAmount ?? 0,
                  actualWithdrawnAmount: a.actualWithdrawnAmount ?? 0,
                  beneficiary: a.beneficiary ?? 'CUdHPZyyuMCzBJEgTZnoopxhp9zjp1pog3Tgx2jEKP7E',
                  companyName: a.companyName ?? "CompanyNotFound",
                  token_mint: a.token_mint ?? "6qPDRa1oso15ZxnyamLTt44TXSzBHnPqYCePAXFPuU6",
                }
                const check = a.ownerOfVestingAccountForGivenEmployee == wallet.publicKey?.toString(); //employee accounts whose associated vesting account is owned by the connected wallet pubkey
                return(
                <div key={a.employeeAccount.toString()} className="transform transition-all duration-200 hover:scale-[1.02]">
                  {<AllocationCard 
                  employeeAccount={a.employeeAccount.toBase58()}
                  allocationCardParams={acp} 
                  />}
                </div>
                )
              })}
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
  
export function AllocationCard({employeeAccount, allocationCardParams} : { employeeAccount: string, allocationCardParams: AllocationCardParamsT }){
  const employee = new PublicKey(employeeAccount);
  const { claimTokensMutation } = useVestingProgramAccount({account: employee})

  const startTime = allocationCardParams.start_time;
  const endTime = allocationCardParams.end_time;
  
  const cliff_period_in_mins = allocationCardParams.cliff;

  const company_name = allocationCardParams.companyName;
  const token_mint = allocationCardParams.token_mint;
  const total_allocation_amount = allocationCardParams.total_allocation_amount;
  const withdrawn_amount = allocationCardParams.withdrawn_amount;

    const actualTotalAllocationAmount = allocationCardParams.actualTotalAllocationAmount;
    const actualWithdrawnAmount = allocationCardParams.actualWithdrawnAmount;
    const beneficiary = allocationCardParams.beneficiary;
    const progressPercentage = progressPercentageCalc(total_allocation_amount, withdrawn_amount)

    const isClaimExpired = (Date.now()/1000) > endTime.toNumber();
  
    return (
      <Card className="w-full mx-auto no-underline group relative shadow-2xl shadow-zinc-900 p-px leading-6 inline-block">
        <span className="absolute inset-0 overflow-hidden">
          <span className="absolute inset-0 bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(56,189,248,0.6)_0%,rgba(56,189,248,0)_75%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"></span>
        </span>
        <CardContent className="p-6 space-y-4">
        <h2 className='mx-auto z-40'>
            <div className='flex flex-row mx-auto items-center z-40'>
              Token allocation for{' '}
              <span className='ml-2 text-medium text-teal-400 z-40'>{compressPublicKey(beneficiary || 'yoben....') }</span>
              <a 
                  href={beneficiary ? `https://solscan.io/address/${beneficiary}` : '#'} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="ml-2 z-40"
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
                  href={`https://solscan.io/token/${token_mint}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-500 hover:text-blue-700 z-20"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          </div>

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
        </CardFooter>
      </Card>
    );
  }