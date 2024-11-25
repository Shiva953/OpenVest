import { useVestingProgram, useVestingProgramAccount } from './vesting-data-access'
import { useState, useMemo } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { PublicKey } from '@solana/web3.js'
import { format } from "date-fns"
import {BN} from "@coral-xyz/anchor"

export function AllocationList(){
    const { program, getProgramAccount, employeeAccounts } = useVestingProgram();
  
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
  
    return(
      <div className="px-4 -mt-4">
        <div className="max-w-10xl mx-auto bg-gray-50 rounded-xl shadow-sm p-4">
          {employeeAccounts.isLoading ? (
            <div className="flex justify-center items-center h-24">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : employeeAccounts.data?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employeeAccounts.data?.map((account) => (
                <div key={account.publicKey.toString()} className="transform transition-all duration-200 hover:scale-[1.02]">
                  <AllocationCard account={account.publicKey.toBase58()}/>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <h2 className="text-2xl font-semibold mb-1">No Employee Vesting Accounts</h2>
              {/* <p className="text-gray-600">
                No Vesting Accounts found. Create one above to get started.
              </p> */}
            </div>
          )}
        </div>
      </div>
    )
  }
  
  export function AllocationCard({account} : { account: string }){
    const { getEmployeeVestingAccountStateQuery, claimTokensMutation } = useVestingProgramAccount({account: new PublicKey(account)})
  
    const startTime = useMemo(
      () => getEmployeeVestingAccountStateQuery.data?.startTime ?? "0",
      [getEmployeeVestingAccountStateQuery.data?.startTime]
    );
  
    const endTime = useMemo(
      () => getEmployeeVestingAccountStateQuery.data?.endTime ?? "0",
      [getEmployeeVestingAccountStateQuery.data?.endTime]
    );
  
    const total_allocation_amount = useMemo(
      () => getEmployeeVestingAccountStateQuery.data?.tokenAllocationAmount ?? "0",
      [getEmployeeVestingAccountStateQuery.data?.tokenAllocationAmount]
    );
  
    const cliff_period = useMemo(
      () => getEmployeeVestingAccountStateQuery.data?.cliff ?? "0",
      [getEmployeeVestingAccountStateQuery.data?.cliff]
    );
  
    const formatDate = (timestamp: BN | "0") => {
      if (!timestamp) return "Not set";
      if(timestamp == "0") return 0;
      const date = new Date(timestamp.toNumber() * 1000);
      return format(date, 'dd/MM/yyyy h:mmaaa');
    };
  
    return (
      <Card className="w-full mx-auto">
        <CardContent className="space-y-3">
          <div className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="text-lg font-medium">Token Vesting Schedule</p>
            </div>
  
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-500">Start Time</h3>
              <p className="text-lg font-medium">{formatDate(startTime)}</p>
            </div>
  
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-500">End Time</h3>
              <p className="text-lg font-medium">{formatDate(endTime)}</p>
            </div>
  
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-500">Tokens Allocated</h3>
              <p className="text-lg font-medium">{total_allocation_amount.toLocaleString()}</p>
            </div>
  
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-500">Cliff Period</h3>
              <p className="text-lg font-medium">{cliff_period.toString()}</p>
            </div>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            className="bg-violet-800 text-white"
            onClick={() => claimTokensMutation.mutateAsync(
              
            )}
            disabled={claimTokensMutation.isPending}
          >
            Claim Tokens
          </Button>
        </CardFooter>
      </Card>
    );
  }