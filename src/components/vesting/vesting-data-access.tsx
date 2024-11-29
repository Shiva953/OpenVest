'use client'

import {getVestingProgram, getVestingProgramId} from '@project/anchor'
import { useConnection, useWallet} from '@solana/wallet-adapter-react'
import {Connection, Cluster, clusterApiUrl, Keypair, PublicKey, Transaction} from '@solana/web3.js'
import {useMutation, useQuery} from '@tanstack/react-query'
import {useMemo} from 'react'
import { toast } from 'sonner'
import { isBlockhashExpired } from '@/app/lib/utils'
import {useCluster} from '../cluster/cluster-data-access'
import {useAnchorProvider} from '../solana/solana-provider'
import { ExternalLink } from 'lucide-react'
import { TOKEN_PROGRAM_ID, mintTo, createMintToInstruction } from '@solana/spl-token'
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
    queryFn: () => program.account.vestingAccount.all().then((accounts) => accounts.filter((acc) => acc.account.owner.toString() == wallet?.publicKey!.toString())),
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

      const c = cluster ?? "devnet";
      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

      const createVestingAccIxn = await program.methods.createVestingAccount(company_name)
      .accounts({ 
        signer: wallet.publicKey!,
        mint: new PublicKey(mint),
        tokenProgram: TOKEN_PROGRAM_ID
       })
       .instruction();

      let [treasuryTokenAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("vesting treasury"), Buffer.from(company_name)],
        program.programId
      );
      const amount = 10_000 * 10 ** 9;
      const mintTokensIxn = createMintToInstruction(
        new PublicKey(mint),
        treasuryTokenAccount,
        wallet.publicKey!,
        amount,
        [],
        TOKEN_PROGRAM_ID,
      )

      const tx = new Transaction();

      tx.add(createVestingAccIxn);
      tx.add(mintTokensIxn);

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
      toast.success('Successfully Created Vesting Account', {
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
  const wallet = useWallet();
  const { program, vestingAccounts, employeeAccounts } = useVestingProgram()

  const getVestingAccountStateQuery = useQuery({
    queryKey: ["vesting", "fetch", { cluster, account }],
    queryFn: () => program.account.vestingAccount.fetch(account, "confirmed",)
  })

  const getEmployeeVestingAccountStateQuery = useQuery({
    queryKey: ["vesting", "fetch", { cluster, account }],
    queryFn: () => program.account.employeeVestingAccount.fetch(account, "confirmed",)
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
      toast.success('Employee Account Created', {
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
  })

  return {
    getVestingAccountStateQuery,
    getEmployeeVestingAccountStateQuery,
    createEmployeeAccountMutation,
    claimTokensMutation
  }
}
