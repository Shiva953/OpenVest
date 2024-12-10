import { NextResponse } from 'next/server';
import { Connection, Cluster, clusterApiUrl, PublicKey, Transaction, Keypair, Signer } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createMintToInstruction } from '@solana/spl-token';
import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { Vesting, IDL } from "../../types/vesting";

export async function POST(req: Request) {
  const contentType = req.headers.get('content-type');
  
  if (!contentType || !contentType.includes('application/json')) {
    return NextResponse.json({ success: false, error: 'Content-Type must be application/json' }, { status: 400 });
  }

  const { company_name, mint, beneficiary } = await req.json();

  // Validate input
  if (!company_name || !mint || !beneficiary) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const cluster = 'devnet' as Cluster;
    const connection = new Connection(clusterApiUrl(cluster), "confirmed");
    const beneficiaryPubKey = new PublicKey(beneficiary);
    const wall = { publicKey: beneficiaryPubKey } as anchor.Wallet;
    const provider = new AnchorProvider(connection, wall);
    
    anchor.setProvider(provider);
    // const program = anchor.workspace.Vesting as Program<Vesting>;
    const program = new Program<Vesting>(IDL as Vesting, provider);

    const createVestingAccIxn = await program.methods.createVestingAccount(company_name)
      .accounts({ 
        signer: beneficiaryPubKey,
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
      beneficiaryPubKey,
      amount,
      [],
      TOKEN_PROGRAM_ID,
    );

    const tx = new Transaction();
    tx.add(createVestingAccIxn);
    tx.add(mintTokensIxn);

    const { blockhash } = await connection.getLatestBlockhash();
    const keypair = Keypair.generate();
    tx.feePayer = new PublicKey(beneficiary);
    tx.recentBlockhash = blockhash;

    // tx.partialSign(keypair);

    const serializedTx = tx.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    }).toString('base64')
    
    return NextResponse.json(
      { 
        success: true,
        tx: serializedTx
      });
  } catch (error) {
    console.error('Vesting account creation error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}