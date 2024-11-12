'use client'

import { PublicKey } from "@solana/web3.js"
import { useVestingProgram, useVestingProgramAccount } from "./vesting-data-access"
import { Card, CardTitle, CardHeader, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useState, useEffect, useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {BN} from "@coral-xyz/anchor"

interface CreateEmployeeArgs {
    startTime: number;
    endTime: number;
    totalAmount: number;
    cliffTime: number;
  }

export default function VestingCard({ account }: { account: string }){
    // const { getVestingAccountState, createEmployeeVestingAccount } = useVestingProgram()
    const { getVestingAccountStateQuery, createEmployeeAccountMutation } = useVestingProgramAccount({account: new PublicKey(account)})
    const { connection } = useConnection()
    // const [companyName, setCompanyName] = useState('')
    const { wallet, publicKey, sendTransaction } = useWallet()
    const [employeeArgs, setEmployeeArgs] = useState<CreateEmployeeArgs>();
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(1000);
    const [cliffTime, setCliffTime] = useState(400);
    const [totalAmount, setTotalAmount] = useState(100000);
    
    // useEffect(() => {
    //     async function getState(){
    //         const vestingAccountKey = new PublicKey(account);
    //         const vestingAccount = await getVestingAccountState(vestingAccountKey);
    //         if(vestingAccount && vestingAccount.companyName){
    //             setCompanyName(vestingAccount.companyName)
    //         }
    //     }
    //     getState();
    // }, [account, getVestingAccountState])

    // const handleCreateEmployeeVestingAccount = async () => {
    //     const createEmployeeAccountTx = await createEmployeeVestingAccount(new BN(startTime), new BN(endTime), new BN(totalAmount), new BN(cliffTime), new PublicKey(account), publicKey!)
    //     if(createEmployeeAccountTx){
    //         const {
    //             context: { slot: minContextSlot },
    //             value: { blockhash, lastValidBlockHeight },
    //           } = await connection.getLatestBlockhashAndContext();
    //         const signature = await sendTransaction(createEmployeeAccountTx, connection, { minContextSlot })
    //         await connection.confirmTransaction(
    //             { blockhash, lastValidBlockHeight, signature },
    //             "confirmed"
    //         );
    //     }
    // }

    const {data, isLoading, isError} = getVestingAccountStateQuery;

    //checking aptness of company name
    const companyName = useMemo(
        () => getVestingAccountStateQuery.data?.companyName ?? "0",
        [getVestingAccountStateQuery.data?.companyName]
      );

    if(isLoading){
        return (
            <span className="loading loading-spinner loading-lg"></span>
        )
    }

    return(
        <>
        <Card className="bg-card">
              <CardHeader>
                <CardTitle>{companyName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input type="number" onChange={(e) => setStartTime(Number(e.target.value))}/>
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input type="number" onChange={(e) => setEndTime(Number(e.target.value))}/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cliff Time</Label>
                    <Input type="number" onChange={(e) => setCliffTime(Number(e.target.value))}/>
                  </div>
                  <div className="space-y-2">
                    <Label>Total Allocation</Label>
                    <Input type="number" onChange={(e) => setTotalAmount(Number(e.target.value))}/>
                  </div>
                </div>
                <Button className="w-full" onClick={() => createEmployeeAccountMutation.mutateAsync({
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
        </>
    )
}