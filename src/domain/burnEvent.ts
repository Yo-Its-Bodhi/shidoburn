export type BurnTier = 'micro' | 'small' | 'medium' | 'large' | 'whale'

export interface BurnEvent {
  id: string
  transactionHash: string
  blockNumber: number
  timestamp: number
  sender: string
  burnAmount: number
  burnTier: BurnTier
  explorerURL: string
  source: 'simulation' | 'shido'
}

export interface RawBurnEvent {
  transactionHash: string
  blockNumber: number
  timestamp: number
  sender: string
  burnAmount: number
  explorerURL: string
  source: BurnEvent['source']
}
