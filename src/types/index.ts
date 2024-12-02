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
  }
  
  export interface CreateEmployeeArgs {
    start_time: number;
    end_time: number;
    total_allocation_amount: number;
    cliff: number;
    beneficiary: string;
  }