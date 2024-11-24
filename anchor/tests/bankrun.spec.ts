import * as anchor from "@coral-xyz/anchor";
import { BankrunProvider } from "anchor-bankrun";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { BN, Program } from "@coral-xyz/anchor";
import { Connection, clusterApiUrl } from "@solana/web3.js";

import {
  startAnchor,
  Clock,
  BanksClient,
  ProgramTestContext,
} from "solana-bankrun";

import { createMint, mintTo } from "spl-token-bankrun/src/index";
import { PublicKey, Keypair } from "@solana/web3.js";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

import IDL from "../target/idl/vesting.json";
import { Vesting } from "../target/types/vesting";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";

describe("Vesting Smart Contract Tests", () => {
  const companyName = "Company";
  let beneficiary: Keypair;
  let vestingAccountKey: PublicKey;
  let treasuryTokenAccount: PublicKey;
  let employeeVestingAccount: PublicKey;
  let provider: BankrunProvider;
  let program: Program<Vesting>;
  let banksClient: BanksClient;
  let employer: Keypair;
  let mint: PublicKey;
  let beneficiaryProvider: BankrunProvider;
  let program2: Program<Vesting>;
  let context: ProgramTestContext;

  beforeAll(async () => {
    beneficiary = new anchor.web3.Keypair();

    // set up bankrun
    context = await startAnchor(
      "",
      [{ name: "vesting", programId: new PublicKey(IDL.address) }],
      [
        {
          address: beneficiary.publicKey,
          info: {
            lamports: 1_000_000_000,
            data: new Uint8Array(0),
            owner: SYSTEM_PROGRAM_ID,
            executable: false,
          },
        },
      ]
    );

    provider = new BankrunProvider(context);
    provider.connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    
    anchor.setProvider(provider);

    program = new Program<Vesting>(IDL as Vesting, provider);

    banksClient = context.banksClient;

    employer = provider.wallet.payer;

    console.log("Employer: ", employer.publicKey.toBase58())

    // Create a new mint
    // @ts-ignore
    mint = await createMint(banksClient, employer, employer.publicKey, null, 2);

    // Generate a new keypair for the beneficiary
    beneficiaryProvider = new BankrunProvider(context);
    beneficiaryProvider.wallet = new NodeWallet(beneficiary);

    program2 = new Program<Vesting>(IDL as Vesting, beneficiaryProvider);

    console.log("program_id: ", program.programId);

    // Derive PDAs
    [vestingAccountKey] = PublicKey.findProgramAddressSync(
      [Buffer.from(companyName)],
      program.programId
    );

    console.log("Vesting Account: ", vestingAccountKey);

    [treasuryTokenAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("vesting treasury"), Buffer.from(companyName)],
      program.programId
    );

    [employeeVestingAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("employee_vesting"),
        beneficiary.publicKey.toBuffer(),
        vestingAccountKey.toBuffer(),
      ],
      program.programId
    );
  });

  it("should create a vesting account", async () => {
    const tx = await program.methods
      .createVestingAccount(companyName)
      .accounts({
        signer: employer.publicKey,
        mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc({ commitment: "confirmed" });

      // Only fetch account data after confirmation
      const vestingAccountData = await program.account.vestingAccount.fetch(
          vestingAccountKey,
          "confirmed"
      );

      console.log(
          "Vesting Account Data:",
          JSON.stringify(vestingAccountData, null, 2)
      );

      console.log("create_vesting_account txn signature:", tx);
  });

  // employer(signer) -> TREASURY Token Account
  it("should fund the treasury token account", async () => {
    const amount = 10_000 * 10 ** 9;
    const mintTx = await mintTo(
      // @ts-ignores
      banksClient,
      employer,
      mint,
      treasuryTokenAccount,
      employer,
      amount
    );

    console.log("Mint to Treasury Transaction Signature:", mintTx);
  });

  it("should create an employee vesting account", async () => {
    const tx2 = await program.methods
      .createEmployeeVesting(new BN(0), new BN(2000), new BN(100), new BN(500))
      .accounts({
        beneficiary: beneficiary.publicKey,
        vestingAccount: vestingAccountKey,
      })
      .rpc({ commitment: "confirmed", skipPreflight: true });

    console.log("Create Employee Account Transaction Signature:", tx2);
    console.log("Employee account", employeeVestingAccount.toBase58());
  });

  it("should claim tokens", async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const currentClock = await banksClient.getClock();
    context.setClock(
      new Clock(
        currentClock.slot,
        currentClock.epochStartTimestamp,
        currentClock.epoch,
        currentClock.leaderScheduleEpoch,
        BigInt((new anchor.BN(1000)).toNumber())
      )
    );

    console.log("Employee account", employeeVestingAccount.toBase58());

    const tx3 = await program2.methods
      .claimTokens()
      .accounts({
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc({ commitment: "confirmed" });

    console.log("Claim Tokens transaction signature", tx3);
  });
});