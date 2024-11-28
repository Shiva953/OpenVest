import { Connection, PublicKey } from '@solana/web3.js';
import { MintLayout } from '@solana/spl-token';

/**
   * Function to get token details
   * @param {Connection} connection - Connection to the Solana network
   * @param {string} tokenMintAddress - Address of the token's mint
   * @returns {Object} - Token details { name, symbol, decimals }
 */
export async function getDecimalsAndSupplyToken(solanaConnection: Connection, tokenMintAddress: string) {
  let mintPublicKey;
  let mintAccountInfo;

  try {
    mintPublicKey = new PublicKey(tokenMintAddress);
  } catch (error) {
    console.error(`mintPublicKey: `, error);
    return null;
  }


  try {
    // Get information about the mint account
    // mintAccountInfo = await solanaConnection.getParsedAccountInfo(mintPublicKey);
    mintAccountInfo = await solanaConnection.getAccountInfo(mintPublicKey);
    // console.log(`mintAccountInfo`);
    // console.log(mintAccountInfo.value.data);
    // console.log(mintAccountInfo.value.data.parsed);
  } catch (error) {
    console.error(`mintAccountInfo: `, error);
    return null;
  }
  // console.log(mintAccountInfo.data.length);
  // console.log(AccountLayout.span);

  let decodedData;
  try {
    // Decode the mint data using the SPL Token layout
     decodedData = MintLayout.decode(mintAccountInfo!.data);
    // console.log(decodedData);
  } catch (error) {
    console.error(`decodedData:`, error);
    return null;
  }
  const supply = decodedData.supply;
  const decimals = decodedData.decimals;
  console.log(supply);
  console.log(decimals);
  return {  supply, decimals };
}
