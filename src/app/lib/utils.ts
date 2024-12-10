import { Connection, PublicKey } from "@solana/web3.js";
import { format, setHours, setMinutes, getTime } from 'date-fns'
import { BN } from "@coral-xyz/anchor";
import { MintLayout } from '@solana/spl-token'

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
    const [hours, minutes] = startTiming.split(':').map(Number);
    const combinedDateTime = setMinutes(
      setHours(startDate, hours), 
      minutes
    );
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

export const progressPercentageCalc = (total_allocation_amount: BN, withdrawn_amount: BN) => {
  const totalAllocation = parseFloat(total_allocation_amount.toString());
  const withdrawn = parseFloat(withdrawn_amount.toString());
  return totalAllocation > 0 
    ? Math.min((withdrawn / totalAllocation) * 100, 100) 
    : 0;
};


/**
   * Function to get token details
   * @param {Connection} connection - Connection to the Solana network
   * @param {string} tokenMintAddress - Address of the token's mint
   * @returns {Object} - Token details { name, symbol, decimals }
 */
export async function getDecimalsAndSupplyToken(solanaConnection: Connection, tokenMintAddress: string) {
    let mintPublicKey;
    let mintAccountInfo;
  
    try {
      mintPublicKey = new PublicKey(tokenMintAddress);
    } catch (error) {
      console.error(`mintPublicKey: `, error);
      return null;
    }
  
  
    try {
      mintAccountInfo = await solanaConnection.getAccountInfo(mintPublicKey);
    } catch (error) {
      console.error(`mintAccountInfo: `, error);
      return null;
    }
  
    let decodedData;
    try {
      // Decode the mint data using the SPL Token layout
       decodedData = MintLayout.decode(mintAccountInfo!.data);
      // console.log(decodedData);
    } catch (error) {
      console.error(`decodedData:`, error);
      return null;
    }
    const supply = decodedData.supply;
    const decimals = decodedData.decimals;
    return { supply, decimals };
  }