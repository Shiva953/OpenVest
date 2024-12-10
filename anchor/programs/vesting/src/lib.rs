#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
use anchor_spl::token_interface;

declare_id!("4hUjTX1c16Cibcnmoz5f1R437MN73YMoMz9E7VQbePSV");

#[program]
pub mod vesting {
    use super::*;

    pub fn create_vesting_account(ctx: Context<CreateVestingAccount>, company_name: String) -> Result<()> {
      //THIS SHOULD CREATE AN ONCHAIN VESTING ACCOUNT(AND TREASURY TOKEN ACCOUNT ALONG WITH IT)
      // THAT MEANS CALLING SYSTEM PROGRAM CREATE ACCOUNT IXN AND PASSING THE REQUIRED ACCOUNTS

      //HERE, we INITIALIZE the DATA of the vesting account(of the format defined in VestingAccount struct) with the Accounts included in CreateVestingAccount
        // ctx.accounts.vesting_account.company_name = company_name;
        // ctx.accounts.vesting_account.owner = ctx.accounts.signer.key();
        // ctx.accounts.vesting_account.mint = ctx.accounts.mint.key();
        // ctx.accounts.vesting_account.treasury_token_account = ctx.accounts.treasury_token_account.key();
        // ctx.accounts.vesting_account.bump_treasury = ctx.bumps.treasury_token_account;
        // ctx.accounts.vesting_account.bump = ctx.bumps.vesting_account;
        *ctx.accounts.vesting_account = VestingAccount {
          owner: ctx.accounts.signer.key(),
          mint: ctx.accounts.mint.key(),
          treasury_token_account: ctx.accounts.treasury_token_account.key(),
          company_name,
          bump_treasury: ctx.bumps.treasury_token_account,
          bump: ctx.bumps.vesting_account,
      };
        // let mint = &ctx.accounts.mint;
        // let treasury_token_account = &ctx.accounts.treasury_token_account;
        //CPI to system program create account instruction and then transferring ownership to ___?
        Ok(())
    }

    pub fn create_employee_vesting(ctx: Context<CreateEmployeeVestingAccount>,start_time: i64, end_time: i64, token_allocation_amount: i64, cliff: i64, benef: Pubkey) -> Result<()> {
      // 1. ADD EMPLOYEE, INITIALIZE VESTING SCHEDULE + INITIALIZE EMPLOYEE TOKEN ACCOUNT
      // 2. TAKE START,END,CLIFF PERIOD AND TOKEN ALLOCATION FOR CREATING THE EMPLOYEE TOKEN ACCOUNT AND SETTING ITS STATE
      // 3. ENABLE FINALLY CREATING THE VESTING
      // *ctx.accounts.beneficiary.key() = benef;

      if ctx.accounts.beneficiary.key() != benef.key() {
        return Err(ErrorCodeCustom::InvalidBeneficiary.into());
      }

      *ctx.accounts.employee_vesting_account = EmployeeVestingAccount{
        beneficiary: benef.key(),
        token_allocation_amount,
        withdrawn_amount: 0,
        vesting_account: ctx.accounts.vesting_account.key(),
        start_time,
        end_time,
        cliff,
        bump: ctx.bumps.employee_vesting_account,
      };

      // HOW DO YOU ACTUALLY INITIALIZE THE VESTING SCHEDULE?
      // IT WOULD MEAN LOCKING THE TREASURY ACCOUNT FOR GIVEN CLIFF & EMPLOYEE BEING ABLE TO CLAIM AFTER CLIFF

      // TRASNFER TOKENS FROM EMPLOYER TA TO TREASURY TOKEN ACCOUNT -> LOCK TREASURY TOKEN ACCOUNT(ASSOCIATED WITH IX1) -> UNLOCK AFTER CLIFF PERIOD ENDS
      // what does LOCKING mean?
      // BASICALLY, AIRDROP TO EMPLOYEE ONLY HAPPENS AFTER CLIFF PERIOD ENDS, SOL IS TRANSFERED BTW TAs and Program Initiates that txn
      
      Ok(())
    }

    pub fn claim_tokens(ctx: Context<ClaimTokens>, _company_name: String) -> Result<()> {
      //1. ALLOW GIVEN EMPLOYEE TO UNLOCK THE TOKENS + CLAIM ALL (UNLOCKED) VESTED TOKENS.
      // EMPLOYER TA -> TREASURY TOKEN ACCOUNT
      // LET IT REMAIN FOR CLIFF PERIOD, ON CLIFF ENDING TRANSFER FROM TREASURY TA -> EMPLOYEE TA
      // TREASURY TOKEN ACCOUNT -> EMPLOYEE TOKEN ACCOUNT TRANSFER OF ALLOCATED TOKENS

      let treasury_token_account = &ctx.accounts.treasury_token_account;
      let employee_token_account = &ctx.accounts.employee_token_account;
      // let employee_vesting_account = &ctx.accounts.employee_vesting_account;
      let vesting_account = &ctx.accounts.vesting_account;
      let withdrawn_amount = ctx.accounts.employee_vesting_account.withdrawn_amount;

      let now = Clock::get()?.unix_timestamp;

      // start_time: after this time, token vesting starts
      // cliff: UNTIL this time, tokens are LOCKED
      // after cliff: tokens are unlocked and claimable
      // tokens will vest gradually till the end_time
      // end_time: tokens are claimable UPTO THIS PERIOD, AFTER THIS NO TOKENS REMAIN TO BE CLAIMED
      let cliff = ctx.accounts.employee_vesting_account.cliff; //HERE, CLIFF IS A EXACT TIME AFTER WHICH UNLOCKING STARTS, NOT A PERIOD(PERIOD = THIS_CLIFF_TIME - START_TIME)
      let start_time = ctx.accounts.employee_vesting_account.start_time;
      let end_time = ctx.accounts.employee_vesting_account.end_time;

      let total_allocation_amount = ctx.accounts.employee_vesting_account.token_allocation_amount;
      //first,create the treasury token acccount & employee token account

      if now < start_time {
        return Err(ErrorCodeCustom::VestingNotStarted.into());
      }
      if now < cliff{
        // EMPLOYEE CANNOT CLAIM DURING THIS PERIOD, TOKENS REMAINED LOCKED IN TREASURY TOKEN ACCOUNT
        return Err(ErrorCodeCustom::ClaimNotAvailableYet.into());
      }
      if now > end_time {
        return Err(ErrorCodeCustom::NothingToClaim.into());
      }
      // this part would only run for cliff_time < current_time(now) < end_time
        // you have to vest this transfer over a period of time
        // Calculate vested amount based on linear vesting
        let total_vesting_duration = end_time.saturating_sub(start_time);
        let time_since_start = now.saturating_sub(start_time);
        let vested_amount = if now >= end_time{
          total_allocation_amount as u64
        } else {
        (total_allocation_amount as u64)
            .checked_mul(time_since_start as u64)
            .unwrap()
            .checked_div(total_vesting_duration as u64)
            .unwrap()
        }
            ;
          // claimable = amount vested - amount withdrawn
          let claimable_amount = vested_amount.saturating_sub(withdrawn_amount as u64);
          print!("{}", claimable_amount);

          if claimable_amount == 0 {
            return Err(ErrorCodeCustom::NothingToClaim.into());
          }

          let cpi_accounts = token_interface::TransferChecked{
            from: treasury_token_account.to_account_info().clone(),
            mint: ctx.accounts.mint.to_account_info().clone(),
            to: employee_token_account.to_account_info().clone(),
            // you need the authority that can sign for transfers from the treasury_token_account
            // the vesting_account controls the treasury_token_account, therefore it should be the authority
            authority: ctx.accounts.treasury_token_account.to_account_info().clone(),
          };
          let cpi_program = ctx.accounts.token_program.to_account_info().clone();
          // this is required because you're signing with a PDA
          //actually PDAs cant sign txns on their own. This txn is signed by this owning program, and the seeds are just to prove the PDAs

          // the seeds of the treasury token account
          let signer_seeds: &[&[&[u8]]] = &[&[
            b"vesting treasury",
            ctx.accounts.vesting_account.company_name.as_ref(),
            &[ctx.accounts.vesting_account.bump_treasury],
          ],];
          let decimals = ctx.accounts.mint.decimals;
          token_interface::transfer_checked(CpiContext::new(cpi_program, cpi_accounts).with_signer(signer_seeds), claimable_amount, decimals)?;
          ctx.accounts.employee_vesting_account.withdrawn_amount += claimable_amount as i64;
      // }

      Ok(())
    }
}

// The #[account] attribute is applied to structs representing the data structure of a Solana account.
// ANY account declared using #[account] attribute withing a program is OWNED by THAT Program.

#[derive(Accounts)]
#[instruction(company_name: String)]
pub struct CreateVestingAccount<'info> {
    // this account would be required for the initialization of vesting_account
    // lamports would be deducted from the signer account(balance changes), hence it must be mutable
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init, // creates the account via a CPI to the system program and initializes it (sets its account discriminator)
        space = 8 + VestingAccount::INIT_SPACE, // space required by the account(in bytes) allocated onchain to store the account
        payer = signer,
        seeds = [company_name.as_ref()],
        bump,
    )]
    pub vesting_account: Account<'info, VestingAccount>, //deserializes the vesting account data in the form of VestingAccount struct defined below

    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        init,
        token::mint = mint,
        token::authority = treasury_token_account,
        payer = signer,
        seeds = [b"vesting treasury", company_name.as_bytes()],
        bump,
    )]
    pub treasury_token_account: InterfaceAccount<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
// #[instruction(benef: Pubkey)]
pub struct CreateEmployeeVestingAccount<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    pub beneficiary: SystemAccount<'info>,
  //   #[account(
  //     // Add an explicit check to ensure the signer is the vesting account owner
  //     constraint = vesting_account.owner == owner.key()
  // )]
    #[account(has_one = owner)]
    pub vesting_account: Account<'info, VestingAccount>,
    #[account(
        init,
        space = 8 + EmployeeVestingAccount::INIT_SPACE,
        payer = owner,
        seeds = [b"employee_vesting", beneficiary.key().as_ref(), vesting_account.key().as_ref()],
        bump
    )]
    pub employee_vesting_account: Account<'info, EmployeeVestingAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(company_name: String)]
pub struct ClaimTokens<'info> {
    #[account(mut)]
    pub beneficiary: Signer<'info>,

    //by having `has_one` constraint, its checking if its the same employee account passed in create_employee_vesting ixn
    #[account(
        mut,
        seeds = [b"employee_vesting", beneficiary.key().as_ref(), vesting_account.key().as_ref()],
        bump = employee_vesting_account.bump,
        has_one = beneficiary,
        has_one = vesting_account
    )]
    pub employee_vesting_account: Account<'info, EmployeeVestingAccount>,

    #[account(
        mut,
        seeds = [company_name.as_ref()],
        bump = vesting_account.bump,
        has_one = treasury_token_account,
        has_one = mint
    )]
    pub vesting_account: Account<'info, VestingAccount>,

    pub mint: InterfaceAccount<'info, Mint>,

    #[account(mut)]
    pub treasury_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = beneficiary,
        associated_token::mint = mint,
        associated_token::authority = beneficiary,
        associated_token::token_program = token_program
    )]
    pub employee_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace, Debug)]
pub struct VestingAccount {
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub treasury_token_account: Pubkey,
    #[max_len(100)]
    pub company_name: String,
    pub bump_treasury: u8,
    pub bump: u8,
}

#[account]
#[derive(InitSpace, Debug)]
pub struct EmployeeVestingAccount{
  pub beneficiary: Pubkey,
  pub token_allocation_amount: i64,
  pub withdrawn_amount: i64,
  pub vesting_account: Pubkey,
  pub start_time: i64,
  pub end_time: i64,
  pub cliff: i64,
  pub bump: u8,
}

#[error_code]
pub enum ErrorCodeCustom {
    #[msg("Vesting Hasn't started yet.")]
    VestingNotStarted,
    #[msg("Claiming is not available yet.")]
    ClaimNotAvailableYet,
    #[msg("There is nothing to claim.")]
    NothingToClaim,
    #[msg("Invalid Beneficiary Key Provided")]
    InvalidBeneficiary,
}