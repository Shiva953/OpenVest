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