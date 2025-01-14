import { NextResponse } from 'next/server';
import { Connection, Cluster, clusterApiUrl, PublicKey, Transaction, Keypair, Signer } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createMintToInstruction, createTransferInstruction, getAssociatedTokenAddressSync } from '@solana/spl-token';
import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { Vesting, IDL } from "../../types/vesting";
import { getDecimalsAndSupplyToken } from '@/app/lib/utils';

export async function POST(req: Request) {
  const contentType = req.headers.get('content-type');
  
  if (!contentType || !contentType.includes('application/json')) {
    return NextResponse.json({ success: false, error: 'Content-Type must be application/json' }, { status: 400 });
  }

  const { company_name, mint, signer, treasuryAmount } = await req.json();

  if (!company_name || !mint || !signer || !treasuryAmount) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const cluster = 'devnet' as Cluster;
    const connection = new Connection(clusterApiUrl(cluster), "confirmed");
    const vestingAccountOwner = new PublicKey(signer);
    const wall = { publicKey: vestingAccountOwner } as anchor.Wallet;
    const provider = new AnchorProvider(connection, wall);
    
    anchor.setProvider(provider);
    const program = new Program<Vesting>(IDL as Vesting, provider);

    const createVestingAccIxn = await program.methods.createVestingAccount(company_name)
      .accounts({ 
        signer: provider.wallet.publicKey,
        mint: new PublicKey(mint),
        tokenProgram: TOKEN_PROGRAM_ID 
      })
      .instruction();

      const sourceATA = getAssociatedTokenAddressSync(
        new PublicKey(mint),
        vestingAccountOwner
      );

      let [treasuryTokenAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("vesting treasury"), Buffer.from(company_name)],
        program.programId
      );

      let decimals = 9
      const tokenData = await getDecimalsAndSupplyToken(connection, mint);
      if(tokenData){
        decimals = tokenData.decimals;
      }

    const amount = treasuryAmount * (10**decimals);
    const transferTokensToTreasury = createTransferInstruction(
      sourceATA,
      treasuryTokenAccount,
      provider.wallet.publicKey,
      amount,
    );

    const tx = new Transaction();
    tx.add(createVestingAccIxn);
    tx.add(transferTokensToTreasury);

    const { blockhash } = await connection.getLatestBlockhash();
    const keypair = Keypair.generate();
    tx.feePayer = provider.wallet.publicKey;
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