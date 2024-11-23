use anchor_lang::prelude::*;

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