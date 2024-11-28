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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
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
    const { getVestingAccountStateQuery, createEmployeeAccountMutation } = useVestingProgramAccount({account: new PublicKey(account)})
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

      const startTime = useMemo(() => dateToUnixTimestamp(startDate), [startDate]);
      const endTime = useMemo(() => dateToUnixTimestamp(endDate), [endDate]);

      const cliffPeriodToCliffTime = (cliffPeriod: number) => {
        return startTime + cliffPeriodInMinutesToUnixSeconds(cliffPeriod);
      }

      const cliffPeriodInMinutesToUnixSeconds = (cliffPeriod: number) => {
        return cliffPeriod * 60;
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
              <Label className="text-sm font-medium">Cliff Period</Label>
              <Input 
                type="number" 
                onChange={(e) => setCliffTime(cliffPeriodToCliffTime(Number(e.target.value || "0")))}
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
          {/* <Button
            className="w-full bg-black transition-colors mt-2"
            onClick={() => setShowAllocationList(true)}
          >
            Show Employee Vesting Accounts for this Company
          </Button> */}
        </CardContent>
      </Card>
      </>
    );
}