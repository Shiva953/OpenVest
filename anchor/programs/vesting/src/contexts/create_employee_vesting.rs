use anchor_lang::prelude::*;
use crate::state::{VestingAccount, EmployeeVestingAccount};


#[derive(Accounts)]
pub struct CreateEmployeeVestingAccount<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    pub beneficiary: SystemAccount<'info>,
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

impl<'info> CreateEmployeeVestingAccount<'info>{
    pub fn create_employee_vesting(&mut self, bumps: u8, start_time: i64, end_time: i64, token_allocation_amount: i64, cliff: i64) -> Result<()> {
        *self.employee_vesting_account = EmployeeVestingAccount{
            beneficiary: *self.beneficiary.key,
            token_allocation_amount,
            withdrawn_amount: 0,
            vesting_account: self.vesting_account.key(),
            start_time,
            end_time,
            cliff,
            bump: bumps,
          };

          Ok(())
    }
}