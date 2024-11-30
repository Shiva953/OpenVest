import { NextResponse } from 'next/server';
import { Connection, Cluster, clusterApiUrl, PublicKey, Transaction } from '@solana/web3.js';
import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { Vesting, IDL } from "../../types/vesting";
import { BN } from '@coral-xyz/anchor';

export async function POST(req: Request) {
  const contentType = req.headers.get('content-type');
  
  if (!contentType || !contentType.includes('application/json')) {
    return NextResponse.json({ success: false, error: 'Content-Type must be application/json' }, { status: 400 });
  }

  const { start_time, end_time, total_allocation_amount, cliff, beneficiary, account } = await req.json();

  if (!start_time || !end_time || !beneficiary || !total_allocation_amount || !cliff || !account) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const cluster = 'devnet' as Cluster;
    const connection = new Connection(clusterApiUrl(cluster), "confirmed");
    const beneficiaryPubKey = new PublicKey(beneficiary);
    const wall = { publicKey: beneficiaryPubKey } as anchor.Wallet;
    const provider = new AnchorProvider(connection, wall);
    
    const programId = new PublicKey("H9koFdC9FyMzhQLj9roL8yUpnwiAMdmm8aYPg2zrULJ8");
    anchor.setProvider(provider);
    const program = new Program<Vesting>(IDL as Vesting, provider);

    const ixn = await program.methods.createEmployeeVesting(new BN(start_time), new BN(end_time), new BN(total_allocation_amount), new BN(cliff))
    .accounts({ 
        beneficiary: new PublicKey(beneficiary),
        vestingAccount: new PublicKey(account),
       })
    .instruction()


    const tx = new Transaction();
    tx.add(ixn);

    const { blockhash } = await connection.getLatestBlockhash();
    tx.feePayer = new PublicKey(beneficiary);
    tx.recentBlockhash = blockhash;

    const serializedTx = tx.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    }).toString('base64')

    console.log("Employee Vesting Account Tx signature: ", serializedTx);
    
    return NextResponse.json(
      { 
        success: true,
        tx: serializedTx
      });
  } catch (error) {
    console.error('Employee Vesting account creation error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}