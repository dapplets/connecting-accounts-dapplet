export type Account = {
    id: string
    status: {
        isMain: boolean
    }
}

export interface IStorage {
    hide: boolean
    connectedAccounts: IConnectedAccountUser[]

    // for global:
    userWebsiteId: string
    userWebsiteFullname: string
    websiteName: string
    userNearId: string
    madeRequest: boolean
    systemConnectedAccountsNetwork: 'mainnet' | 'testnet' | ''
    systemConnectedAccountsOrigin: string
}

export interface IBridge {
    login: () => Promise<string | null>
    logout: () => Promise<void>
    connectAccounts: () => Promise<number>
    disconnectAccounts: () => Promise<number>
    waitForRequestResolve: (id: number) => Promise<'not found' | 'approved' | 'rejected'>
    updateUserConnectedAccounts: (name: string) => Promise<void>
    updateAll: () => Promise<void>
}

export interface IConnectedAccountUser {
    img: string
    name: string
    origin: string
    accountActive: boolean
    closeness: number
}

export interface IGlobalContext {
    username?: string
    fullname?: string
    img?: string
    websiteName?: 'GitHub' | 'Twitter'
}

export type TConnectedAccountsVerificationRequestInfo = {
    firstAccount: string
    secondAccount: string
    isUnlink: boolean
    firstProofUrl: string
    secondProofUrl: string
    transactionSender: string
}

export type CARequestStatus = 'not found' | 'pending' | 'approved' | 'rejected'
