'use client'

import {getVestingProgram, getVestingProgramId} from '@project/anchor'
import { useConnection, useWallet} from '@solana/wallet-adapter-react'
import {Cluster, Keypair, PublicKey} from '@solana/web3.js'
import {useMutation, useQuery} from '@tanstack/react-query'
import {useMemo} from 'react'
import { toast } from 'sonner'
import {useCluster} from '../cluster/cluster-data-access'
import {useAnchorProvider} from '../solana/solana-provider'
import {useTransactionToast} from '../ui/ui-layout'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { BN } from "@coral-xyz/anchor"

interface CreateVestingArgs {
  company_name: string;
  mint: string;
}

interface CreateEmployeeArgs {
  start_time: number;
  end_time: number;
  total_allocation_amount: number;
  cliff: number;
}

//getting all the vesting accounts, program methods, and defining individual hooks for ops
//useQuery for fetching Vesting Accounts associated with given programId, useMutation for creating vesting accounts/claiming tokens
export function useVestingProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()

  const provider = useAnchorProvider()
  const programId = useMemo(() => getVestingProgramId(cluster.network as Cluster), [cluster])
  const program = getVestingProgram(provider)

  const wallet = useWallet();

  // the main vesting program account
  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  // fetching all the vesting accounts associated with the program account
  const vestingAccounts = useQuery({
    queryKey: ["vesting", "all", { cluster }],
    queryFn: () => program.account.vestingAccount.all(),
  })

  // fetching all the employee vesting accounts associated with the program + a vesting account above
  const employeeAccounts = useQuery({
    queryKey: ['employeeVestingAccounts', {cluster}],
    queryFn: () => program.account.employeeVestingAccount.all(),
  })

  // create vesting account TXN
  const createVestingAccountMutation = useMutation({
    mutationKey: ["vestingAccount", "create", { cluster }],
    mutationFn: ({ company_name, mint }: CreateVestingArgs) => program.methods.createVestingAccount(company_name)
    .accounts({ 
      signer: wallet.publicKey!,
      mint: new PublicKey(mint),
      tokenProgram: TOKEN_PROGRAM_ID
     })
     .rpc({commitment: "confirmed"}),
    onSuccess: (tx) => {
      transactionToast(tx)
      return vestingAccounts.refetch()
    },
    onError: () => toast.error("Failed to initialize vesting account"),
  })


  return {
    program,
    programId,
    getProgramAccount,
    vestingAccounts,
    employeeAccounts,
    createVestingAccountMutation,
  }
  
}

export function useVestingProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const wallet = useWallet();
  const { program, vestingAccounts, employeeAccounts } = useVestingProgram()

  const getVestingAccountStateQuery = useQuery({
    queryKey: ["vesting", "fetch", { cluster, account }],
    queryFn: () => program.account.vestingAccount.fetch(account, "confirmed",)
  })


  const createEmployeeAccountMutation = useMutation({
    mutationKey: ['vesting', 'create_employee_vesting_account'],
    mutationFn: ({ start_time, end_time, total_allocation_amount, cliff }: CreateEmployeeArgs) => 
    program.methods.createEmployeeVesting(new BN(start_time), new BN(end_time), new BN(total_allocation_amount), new BN(cliff))
    .accounts({ 
      beneficiary: wallet.publicKey!,
      vestingAccount: account,
     })
     .rpc({commitment: "confirmed"}),
    onSuccess: (tx) => {
      transactionToast(tx)
      return vestingAccounts.refetch()
    },
    onError: () => toast.error("Failed to initialize employee account"),
  })

  const claimTokensMutation = useMutation({
    mutationKey: ['vesting', 'claim_tokens'],
    mutationFn: (company_name: string) => program.methods.claimTokens(company_name)
    .accounts({ 
      tokenProgram: TOKEN_PROGRAM_ID
     })
     .rpc({commitment: "confirmed"}),
    onSuccess: (tx) => {
      transactionToast(tx)
      return tx
    },
  })

  return {
    getVestingAccountStateQuery,
    createEmployeeAccountMutation,
    claimTokensMutation
  }
}
