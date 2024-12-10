// import { useEffect, useState } from "react";
// import { getDecimalsAndSupplyToken } from "@/app/lib/utils";
// import { clusterApiUrl, Connection } from "@solana/web3.js";

// const connection = new Connection(clusterApiUrl("devnet"), "confirmed")

// export default function useTokenDecimals(mint: string) {
//     const [decimal, setDecimal] = useState(9);
//     const [isDecimalsLoading, setisDecimalsLoading] = useState(true);

//     useEffect(() => {
//         // Only run effect if mint is truthy
//         if (!mint) {
//             setisDecimalsLoading(false);
//             return;
//         }

//         let isMounted = true;
//         async function getDecimals() {
//             try {
//                 setisDecimalsLoading(true);
//                 const metadata = await getDecimalsAndSupplyToken(connection, mint);
//                 if (isMounted) {
//                     setDecimal(metadata?.decimals || 9);
//                 }
//             } catch (error) {
//                 console.error("Failed to fetch token decimals", error);
//                 // Set a default if fetch fails
//                 if (isMounted) {
//                     setDecimal(9);
//                 }
//             } finally {
//                 if (isMounted) {
//                     setisDecimalsLoading(false);
//                 }
//             }
//         }

//         getDecimals();
//         return () => {
//             isMounted = false;
//         };
//     }, [mint]); // Add mint to dependency array

//     return {
//         decimal,
//         isDecimalsLoading
//     };
// }

import { useEffect, useState, useMemo, useCallback } from "react";
import { getDecimalsAndSupplyToken } from "@/app/lib/utils";
import { clusterApiUrl, Connection } from "@solana/web3.js";

// // Create a simple in-memory cache
const tokenDecimalsCache = new Map<string, number>();

// export default function useTokenDecimals(mint: string) {
//     const [decimal, setDecimal] = useState(9);
//     const [isDecimalsLoading, setisDecimalsLoading] = useState(true);

//     const memoizedMint = useMemo(() => mint, [mint]);

//     useEffect(() => {
//         // Skip if no mint or already in cache
//         if (!memoizedMint) {
//             setisDecimalsLoading(false);
//             return;
//         }

//         // Check cache first
//         if (tokenDecimalsCache.has(memoizedMint)) {
//             setDecimal(tokenDecimalsCache.get(memoizedMint)!);
//             setisDecimalsLoading(false);
//             return;
//         }

//         const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
//         let isMounted = true;

//         async function getDecimals() {
//             try {
//                 setisDecimalsLoading(true);
//                 const metadata = await getDecimalsAndSupplyToken(connection, memoizedMint);
                
//                 if (isMounted) {
//                     const decimals = metadata?.decimals || 9;
                    
//                     // Cache the result
//                     tokenDecimalsCache.set(memoizedMint, decimals);
                    
//                     setDecimal(decimals);
//                 }
//             } catch (error) {
//                 console.error("Failed to fetch token decimals", error);
//                 if (isMounted) {
//                     setDecimal(9);
//                 }
//             } finally {
//                 if (isMounted) {
//                     setisDecimalsLoading(false);
//                 }
//             }
//         }

//         getDecimals();

//         return () => {
//             isMounted = false;
//         };
//     }, [memoizedMint]);

//     return {
//         decimal,
//         isDecimalsLoading
//     };
// }

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