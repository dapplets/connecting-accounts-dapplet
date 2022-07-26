import { MouseEventHandler } from 'react';

export interface IStorage {
  hide: boolean
  connectedAccounts: string[]

  // for global:
  userTwitterId: string
  userTwitterFullname: string
  userNearId: string
  madeRequest: boolean
}

export interface IBridge {
  login: () => Promise<string | null>
  logout: () => Promise<void>
  connectAccounts: () => Promise<number>
  disconnectAccounts: () => Promise<number>
  waitForRequestResolve: (id: number) => Promise<"not found" | "approved" | "rejected">
  updateUserConnectedAccounts: (name: string) => Promise<void>
}

export interface IFormProps {
  title: string
  buttonLabel: string
  action: MouseEventHandler<HTMLButtonElement>
  buttonLabel2?: string
  action2?: MouseEventHandler<HTMLButtonElement>
  loading: boolean
  children: React.ReactElement
}
