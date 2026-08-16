export function formatCurrency(amount: number): string {
  return `Rs ${amount.toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}