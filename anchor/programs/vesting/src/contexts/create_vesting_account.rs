use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
use crate::state::VestingAccount;

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

impl<'info> CreateVestingAccount<'info>{
    pub fn create_vesting_account(&mut self, company_name: String, treasury_bumps: u8, bumps: u8) -> Result<()> {
        *self.vesting_account = VestingAccount {
            owner: self.signer.key(),
            mint: self.mint.key(),
            treasury_token_account: self.treasury_token_account.key(),
            company_name,
            bump_treasury: treasury_bumps,
            bump: bumps,
        };

        Ok(())
    }
}