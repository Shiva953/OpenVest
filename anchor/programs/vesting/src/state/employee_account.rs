use anchor_lang::prelude::*;

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