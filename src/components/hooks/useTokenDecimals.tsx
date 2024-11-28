import { useEffect, useState } from "react";
import { getDecimalsAndSupplyToken } from "@/app/lib/getTokenDecimals";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";

export default function useTokenDecimals(mint: string){
    const [decimal, setDecimal] = useState(9);
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed")

    useEffect(() => {
        async function getDecimals(){
            const metadata = await getDecimalsAndSupplyToken(connection, mint);
            const decimals = metadata?.decimals || 9;
            setDecimal(decimals)
        }
        getDecimals()
    }, [])

    return decimal;
}