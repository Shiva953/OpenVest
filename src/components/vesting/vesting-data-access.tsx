'use client'

import {getVestingProgram, getVestingProgramId} from '@project/anchor'
import { useConnection, useWallet} from '@solana/wallet-adapter-react'
import {Connection, Cluster, clusterApiUrl, Keypair, PublicKey, Transaction} from '@solana/web3.js'
import {useMutation, useQuery} from '@tanstack/react-query'
import {useMemo} from 'react'
import { toast } from 'sonner'
import { getDecimalsAndSupplyToken, isBlockhashExpired } from '@/app/lib/utils'
import {useAnchorProvider} from '../solana/solana-provider'
import { ExternalLink } from 'lucide-react'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import axios from "axios"
import { CreateVestingArgs, CreateEmployeeArgs } from '@/types'
import { BN } from "@coral-xyz/anchor"

const endpoint = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000'
      : 'https://openvest.vercel.app';

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

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
  const vestingAccounts = useQuery({
    queryKey: ["vesting", "all", { cluster, walletPublicKey: wallet?.publicKey?.toString() }],
    queryFn: () => program.account.vestingAccount.all().then((accounts) => accounts.filter((acc) => acc.account.owner.toString() == wallet?.publicKey!.toString())),
    enabled: !!wallet?.publicKey, // Only run the query if wallet is connected
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false
  })

  // fetching all the employee vesting accounts associated with the program + a vesting account above
  const employeeAccounts = useQuery({
    queryKey: ['employeeVestingAccounts', {cluster}],
    queryFn: () => program.account.employeeVestingAccount.all(),
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false
  })

  const employeeAccountsWithMetadata = useQuery({
    queryKey: ["getAllEmployeeMetadata", "fetch", "employeeVestingAccount", {cluster}],
    queryFn: async() => {
      // account = employeeAccount
      // acc -> return arr[]<start date, end date, token mint, cliff, company name, total_allocation, withdrawn_amount>
      // return an arr directly to the frontend instead of rendering this for each component
      const ecc = await program.account.employeeVestingAccount.all()
      const list = ecc.map(async(a) => {
        const associatedVestingAccount = a.account.vestingAccount;
        const employeeAccount = a.publicKey;
        const vestingAccountData = await program.account.vestingAccount.fetch(associatedVestingAccount, "confirmed");
        const ownerOfVestingAccountForGivenEmployee = vestingAccountData.owner || new PublicKey('CUdHPZyyuMCzBJEgTZnoopxhp9zjp1pog3Tgx2jEKP7E');
        const mint = vestingAccountData.mint || new PublicKey('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr');
        const beneficiary = a.account.beneficiary || new PublicKey('CUdHPZyyuMCzBJEgTZnoopxhp9zjp1pog3Tgx2jEKP7E');
        const token_mint = mint.toString() || 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr';
        const companyName = vestingAccountData.companyName || 'CompanyNotFound';
        const total_allocation_amount = a.account.tokenAllocationAmount || 0;
        const withdrawn_amount = a.account.withdrawnAmount || new BN(0);
        const cliff_time = a.account.cliff || new BN(0);
        const start_time = a.account.startTime || new BN(0);
        const end_time = a.account.endTime || new BN(0);
        const cliff = ((cliff_time.sub(start_time)).toNumber())/60;
        const { decimals } = (await getDecimalsAndSupplyToken(new Connection(clusterApiUrl("devnet"), "confirmed"), token_mint)) || {supply: 0, decimals: 9}
        const actualTotalAllocationAmount = Math.floor(total_allocation_amount?.toNumber() /(10**decimals));
        const actualWithdrawnAmount = Math.floor(withdrawn_amount?.toNumber() /(10**decimals));
        const obj = {
          employeeAccount: employeeAccount,
          ownerOfVestingAccountForGivenEmployee: ownerOfVestingAccountForGivenEmployee.toString(),
          start_time: start_time,
          end_time: end_time,
          cliff: cliff,
          total_allocation_amount: total_allocation_amount,
          withdrawn_amount: withdrawn_amount,
          actualTotalAllocationAmount: actualTotalAllocationAmount,
          actualWithdrawnAmount: actualWithdrawnAmount,
          beneficiary: beneficiary.toString(),
          companyName: companyName,
          token_mint: token_mint,
        }
        return obj
      })
      const res = await Promise.all(list)
      return res;
    },
  })


  // create vesting account TXN
  const createVestingAccountMutation = useMutation({
    mutationKey: ["vestingAccount", "create", { cluster }],
    mutationFn: async({ company_name, mint, treasuryAmount }: CreateVestingArgs) => {
      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

      const apiEndpoint = `${endpoint}/api/createCompanyVesting`

      const txn_metadata = await axios.post(apiEndpoint, {
        company_name: company_name,
        mint: mint,
        signer: wallet.publicKey?.toString()!,
        treasuryAmount: treasuryAmount,
      }, {
        headers: {'Content-Type': 'application/json'},
      })
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
    employeeAccountsWithMetadata,
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
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false
  })

  const getVestingAccountForGivenEmployeeAccount = useQuery({
    queryKey: ['vestingAccountForGivenEmployee', { cluster, account }],
    queryFn: async() => 
      {
        const acc = await program.account.employeeVestingAccount.fetch(account, "confirmed");
        return program.account.vestingAccount.fetch(acc.vestingAccount, "confirmed")
      },
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false
  })

  const getEmployeeVestingAccountStateQuery = useQuery({
    queryKey: ["vesting", "fetch", "employeeVestingAccount", { cluster, account }],
    queryFn: () => program.account.employeeVestingAccount.fetch(account, "confirmed"),
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false
  })

  const createEmployeeAccountMutation = useMutation({
    mutationKey: ['vesting', 'create_employee_vesting_account'],
    mutationFn: async({ start_time, end_time, total_allocation_amount, cliff, beneficiary }: CreateEmployeeArgs) => 
    {
          const apiEndpoint = `${endpoint}/api/createEmployeeVesting`
          const metadata = await axios.post(apiEndpoint, {
            start_time: start_time,
            end_time: end_time,
            total_allocation_amount: total_allocation_amount,
            cliff: cliff,
            beneficiary: beneficiary,
            account: account.toString(),
            signer: wallet.publicKey?.toString(),
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
    getVestingAccountForGivenEmployeeAccount,
    getEmployeeVestingAccountStateQuery,
    createEmployeeAccountMutation,
    claimTokensMutation
  }
}
