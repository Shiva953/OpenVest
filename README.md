## OpenVest
Openvest allows you to create vested token allocations for company employees. A company can create its on-chain treasury account, and use that to create vested token allocations for its employees. 

## Features
- Create Treasury Account for the Company, with desired token and amount of tokens to lock in treasury
- Use the Company Account to create vested token allocations for its employees
- Company Owner can choose start date & time, end time, cliff period(the duration for which tokens are locked) and the beneficiary(employee)
- Employee can claim their allocation after the cliff period ends with entire allocation claimable only during the end time

  
## How it works
It follows a Linear Vesting Schedule.


## Program Implementation
The core functionality is implemented in Rust using the Anchor framework:
- `create_vesting_account`: Creates the company vesting account along with the associated `treasury account`(which would contain the total amount of tokens)
  
- `create_employee_vesting`: Creates the employee vesting account with given `start time`, `end time`, and `cliff` and `beneficiary`, along with `employee allocation`
  
- `claim_tokens`: Allows the employee to claim his allocation after the cliff period, by transfering some % of employee allocation amount of tokens from the treasury account to the employee
