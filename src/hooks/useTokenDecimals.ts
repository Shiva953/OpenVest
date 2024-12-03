import { useEffect, useState } from "react";
import { getDecimalsAndSupplyToken } from "@/app/lib/utils";
import { clusterApiUrl, Connection } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed")

export default function useTokenDecimals(mint: string) {
    const [decimal, setDecimal] = useState(9);
    const [isDecimalsLoading, setisDecimalsLoading] = useState(true);

    useEffect(() => {
        // Only run effect if mint is truthy
        if (!mint) {
            setisDecimalsLoading(false);
            return;
        }

        let isMounted = true;
        async function getDecimals() {
            try {
                setisDecimalsLoading(true);
                const metadata = await getDecimalsAndSupplyToken(connection, mint);
                if (isMounted) {
                    setDecimal(metadata?.decimals || 9);
                }
            } catch (error) {
                console.error("Failed to fetch token decimals", error);
                // Set a default if fetch fails
                if (isMounted) {
                    setDecimal(9);
                }
            } finally {
                if (isMounted) {
                    setisDecimalsLoading(false);
                }
            }
        }

        getDecimals();
        return () => {
            isMounted = false;
        };
    }, [mint]); // Add mint to dependency array

    return {
        decimal,
        isDecimalsLoading
    };
}