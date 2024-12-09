'use client'

import { PublicKey } from "@solana/web3.js";
import { useVestingProgramAccount } from "./vesting-data-access"
import { Card, CardTitle, CardHeader, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useState, useMemo } from "react";
import { format } from 'date-fns'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { TimeInput } from "@nextui-org/date-input";
import { useConnection } from "@solana/wallet-adapter-react";
import useTokenDecimals from "../../hooks/useTokenDecimals";
import { getUnixTimestamp, cliffPeriodToCliffTime } from "@/app/lib/utils"

export default function VestingCard({ account }: { account: string }){
    const { getVestingAccountStateQuery, createEmployeeAccountMutation } = useVestingProgramAccount({account: new PublicKey(account)})
    const [startDate, setStartDate] = useState<Date>();
    const [startTiming, setStartTiming] = useState('12:00');
    const [beneficiary, setBeneficiary] = useState('')
    const [endDate, setEndDate] = useState<Date>();
    const [endTiming, setEndTiming] = useState('12:59');
    const [cliffTime, setCliffTime] = useState(400);
    const [totalAmount, setTotalAmount] = useState(100000);

    const {data, isLoading, isError} = getVestingAccountStateQuery;

    //checking aptness of company name
    const companyName = useMemo(
        () => getVestingAccountStateQuery.data?.companyName ?? "0",
        [getVestingAccountStateQuery.data?.companyName]
    );

    const tokenMint = useMemo(
      () => getVestingAccountStateQuery.data?.mint,
      [getVestingAccountStateQuery.data?.mint]
    );

      let tokenDecimals = useTokenDecimals(tokenMint?.toString()!);

      const startTime = useMemo(() => getUnixTimestamp(startDate!, startTiming), [startDate, startTiming]);
      const endTime = useMemo(() => getUnixTimestamp(endDate!, endTiming), [endDate, endTiming]);

    if (getVestingAccountStateQuery.isLoading) {
      return <div>Loading...</div>;
    }

    if (getVestingAccountStateQuery.isError) {
      return <div>Error loading vesting account</div>;
    }

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
      <Card className="bg-[rgb(2,8,23)]"
      >
      {/* <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/50 to-purple-600/50 rounded-xl blur-sm opacity-50 group-hover:opacity-75 transition duration-300 ease-in-out z-[-1]"></div> */}
        <div>
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
                    !endDate && "text-muted-foreground",
                    "flex items-center justify-between" // Ensure proper alignment
                  )}
                >
                  <span className="truncate max-w-full">
                    {startDate ? (
                      <>
                        <span className="hidden sm:inline">
                          {format(startDate, "PPP")} {/* Full format for larger screens */}
                        </span>
                        <span className="sm:hidden">
                          {format(startDate, "MMM dd")} {/* Shortened format for small screens */}
                        </span>
                      </>
                    ) : (
                      <span>Pick start</span>
                    )}
                  </span>
                  <CalendarIcon className="ml-2 h-4 w-4 opacity-50 flex-shrink-0" />
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
            <TimeInput
                onChange={(val) => setStartTiming(val.toString())}
                variant="bordered"
                className="w-full mx-auto mt-[1.75rem]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
              <Label className="text-sm font-medium">End Time</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                  variant="outline"
                  className={cn(
                    "w-full pl-3 text-left font-normal",
                    !endDate && "text-muted-foreground",
                    "flex items-center justify-between"
                  )}
                >
                  <span className="truncate max-w-full">
                    {endDate ? (
                      <>
                        <span className="hidden sm:inline">
                          {format(endDate, "PPP")} 
                        </span>
                        <span className="sm:hidden">
                          {format(endDate, "MMM dd")}
                        </span>
                      </>
                    ) : (
                      <span>Pick end</span>
                    )}
                  </span>
                  <CalendarIcon className="ml-2 h-4 w-4 opacity-50 flex-shrink-0" />
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
            <div className="space-y-1">
            <TimeInput
                onChange={(val) => setEndTiming(val.toString())}
                variant="bordered"
                className="w-full mx-auto mt-[1.75rem]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Cliff Period</Label>
              <Input 
                type="number" 
                onChange={(e) => setCliffTime(cliffPeriodToCliffTime(startTime, Number(e.target.value || "0")))}
                className="w-full bg-transparent"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium">Total Allocation</Label>
              <Input 
                type="number" 
                onChange={(e) => setTotalAmount(Number(e.target.value))}
                className="w-full bg-transparent"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Beneficiary</Label>
              <Input 
                type="string" 
                onChange={(e) => setBeneficiary(e.target.value)}
                className="w-full bg-transparent"
              />
            </div>
            </div>
          <Button 
            className="w-full bg-white text-black transition-colors mt-2"
            onClick={() => createEmployeeAccountMutation.mutateAsync({
              start_time: startTime,
              end_time: endTime,
              total_allocation_amount: totalAmount * (10**(tokenDecimals)),
              cliff: cliffTime,
              beneficiary: beneficiary,
            })}
            disabled={createEmployeeAccountMutation.isPending || !startDate || !endDate}
          >
            Create Employee Vesting Schedule
          </Button>
        </CardContent>
        </div>
      </Card>
      </>
    );
}