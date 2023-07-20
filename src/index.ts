import {} from '@dapplets/dapplet-extension'
import NEAR_ICON from './icons/near_black.svg'
import NEAR_ICON_SMALL from './icons/near_black_small.svg'
import TWITTER_ICON from './icons/twitter-icon.svg'
import GITHUB_ICON from './icons/github.svg'
import ETH_ICON from './icons/eth.svg'
import { IBridge, IConnectedAccountUser, IGlobalContext, IStorage } from './types'

@Injectable
export default class ConnectingAccountsDapplet {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,  @typescript-eslint/explicit-module-boundary-types
    @Inject('twitter-config.dapplet-base.eth') public adapter: any

    // current user from twitter
    private _globalContext: IGlobalContext = {}

    async activate() {
        const defaultState: IStorage = {
            hide: true,
            connectedAccounts: null,

            // for global:
            userWebsiteId: '',
            userWebsiteFullname: '',
            websiteName: '',
            userNearId: '',
            madeRequest: false,
            systemConnectedAccountsNetwork: '',
            systemConnectedAccountsOrigin: '',
        }
        const state = Core.state(defaultState)

        state.global.systemConnectedAccountsNetwork.next(
            Core.getPreferredConnectedAccountsNetwork // ToDo: the method's appeared in 0.53.0. Remove the check after 0.55.0 will be released
                ? await Core.getPreferredConnectedAccountsNetwork()
                : 'testnet'
        )
        state.global.systemConnectedAccountsOrigin.next(
            'near/' + state.global.systemConnectedAccountsNetwork.value
        )

        const updateWebsiteUserInfo = () => {
            const user = this._globalContext
            if (!user) return
            user.username && state.global.userWebsiteId.next(user.username)
            user.fullname && state.global.userWebsiteFullname.next(user.fullname)
            user.websiteName && state.global.websiteName.next(user.websiteName)
        }

        const checkWalletConnection = async () => {
            const prevSessions = await Core.sessions()
            const prevSession = prevSessions.find(
                (x) => x.authMethod === state.global.systemConnectedAccountsOrigin.value
            )
            if (prevSession) {
                const wallet = await prevSession.wallet()
                state.global.userNearId.next(wallet.accountId)
            } else {
                state.global.userNearId.next('')
            }
        }

        updateWebsiteUserInfo()
        await checkWalletConnection()

        const login = async () => {
            try {
                const prevSessions = await Core.sessions()
                const prevSession = prevSessions.find(
                    (x) => x.authMethod === state.global.systemConnectedAccountsOrigin.value
                )
                let session =
                    prevSession ??
                    (await Core.login({
                        authMethods: [state.global.systemConnectedAccountsOrigin.value],
                        target: overlay,
                    }))
                let wallet = await session.wallet()
                if (!wallet) {
                    session = await Core.login({
                        authMethods: [state.global.systemConnectedAccountsOrigin.value],
                        target: overlay,
                    })
                    wallet = await session.wallet()
                }
                state.global.userNearId.next(wallet.accountId)
                return wallet.accountId
            } catch (err) {}
        }

        const logout = async () => {
            try {
                const sessions = await Core.sessions()
                sessions.forEach((x) => x.logout())
                state.global.userNearId.next('')
            } catch (err) {}
        }

        const getConnectedAccounts = async (accountId: string, originId: string) => {
            try {
                const connectedAccounts = await Core.connectedAccounts.getConnectedAccounts(
                    accountId,
                    originId
                )
                const accounts = connectedAccounts.map((pairs, i) =>
                    pairs.map((a) => {
                        const [name, origin1, origin2] = a.id.split('/')
                        const origin = origin2 === undefined ? origin1 : origin1 + '/' + origin2
                        const img =
                            origin1 === 'twitter'
                                ? TWITTER_ICON
                                : origin1 === 'github'
                                ? GITHUB_ICON
                                : origin1 === 'ethereum'
                                ? ETH_ICON
                                : NEAR_ICON
                        const account: IConnectedAccountUser = {
                            name,
                            img,
                            origin,
                            accountActive: a.status.isMain,
                            closeness: i + 1,
                        }
                        return account
                    })
                )
                return accounts.flat()
            } catch (err) {}
        }

        const updateUserConnectedAccounts = async (name: string) => {
            const connectedAccountsIds = await getConnectedAccounts(
                name,
                state.global?.websiteName.value.toLowerCase()
            )
            if (
                connectedAccountsIds.length !== state[name].connectedAccounts.value?.length ||
                !connectedAccountsIds.every(
                    (v, i) => v === state[name].connectedAccounts.value?.[i]
                )
            ) {
                if (!connectedAccountsIds || connectedAccountsIds.length !== 0) {
                    state[name].connectedAccounts.next(connectedAccountsIds)
                    state[name].hide.next(false)
                } else {
                    state[name].connectedAccounts.next(null)
                    state[name].hide.next(true)
                }
            }
        }

        const getPendingRequestsIds = async () => {
            try {
                return Core.connectedAccounts.getPendingRequests()
            } catch (err) {}
        }

        const getVerificationRequest = async (id: number) => {
            try {
                return Core.connectedAccounts.getVerificationRequest(id)
            } catch (err) {}
        }

        const makeConnectionRequest = (isUnlink: boolean) => async () => {
            updateWebsiteUserInfo()
            try {
                const requestId = await Core.connectedAccounts.requestVerification(
                    {
                        firstAccountId: state.global?.userWebsiteId.value,
                        firstOriginId: state.global?.websiteName.value.toLowerCase(),
                        firstAccountImage: this._globalContext.img,
                        secondAccountId: state.global?.userNearId.value,
                        secondOriginId: state.global?.systemConnectedAccountsOrigin.value,
                        secondAccountImage: null,
                        firstProofUrl:
                            `https://${state.global?.websiteName.value.toLowerCase()}.com/` +
                            state.global?.userWebsiteId.value,
                        isUnlink,
                    },
                    {
                        type: `${state.global?.websiteName.value.toLowerCase()}/near-${
                            state.global.systemConnectedAccountsNetwork.value
                        }`,
                        user: state.global?.userWebsiteFullname.value,
                    }
                )
                if (requestId === -1) return makeConnectionRequest(isUnlink)()
                return requestId
            } catch (err) {}
        }

        const connectAccounts = makeConnectionRequest(false)
        const disconnectAccounts = makeConnectionRequest(true)

        const waitForRequestResolve = async (id: number): Promise<any> => {
            try {
                const requestStatus = await Core.connectedAccounts.getRequestStatus(id)
                if (requestStatus === 'pending') {
                    await new Promise((res) => setTimeout(res, 5000))
                    return waitForRequestResolve(id)
                } else {
                    state.global.madeRequest.next(false)
                    updateAll()
                    return requestStatus
                }
            } catch (err) {}
        }

        const updateAll = async () => {
            updateWebsiteUserInfo()
            await checkWalletConnection()
            await updateUserConnectedAccounts(state.global.userWebsiteId.value)

            if (state.global.userNearId.value !== '') {
                const pendingRequestsIds = await getPendingRequestsIds()
                const requests = await Promise.all(
                    pendingRequestsIds.map((pendingRequest) =>
                        getVerificationRequest(pendingRequest)
                    )
                )
                let madeRequest = false
                let madeRequestId = -1
                const twitterId =
                    state.global.userWebsiteId.value +
                    '/' +
                    state.global?.websiteName.value.toLowerCase()
                const nearId =
                    state.global.userNearId.value +
                    '/' +
                    state.global.systemConnectedAccountsOrigin.value
                requests.forEach((request, i) => {
                    if (
                        (request.firstAccount === twitterId && request.secondAccount === nearId) ||
                        (request.secondAccount === twitterId && request.firstAccount === nearId)
                    ) {
                        madeRequest = true
                        madeRequestId = pendingRequestsIds[i]
                    }
                })
                if (state.global.madeRequest.value !== madeRequest) {
                    state.global.madeRequest.next(madeRequest)
                }
                if (madeRequest && madeRequestId !== -1) waitForRequestResolve(madeRequestId)
            }

            // ToDo: the method's appeared in 0.53.0. Remove the check after 0.55.0 will be released
            if (Core.getPreferredConnectedAccountsNetwork) {
                const currentPreferredConnectedAccountsNetwork =
                    await Core.getPreferredConnectedAccountsNetwork()
                if (
                    state.global.systemConnectedAccountsNetwork.value !==
                    currentPreferredConnectedAccountsNetwork
                ) {
                    await logout()
                    state.global.systemConnectedAccountsNetwork.next(
                        currentPreferredConnectedAccountsNetwork
                    )
                    state.global.systemConnectedAccountsOrigin.next(
                        'near/' + state.global.systemConnectedAccountsNetwork.value
                    )
                }
            }
        }

        const overlay = Core.overlay<IBridge>({
            name: 'connecting-accounts-overlay',
            title: 'Connecting Accounts',
        })
            .useState(state)
            .declare({
                login,
                logout,
                connectAccounts,
                disconnectAccounts,
                waitForRequestResolve,
                updateUserConnectedAccounts,
                updateAll,
            })

        Core.onAction(async () => {
            overlay.open()
            updateAll()
        })
        Core.onConnectedAccountsUpdate?.(updateAll)

        const { avatarBadge } = this.adapter.exports
        const addBadge =
            (context: 'POST' | 'PROFILE') => async (ctx: { authorUsername: string }) => {
                if (!ctx.authorUsername) return
                let connectedAccountsIds = state[ctx.authorUsername]?.connectedAccounts.value
                if (connectedAccountsIds === null) {
                    connectedAccountsIds = await getConnectedAccounts(
                        ctx.authorUsername,
                        state.global?.websiteName.value.toLowerCase()
                    )
                    if (!connectedAccountsIds || connectedAccountsIds.length !== 0) {
                        state[ctx.authorUsername].connectedAccounts.next(connectedAccountsIds)
                        state[ctx.authorUsername].hide.next(false)
                    }
                } else {
                    state[ctx.authorUsername].hide.next(false)
                }
                return avatarBadge({
                    DEFAULT: {
                        accounts: state[ctx.authorUsername]?.connectedAccounts,
                        showAccounts: false,
                        username: ctx.authorUsername,
                        vertical: 'bottom',
                        horizontal: 'left',
                        img: context === 'POST' ? NEAR_ICON_SMALL : NEAR_ICON,
                        basic: context === 'POST',
                        hidden: state[ctx.authorUsername]?.hide,
                        exec: (_, me) => {
                            me.showAccounts = !me.showAccounts
                        },
                    },
                })
            }
        this.adapter.attachConfig({
            GLOBAL: (global: IGlobalContext) => {
                // Save reference to the global context
                Object.assign(this._globalContext, global)
                updateWebsiteUserInfo()
            },
            PROFILE: addBadge('PROFILE'),
            POST: addBadge('POST'),
        })
    }
}
