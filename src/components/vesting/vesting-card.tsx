'use client'

import { PublicKey } from "@solana/web3.js"
import { useVestingProgramAccount } from "./vesting-data-access"
import { Card, CardTitle, CardHeader, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useState, useEffect, useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

interface CreateEmployeeArgs {
    startTime: number;
    endTime: number;
    totalAmount: number;
    cliffTime: number;
  }

export default function VestingCard({ account }: { account: string }){
    const { getVestingAccountStateQuery, createEmployeeAccountMutation } = useVestingProgramAccount({account: new PublicKey(account)})
    const { connection } = useConnection()
    const { wallet, publicKey, sendTransaction } = useWallet()
    const [employeeArgs, setEmployeeArgs] = useState<CreateEmployeeArgs>();
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(1000);
    const [cliffTime, setCliffTime] = useState(400);
    const [totalAmount, setTotalAmount] = useState(100000);

    const {data, isLoading, isError} = getVestingAccountStateQuery;

    //checking aptness of company name
    const companyName = useMemo(
        () => getVestingAccountStateQuery.data?.companyName ?? "0",
        [getVestingAccountStateQuery.data?.companyName]
      );

    if(isLoading){
      return (
        <Card className="bg-white h-full animate-pulse">
          <div className="p-6">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card className="bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">{companyName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Start Time</Label>
              <Input 
                type="number" 
                onChange={(e) => setStartTime(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium">End Time</Label>
              <Input 
                type="number" 
                onChange={(e) => setEndTime(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Cliff Time</Label>
              <Input 
                type="number" 
                onChange={(e) => setCliffTime(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium">Total Allocation</Label>
              <Input 
                type="number" 
                onChange={(e) => setTotalAmount(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          <Button 
            className="w-full bg-black transition-colors mt-2"
            onClick={() => createEmployeeAccountMutation.mutateAsync({
              start_time: startTime,
              end_time: endTime,
              total_allocation_amount: totalAmount,
              cliff: cliffTime,
            })}
            disabled={createEmployeeAccountMutation.isPending}
          >
            Create Employee Vesting Account
          </Button>
        </CardContent>
      </Card>
    );
}