import { useEffect, useState, useMemo, useCallback } from "react";
import { getDecimalsAndSupplyToken } from "@/app/lib/utils";
import { clusterApiUrl, Connection } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed")

export default function useTokenDecimals(mint: string) {
    const [decimal, setDecimal] = useState(9);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        async function getDecimals() {
            try {
                setIsLoading(true);
                const metadata = await getDecimalsAndSupplyToken(connection, mint);
                if (isMounted) {
                    setDecimal(metadata?.decimals || 9);
                }
            } catch (error) {
                console.error("Failed to fetch token decimals", error);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        getDecimals();
        return () => {
            isMounted = false;
        };
    }, [mint]);

    return decimal;
}