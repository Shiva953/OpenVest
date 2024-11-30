// import type { NextApiRequest, NextApiResponse } from 'next'
// import { Connection, Cluster, clusterApiUrl, PublicKey, Transaction, Keypair } from '@solana/web3.js'
// import { TOKEN_PROGRAM_ID, createMintToInstruction } from '@solana/spl-token'
// import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
// import * as anchor from "@coral-xyz/anchor";
// import { Program, AnchorProvider } from "@coral-xyz/anchor";
// import { Vesting, IDL } from "../../types/vesting"
// import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
// import { Wallet } from '@coral-xyz/anchor';
// import { NextResponse } from 'next/server';

// export default async function POST(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ success: false, error: 'Method Not Allowed' });
//   }

//   try {
//     const contentType = req.headers['content-type'];
//     if (!contentType || !contentType.includes('application/json')) {
//       return res.status(400).json({ 
//         success: false, 
//         error: 'Content-Type must be application/json' 
//       });
//     }

//     const { company_name, mint, beneficiary } = req.body;
    
//     // Validate input
//     if (!company_name || !mint || !beneficiary) {
//       return res.status(400).json({ 
//         success: false, 
//         error: 'Missing required fields' 
//       });
//     }

//     const cluster = 'devnet' as Cluster
//     const connection = new Connection(clusterApiUrl(cluster), "confirmed")

//     const beneficiaryPubKey = new PublicKey(beneficiary)
//     const wall = {publicKey: beneficiaryPubKey} as anchor.Wallet
//     // const wallet = Keypair.generate()
//     const provider = new AnchorProvider(connection, wall);

//     const programId = new PublicKey("H9koFdC9FyMzhQLj9roL8yUpnwiAMdmm8aYPg2zrULJ8")

//     anchor.setProvider(provider);
//     const program = anchor.workspace.Vesting as Program<Vesting>
//     // const program = new Program<Vesting>(IDL as Vesting, provider);

//     const createVestingAccIxn = await program.methods.createVestingAccount(company_name)
//       .accounts({ 
//         signer: new PublicKey(beneficiary),
//         mint: new PublicKey(mint),
//         tokenProgram: TOKEN_PROGRAM_ID
//        })
//        .instruction()

//     let [treasuryTokenAccount] = PublicKey.findProgramAddressSync(
//       [Buffer.from("vesting treasury"), Buffer.from(company_name)],
//       program.programId
//     )

//     const amount = 10_000 * 10 ** 9
//     const mintTokensIxn = createMintToInstruction(
//       new PublicKey(mint),
//       treasuryTokenAccount,
//       new PublicKey(beneficiary),
//       amount,
//       [],
//       TOKEN_PROGRAM_ID,
//     )

//     const tx = new Transaction();
//     tx.add(createVestingAccIxn)
//     tx.add(mintTokensIxn)

//     console.log("Successful transaction: ", tx.signature?.toString())
//     return NextResponse.json({ 
//       success: true, 
//       signature: tx.signature?.toString(),
//     })
//   } catch (error) {
//     console.error('Vesting account creation error:', error)
//     return NextResponse.json({ 
//       success: false, 
//       error: error instanceof Error ? error.message : 'Unknown error' 
//     })
//   }
// }

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
    
    const programId = new PublicKey("H9koFdC9FyMzhQLj9roL8yUpnwiAMdmm8aYPg2zrULJ8");
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

    console.log("Successful transaction: ", serializedTx);
    
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