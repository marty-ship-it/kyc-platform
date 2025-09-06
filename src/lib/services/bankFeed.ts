interface BankTransaction {
  date: string
  transactionType: string
  amount: number
  currency: string
  direction: 'IN' | 'OUT'
  counterparty: string
  method: 'BANK' | 'CASH' | 'CARD'
  reference: string
  crossBorder: boolean
}

const mockTransactions: BankTransaction[] = [
  {
    date: '2024-01-15',
    transactionType: 'DEPOSIT',
    amount: 1200000,
    currency: 'AUD',
    direction: 'IN',
    counterparty: 'James Chen Trust Account',
    method: 'BANK',
    reference: 'Property Settlement - 12 Seaview Rd',
    crossBorder: false
  },
  {
    date: '2024-01-10',
    transactionType: 'DEPOSIT',
    amount: 50000,
    currency: 'AUD',
    direction: 'IN',
    counterparty: 'Coastal Realty Trust',
    method: 'BANK',
    reference: 'Initial Deposit',
    crossBorder: false
  },
  {
    date: '2024-01-08',
    transactionType: 'DEPOSIT',
    amount: 25000,
    currency: 'AUD',
    direction: 'IN',
    counterparty: 'International Investment Group',
    method: 'BANK',
    reference: 'Foreign Investment',
    crossBorder: true
  }
]

export class BankFeedClient {
  static async importTransactions(): Promise<BankTransaction[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    return mockTransactions
  }

  static async getBalance(): Promise<{ balance: number; currency: string; asAt: string }> {
    return {
      balance: 2500000,
      currency: 'AUD',
      asAt: new Date().toISOString()
    }
  }
}