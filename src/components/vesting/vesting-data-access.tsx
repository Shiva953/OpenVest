'use client'

import {getVestingProgram, getVestingProgramId} from '@project/anchor'
import { useConnection, useWallet} from '@solana/wallet-adapter-react'
import {Connection, Cluster, clusterApiUrl, Keypair, PublicKey, Transaction} from '@solana/web3.js'
import {useMutation, useQuery} from '@tanstack/react-query'
import {useMemo} from 'react'
import { toast } from 'sonner'
import { isBlockhashExpired } from '@/app/lib/utils'
import {useAnchorProvider} from '../solana/solana-provider'
import { ExternalLink } from 'lucide-react'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import axios from "axios"
import { CreateVestingArgs, CreateEmployeeArgs } from '@/types'

//getting all the vesting accounts, program methods, and defining individual hooks for ops
//useQuery for fetching Vesting Accounts associated with given programId, useMutation for creating vesting accounts/claiming tokens
export function useVestingProgram() {
  const { connection } = useConnection()
  const cluster:Cluster = "devnet"

  const provider = useAnchorProvider()
  const clusterNetwork = "devnet";
  const programId = useMemo(() => getVestingProgramId(clusterNetwork), [clusterNetwork])
  const program = getVestingProgram(provider)

  const wallet = useWallet();


  // the main vesting program account
  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  // fetching all the vesting accounts associated with the program account
  // const vestingAccounts = useQuery({
  //   queryKey: ["vesting", "all", { cluster }],
  //   queryFn: () => program.account.vestingAccount.all().then((accounts) => accounts.filter((acc) => acc.account.owner.toString() == wallet?.publicKey!.toString())),
  // })
  const vestingAccounts = useQuery({
    queryKey: ["vesting", "all", { cluster, walletPublicKey: wallet?.publicKey?.toString() }],
    queryFn: () => program.account.vestingAccount.all().then((accounts) => accounts.filter((acc) => acc.account.owner.toString() == wallet?.publicKey!.toString())),
    enabled: !!wallet?.publicKey, // Only run the query if wallet is connected
    refetchOnWindowFocus: false
  })

  // fetching all the employee vesting accounts associated with the program + a vesting account above
  const employeeAccounts = useQuery({
    queryKey: ['employeeVestingAccounts', {cluster}],
    queryFn: () => program.account.employeeVestingAccount.all(),
  })

  // create vesting account TXN
  const createVestingAccountMutation = useMutation({
    mutationKey: ["vestingAccount", "create", { cluster }],
    mutationFn: async({ company_name, mint }: CreateVestingArgs) => {
      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

      const txn_metadata = await axios.post("http://localhost:3000/api/createCompanyVesting", {
        company_name: company_name,
        mint: mint,
        beneficiary: wallet.publicKey?.toString()!
      }, {
        headers: {'Content-Type': 'application/json'},
      })
      console.log(txn_metadata)
      const tx = Transaction.from(Buffer.from(txn_metadata.data.tx, 'base64'));

      const {
        context: { slot: minContextSlot },
        value: { blockhash, lastValidBlockHeight },
      } = await connection.getLatestBlockhashAndContext();

      const signature = await wallet.sendTransaction(tx, connection, {minContextSlot});
      try {
        await connection.confirmTransaction(
          { blockhash, lastValidBlockHeight, signature },
          "confirmed"
        );

        console.log("Confirming transaction...");
        toast.info("Confirming Transaction...")

        // continuous checking for txn confirmation
        let hashExpired = false;
          let txSuccess = false;
          while (!hashExpired && !txSuccess) {
              const { value: status } = await connection.getSignatureStatus(signature);
              if (status && ((status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized'))) {
                  txSuccess = true;
                  toast.success('Successfully Created Vesting Account', {
                    action: {
                      label: <a 
                      href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <ExternalLink size={16} />
                    </a>,
                      onClick: () => window.open(`https://explorer.solana.com/tx/${signature}?cluster=devnet`)
                    }
                  })
                  console.log("Vesting Account Creation Transaction confirmed");
                  break;
              }
              hashExpired = await isBlockhashExpired(connection, lastValidBlockHeight);
              if (hashExpired) {
                  break;
              }
              const sleep = (ms: number) => {
                return new Promise(resolve => setTimeout(resolve, ms));
              }
              await sleep(2500);
            }
      } catch(err){
        console.error(err);
        console.log("Unable to create vesting account")
      }

      return signature
    },
    onSuccess: (tx) => {
      console.log("Vesting Account Created Successfully!")
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
  const cluster:Cluster = "devnet"
  const { connection } = useConnection();
  const wallet = useWallet();
  const { program, vestingAccounts, employeeAccounts } = useVestingProgram()

  const getVestingAccountStateQuery = useQuery({
    queryKey: ["vesting", "fetch", "vestingAccount", { cluster, account }],
    queryFn: () => program.account.vestingAccount.fetch(account, "confirmed",),
    staleTime: 2 * 60 * 1000,
    retry: 1
  })

  const getEmployeeVestingAccountStateQuery = useQuery({
    queryKey: ["vesting", "fetch", "employeeVestingAccount", { cluster, account }],
    queryFn: () => program.account.employeeVestingAccount.fetch(account, "confirmed",),
    staleTime: 2 * 60 * 1000,
    retry: 1
  })


  const createEmployeeAccountMutation = useMutation({
    mutationKey: ['vesting', 'create_employee_vesting_account'],
    mutationFn: async({ start_time, end_time, total_allocation_amount, cliff, beneficiary }: CreateEmployeeArgs) => 
    {
          const metadata = await axios.post("http://localhost:3000/api/createEmployeeVesting", {
            start_time: start_time,
            end_time: end_time,
            total_allocation_amount: total_allocation_amount,
            cliff: cliff,
            beneficiary: beneficiary,
            account: account.toString()
          }, {
            headers: {'Content-Type': 'application/json'},
          })
          const tx = Transaction.from(Buffer.from(metadata.data.tx, 'base64'));
          const {
            context: { slot: minContextSlot },
            value: { blockhash, lastValidBlockHeight },
          } = await connection.getLatestBlockhashAndContext();

          const signature = await wallet.sendTransaction(tx, connection, {minContextSlot});
          try {
            await connection.confirmTransaction(
              { blockhash, lastValidBlockHeight, signature },
              "confirmed"
            );

            console.log("Confirming transaction...");
            toast.info("Confirming Transaction...")

            let hashExpired = false;
              let txSuccess = false;
              while (!hashExpired && !txSuccess) {
                  const { value: status } = await connection.getSignatureStatus(signature);
                  if (status && ((status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized'))) {
                      txSuccess = true;
                      toast.success('Employee Account Created', {
                        action: {
                          label: <a 
                          href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <ExternalLink size={16} />
                        </a>,
                          onClick: () => window.open(`https://explorer.solana.com/tx/${signature}?cluster=devnet`)
                        }
                      })
                      console.log("Vesting Account Creation Transaction confirmed");
                      break;
                  }
                  hashExpired = await isBlockhashExpired(connection, lastValidBlockHeight);
                  if (hashExpired) {
                      break;
                  }
                  const sleep = (ms: number) => {
                    return new Promise(resolve => setTimeout(resolve, ms));
                  }
                  await sleep(2500);
                }
          } catch(err){
            console.error(err);
            console.log("Unable to create employee vesting account")
          }

          return signature
    },
    onSuccess: (tx) => {
      console.log("Employee Vesting Account Created Successfully!")
      return vestingAccounts.refetch()
    },
    onError: () => toast.error("Failed to initialize employee account"),
  })

  const claimTokensMutation = useMutation({
    mutationKey: ['vesting', 'claim_tokens'],
    mutationFn: async () => {
      const employeeVestingAccount = await program.account.employeeVestingAccount.fetch(account); //fetching employee vesting account FROM company vesting account
      const vestingAccount = await program.account.vestingAccount.fetch(employeeVestingAccount.vestingAccount); // fetching relevant vesting account for the given employee account

      return program.methods.claimTokens(vestingAccount.companyName)
    .accounts({ 
      tokenProgram: TOKEN_PROGRAM_ID
     })
     .rpc({commitment: "confirmed"});
    },
    onSuccess: (tx) => {
      toast.success('Transaction Confirmed!', {
        action: {
          label: <a 
          href={`https://explorer.solana.com/tx/${tx}?cluster=devnet`} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-500 hover:text-blue-700"
        >
          <ExternalLink size={16} />
        </a>,
          onClick: () => window.open(`https://explorer.solana.com/tx/${tx}?cluster=devnet`)
        }
      })
      return tx
    },
    onError: () => toast.error("Failed to claim allocated tokens!"),
  })

  return {
    getVestingAccountStateQuery,
    getEmployeeVestingAccountStateQuery,
    createEmployeeAccountMutation,
    claimTokensMutation
  }
}
