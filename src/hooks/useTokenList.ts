// useTokenList.ts
import { useState, useEffect } from 'react'
import { Token,UseTokenListReturn } from '@/types'

export function useTokenList(): UseTokenListReturn {
  const [tokenList, setTokenList] = useState<Token[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const getTokens = async () => {
      try {
        const resp = await fetch("https://token.jup.ag/strict", {
          method: "GET",
          cache: "force-cache",
          next: { revalidate: 86400 },
        })
        
        if (!resp.ok) {
          throw new Error(`HTTP error! status: ${resp.status}`)
        }
        
        const tokens = await resp.json()
        const formattedTokenList = tokens.slice(0, 100).map((token: any) => ({
          address: token.address,
          symbol: token.symbol,
          decimals: token.decimals,
          logoURI: token.logoURI,
        }))
        
        setTokenList(formattedTokenList)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch tokens'))
      } finally {
        setIsLoading(false)
      }
    }

    getTokens()
  }, [])

  return { tokenList, isLoading, error }
}