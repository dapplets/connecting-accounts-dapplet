export type Account = {
  id: string
  status: {
    isMain: boolean
  }
}

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
