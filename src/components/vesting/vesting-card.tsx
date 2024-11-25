'use client'

import { PublicKey } from "@solana/web3.js";
import { useVestingProgram, useVestingProgramAccount } from "./vesting-data-access"
import { Card, CardTitle, CardHeader, CardContent, CardFooter } from "../ui/card";
import { BN } from "@coral-xyz/anchor"
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useState, useEffect, useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface CreateEmployeeArgs {
    startTime: number;
    endTime: number;
    totalAmount: number;
    cliffTime: number;
  }

  const dateToUnixTimestamp = (date: Date | undefined): number => {
    if (!date) return 0;
    return Math.floor(date.getTime() / 1000);
  };

export default function VestingCard({ account }: { account: string }){
    const { getVestingAccountStateQuery, getEmployeeVestingAccountStateQuery, createEmployeeAccountMutation } = useVestingProgramAccount({account: new PublicKey(account)})
    const { connection } = useConnection()
    const { wallet, publicKey, sendTransaction } = useWallet()
    const [employeeArgs, setEmployeeArgs] = useState<CreateEmployeeArgs>();
    const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
    const [cliffTime, setCliffTime] = useState(400);
    const [totalAmount, setTotalAmount] = useState(100000);
    const [showAllocationList, setShowAllocationList] = useState(false)

    const {data, isLoading, isError} = getVestingAccountStateQuery;

    //checking aptness of company name
    const companyName = useMemo(
        () => getVestingAccountStateQuery.data?.companyName ?? "0",
        [getVestingAccountStateQuery.data?.companyName]
      );

      // const startTime = useMemo(() => startDate?.getTime() ?? 0, [startDate]);
      // const endTime = useMemo(() => endDate?.getTime() ?? 0, [endDate]);
      const startTime = useMemo(() => dateToUnixTimestamp(startDate), [startDate]);
      const endTime = useMemo(() => dateToUnixTimestamp(endDate), [endDate]);


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
      <>
      {/* <Card className="bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">{companyName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Start Time</Label>
                <DatePicker
                  onChange={(date) => setStartTime(date?.getTime()!)}
                />
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium">End Time</Label>
              <DatePicker
                  onChange={(date) => setEndTime(date?.getTime()!)}
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
          <Button
          className="w-full bg-black transition-colors mt-2"
          onClick={() => setShowAllocationList(true)}
          >
            Show Employee Vesting Accounts for this Company
          </Button>
        </CardContent>
      </Card>
      <AlertDialog open={showAllocationList} onOpenChange={setShowAllocationList}>
        <AlertDialogContent className="max-w-7xl max-h-[80vh] overflow-y-auto">
          <Button 
            variant="ghost" 
            className="absolute right-4 top-4 p-1 h-auto rounded-full hover:bg-gray-100"
            onClick={() => setShowAllocationList(false)}
          >
            <span className="sr-only mx-auto">Close</span>
          </Button>
          <AlertDialogHeader>
            <AlertDialogTitle>Employee Vesting Accounts</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="py-4">
            <AllocationList company_name={companyName} />
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowAllocationList(false)}>
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog> */}
      <Card className="bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">{companyName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Start Time</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    {startDate ? (
                      format(startDate, "PPP")
                    ) : (
                      <span>Pick a start date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium">End Time</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    {endDate ? (
                      format(endDate, "PPP")
                    ) : (
                      <span>Pick an end date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date < startDate!}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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
            disabled={createEmployeeAccountMutation.isPending || !startDate || !endDate}
          >
            Create Employee Vesting Account
          </Button>
          <Button
            className="w-full bg-black transition-colors mt-2"
            onClick={() => setShowAllocationList(true)}
          >
            Show Employee Vesting Accounts for this Company
          </Button>
        </CardContent>
      </Card>
      <AlertDialog open={showAllocationList} onOpenChange={setShowAllocationList}>
        <AlertDialogContent className="max-w-7xl max-h-[80vh] overflow-y-auto">
          <Button 
            variant="ghost" 
            className="absolute right-4 top-4 p-1 h-auto rounded-full hover:bg-gray-100"
            onClick={() => setShowAllocationList(false)}
          >
            <span className="sr-only mx-auto">Close</span>
          </Button>
          <AlertDialogHeader>
            <AlertDialogTitle>Employee Vesting Accounts</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="py-4">
            <AllocationList company_name={companyName} />
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowAllocationList(false)}>
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </>
    );
}

export function AllocationList({company_name}: {company_name: string}){
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
      <div className="max-w-7xl mx-auto bg-gray-50 rounded-xl shadow-sm p-4">
        {employeeAccounts.isLoading ? (
          <div className="flex justify-center items-center h-24">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : employeeAccounts.data?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employeeAccounts.data?.map((account) => (
              <div key={account.publicKey.toString()} className="transform transition-all duration-200 hover:scale-[1.02]">
                <AllocationCard account={account.publicKey.toBase58()} company_name={company_name}/>
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

export function AllocationCard({account, company_name} : { account: string, company_name: string }){
  const { getEmployeeVestingAccountStateQuery, claimTokensMutation } = useVestingProgramAccount({account: new PublicKey(account)})
  //you also need the company name
  //guess approach - fetch those vesting accounts for which employee accounts exist

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