export function formatTokenBalance(balance: bigint | undefined | null, decimals: number | undefined | null): string {
  if (!balance || !decimals) return '0';

  try {
    const divisor = BigInt(10) ** BigInt(decimals);
    const wholePart = balance / divisor;
    const fractionalPart = balance % divisor;
    
    // Convert to string and pad with leading zeros
    const fractionalStr = fractionalPart.toString().padStart(Number(decimals), '0');
    
    // Remove trailing zeros
    const trimmedFractional = fractionalStr.replace(/0+$/, '');
    
    // Combine whole and fractional parts
    return trimmedFractional ? `${wholePart}.${trimmedFractional}` : wholePart.toString();
  } catch (error) {
    return '0';
  }
}

export function parseTokenAmount(amount: string, decimals: number): bigint {
  console.log('Parsing token amount:', { amount, decimals });
  
  if (!amount || !decimals) {
    console.log('Invalid input, returning 0');
    return 0n;
  }

  try {
    // Remove any commas from the input
    amount = amount.replace(/,/g, '');
    
    // Split on decimal point
    const [wholePart = '0', fractionalPart = ''] = amount.split('.');
    
    // Remove any leading zeros from whole part
    const cleanWholePart = wholePart.replace(/^0+/, '') || '0';
    
    // Pad or truncate fractional part to match decimals
    const adjustedFractionalPart = fractionalPart.padEnd(decimals, '0').slice(0, decimals);
    
    // Convert whole part to base units
    const wholeInBaseUnits = BigInt(cleanWholePart) * (10n ** BigInt(decimals));
    
    // Convert fractional part to base units
    const fractionalInBaseUnits = adjustedFractionalPart ? BigInt(adjustedFractionalPart) : 0n;
    
    // Combine whole and fractional parts
    const result = wholeInBaseUnits + fractionalInBaseUnits;
    
    console.log('Token amount parsing details:', {
      originalAmount: amount,
      wholePart: cleanWholePart,
      fractionalPart,
      adjustedFractionalPart,
      wholeInBaseUnits: wholeInBaseUnits.toString(),
      fractionalInBaseUnits: fractionalInBaseUnits.toString(),
      resultInBaseUnits: result.toString(),
      decimals
    });
    
    return result;
  } catch (error) {
    console.error('Error parsing token amount:', {
      error,
      amount,
      decimals
    });
    return 0n;
  }
} 