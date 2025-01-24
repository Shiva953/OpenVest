import { BN } from "@coral-xyz/anchor";

export interface JupToken {
    address: string;
    chainId: number;
    decimals: number;
    name: string;
    symbol: string;
    logoURI: string;
    extensions: Extensions;
    tags: string[];
  }
  
  export interface Extensions {
    coingeckoId: string;
  }
  
  export interface Profile {
    id: string;
    address: string;
    token: JupToken;
    created_at: string;
    username: string;
    avatar: string;
  }
  
  export interface Request {
    id: string
    address: string
    username: string
    amount: number
    token: JupToken
    created_at: string
    updated_at: string
    description: string
  }

  export interface CreateVestingArgs {
    company_name: string;
    mint: string;
    treasuryAmount: number,
  }
  
  export interface CreateEmployeeArgs {
    start_time: number;
    end_time: number;
    total_allocation_amount: number;
    cliff: number;
    beneficiary: string;
  }

  export interface AllocationCardParamsT{
    ownerOfVestingAccountForGivenEmployee: string,
    start_time: BN,
    end_time: BN,
    cliff: number,
    total_allocation_amount: BN,
    withdrawn_amount: BN,
    actualTotalAllocationAmount: number,
    actualWithdrawnAmount: number,
    beneficiary: string,
    companyName: string,
    token_mint: string
  }

  export type Token = {
    address: string
    decimals: number
    symbol: string
    logoURI: string
  }
  
  export interface UseTokenListReturn {
    tokenList: Token[]
    isLoading: boolean
    error: Error | null
  }