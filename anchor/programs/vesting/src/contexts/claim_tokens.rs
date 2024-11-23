use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
use anchor_spl::token_interface;
use crate::state::{VestingAccount, EmployeeVestingAccount};

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

impl<'info> ClaimTokens<'info>{
    pub fn claim_tokens(&mut self, _company_name: String) -> Result<()> {
        //1. ALLOW GIVEN EMPLOYEE TO UNLOCK THE TOKENS + CLAIM ALL (UNLOCKED) VESTED TOKENS.
        // EMPLOYER TA -> TREASURY TOKEN ACCOUNT
        // LET IT REMAIN FOR CLIFF PERIOD, ON CLIFF ENDING TRANSFER FROM TREASURY TA -> EMPLOYEE TA
        // TREASURY TOKEN ACCOUNT -> EMPLOYEE TOKEN ACCOUNT TRANSFER OF ALLOCATED TOKENS
  
        let treasury_token_account = &self.treasury_token_account;
        let employee_token_account = &self.employee_token_account;
        // let employee_vesting_account = &self.accounts.employee_vesting_account;
        let vesting_account = &self.vesting_account;
        let withdrawn_amount = self.employee_vesting_account.withdrawn_amount;
  
        let now = Clock::get()?.unix_timestamp;
  
        // start_time: after this time, token vesting starts
        // cliff: UNTIL this time, tokens are LOCKED
        // after cliff: tokens are unlocked and claimable
        // tokens will vest gradually till the end_time
        // end_time: tokens are claimable UPTO THIS PERIOD, AFTER THIS NO TOKENS REMAIN TO BE CLAIMED
        let cliff = self.employee_vesting_account.cliff; //HERE, CLIFF IS A EXACT TIME AFTER WHICH UNLOCKING STARTS, NOT A PERIOD(PERIOD = THIS_CLIFF_TIME - START_TIME)
        let start_time = self.employee_vesting_account.start_time;
        let end_time = self.employee_vesting_account.end_time;
  
        let total_allocation_amount = self.employee_vesting_account.token_allocation_amount;
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
              mint: self.mint.to_account_info().clone(),
              to: employee_token_account.to_account_info().clone(),
              // you need the authority that can sign for transfers from the treasury_token_account
              // the vesting_account controls the treasury_token_account, therefore it should be the authority
              authority: self.treasury_token_account.to_account_info().clone(),
            };
            let cpi_program = self.token_program.to_account_info().clone();
            // this is required because you're signing with a PDA
            //actually PDAs cant sign txns on their own. This txn is signed by this owning program, and the seeds are just to prove the PDAs
  
            // the seeds of the treasury token account
            let signer_seeds: &[&[&[u8]]] = &[&[
              b"vesting treasury",
              self.vesting_account.company_name.as_ref(),
              &[self.vesting_account.bump_treasury],
            ],];
            let decimals = self.mint.decimals;
            token_interface::transfer_checked(CpiContext::new(cpi_program, cpi_accounts).with_signer(signer_seeds), claimable_amount, decimals)?;
            self.employee_vesting_account.withdrawn_amount += claimable_amount as i64;
        // }
  
        Ok(())
      }
  }

  #[error_code]
pub enum ErrorCodeCustom {
    #[msg("Vesting Hasn't started yet.")]
    VestingNotStarted,
    #[msg("Claiming is not available yet.")]
    ClaimNotAvailableYet,
    #[msg("There is nothing to claim.")]
    NothingToClaim,
}
