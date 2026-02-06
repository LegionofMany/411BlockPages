import { verifyMessage } from 'ethers';

/**
 * Verifies a wallet signature using the base chain.
 * @param address The wallet address to verify.
 * @param message The original message that was signed.
 * @param signature The signature to verify.
 * @returns True if the signature is valid, false otherwise.
 */
export async function verifySignature(address: string, message: string, signature: string): Promise<boolean> {
  try {
    const recoveredAddress = verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}