import { Connection } from "@solana/web3.js";
import { format, setHours, setMinutes, getTime } from 'date-fns'
import { BN } from "@coral-xyz/anchor";

export async function isBlockhashExpired(connection: Connection, lastValidBlockHeight: number) {
    let currentBlockHeight = (await connection.getBlockHeight('finalized'));
    return (currentBlockHeight > lastValidBlockHeight - 150);
}

export const formatAddress = (address: string): string => {
    return `${address.slice(0, 4)}…${address.slice(
        address.length - 4,
        address.length
    )}`;
};

export const dateToUnixTimestamp = (date: Date | undefined): number => {
    if (!date) return 0;
    return Math.floor(date.getTime() / 1000);
};

export const getUnixTimestamp = (startDate: Date, startTiming: string) => {
    if (!startDate || !startTiming) return 0;
    // Parse the time string (HH:mm)
    const [hours, minutes] = startTiming.split(':').map(Number);
    // Create a date object with the selected date and time
    const combinedDateTime = setMinutes(
      setHours(startDate, hours), 
      minutes
    );
    // Convert to Unix timestamp (seconds)
    return Math.floor(getTime(combinedDateTime) / 1000);
};

export const cliffPeriodToCliffTime = (startTime: number, cliffPeriod: number) => {
    return startTime + cliffPeriodInMinutesToUnixSeconds(cliffPeriod);
}

export const cliffPeriodInMinutesToUnixSeconds = (cliffPeriod: number) => {
    return cliffPeriod * 60;
}

export const formatDate = (timestamp: BN | "0") => {
    if (!timestamp || timestamp === "0") return "Not set";
    const date = new Date(timestamp.toNumber() * 1000);
    return format(date, 'MMM dd, yyyy h:mmaa');
  };
  
export const compressPublicKey = (key: string) => {
    return `${key.slice(0, 4)}…${key.slice(-4)}`;
};