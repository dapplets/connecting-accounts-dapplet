import { } from '@dapplets/dapplet-extension';
import ICON from './icons/connected-accounts.svg';
import ICON_SMALL from './icons/connected-accounts-small.svg';
import { IBridge, IStorage } from './types';

@Injectable
export default class ConnectingAccountsDapplet {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any,  @typescript-eslint/explicit-module-boundary-types
  @Inject('twitter-adapter.dapplet-base.eth') public adapter: any;

  async activate() {
    const defaultState: IStorage = {
      hide: true,
      connectedAccounts: null,

      // for global:
      userTwitterId: '',
      userTwitterFullname: '',
      userNearId: '',
      madeRequest: false
    };
    const state = Core.state(defaultState);

    const user: { username: string, fullname: string } = this.adapter.getCurrentUser();
    if (!user) return;
    state.global.userTwitterId.next(user.username);
    state.global.userTwitterFullname.next(user.fullname);

    const checkWalletConnection = async () => {
      const prevSessions = await Core.sessions();
      const prevSession = prevSessions.find(x => x.authMethod === 'near/testnet');
      if (prevSession) {
        const wallet = await prevSession.wallet();
        state.global.userNearId.next(wallet.accountId);
      } else {
        state.global.userNearId.next('');
      }
    };
    await checkWalletConnection();

    const login = async () => {
      try {
        const prevSessions = await Core.sessions();
        const prevSession = prevSessions.find(x => x.authMethod === 'near/testnet');
        let session = prevSession ?? (await Core.login({ authMethods: ['near/testnet'], target: overlay }));
        let wallet = await session.wallet();
        if (!wallet) {
          session = await Core.login({ authMethods: ['near/testnet'], target: overlay });
          wallet = await session.wallet();
        }
        state.global.userNearId.next(wallet.accountId);
        return wallet.accountId;
      } catch (err) {
        console.log('Login was denied', err);
      }
    };

    const logout = async () => {
      try {
        const sessions = await Core.sessions();
        sessions.forEach(x => x.logout());
        state.global.userNearId.next('');
      } catch (err) {
        console.log('Cannot log out.', err);
      }
    };

    const getConnectedAccounts = async (accountId: string, originId: string) => {
      try {
        const connectedAccounts = await Core.connectedAccounts.getConnectedAccounts(accountId, originId);
        const connectedAccountsIds = connectedAccounts.flat().map(a => a.id.split('/')[0]);
        return connectedAccountsIds;
      } catch (err) {
        console.log('Cannot get Connected Accounts. ERROR:', err);
      }
    };

    const updateUserConnectedAccounts = async (name: string) => {
      const connectedAccountsIds = await getConnectedAccounts(name, 'twitter');
      if (connectedAccountsIds.length !== state[name].connectedAccounts.value?.length
        || !connectedAccountsIds.every((v, i) => v === state[name].connectedAccounts.value?.[i])) {
        if ((!connectedAccountsIds || connectedAccountsIds.length !== 0)) {
          state[name].connectedAccounts.next(connectedAccountsIds);
          state[name].hide.next(false);
        } else {
          state[name].connectedAccounts.next(null);
          state[name].hide.next(true);
        }
      }
    }

    const getPendingRequestsIds = async () => {
      try {
        return Core.connectedAccounts.getPendingRequests();
      } catch (err) {
        console.log('Cannot get Pending Connecting Requests. ERROR:', err);
      }
    };

    const getVerificationRequest = async (id: number) => {
      try {
        return Core.connectedAccounts.getVerificationRequest(id);
      } catch (err) {
        console.log('Cannot get Connecting Verification Request. ERROR:', err);
      }
    };

    const makeConectionRequest = (isUnlink: boolean) => async () => {
      try {
        const requestId = await Core.connectedAccounts.requestVerification(
          {
            firstAccountId: state.global?.userTwitterId.value,
            firstOriginId: 'twitter',
            firstAccountImage: this.adapter.getCurrentUser().img,
            secondAccountId: state.global?.userNearId.value,
            secondOriginId: 'near/testnet',
            secondAccountImage: null,
            firstProofUrl: 'https://twitter.com/' + state.global?.userTwitterId.value,
            isUnlink
          },
          {
            type: 'twitter/near-testnet',
            user: state.global?.userTwitterFullname.value
          }
        );
        // console.log('+++ requestId +++', requestId);
        return requestId;
      } catch (err) {
        console.log('Cannot get Connected Accounts. ERROR:', err);
      }
    };

    const connectAccounts = makeConectionRequest(false);

    const disconnectAccounts = makeConectionRequest(true);

    const waitForRequestResolve = async (id: number): Promise<any> => {
      try {
        const requestStatus = await Core.connectedAccounts.getRequestStatus(id);
        // console.log('requestStatus:', requestStatus)
        if (requestStatus === 'pending') {
          await new Promise((res) => setTimeout(res, 5000));
          return waitForRequestResolve(id);
        } else {
          state.global.madeRequest.next(false);
          return requestStatus;
        }
      } catch (err) {
        console.log('Cannot get request status. ERROR:', err);
      }
    };

    const overlay = Core.overlay<IBridge>({ name: 'connecting-accounts-overlay', title: 'Connecting Accounts' })
      .useState(state)
      .declare({ login, logout, connectAccounts, disconnectAccounts, waitForRequestResolve, updateUserConnectedAccounts });

    Core.onAction(async () => {
      await checkWalletConnection();

      await updateUserConnectedAccounts(user.username);

      if (state.global.userNearId.value !== '') {
        const pendingRequestsIds = await getPendingRequestsIds();
        const requests = await Promise.all(pendingRequestsIds.map((pendingRequest) => getVerificationRequest(pendingRequest)));
        let madeRequest = false;
        let madeRequestId = -1;
        const twitterId = user.username + '/twitter';
        const nearId = state.global.userNearId.value + '/near/testnet';
        requests.forEach((request, i) => {
          if ((request.firstAccount === twitterId && request.secondAccount === nearId)
            || (request.secondAccount === twitterId && request.firstAccount === nearId)) {
              madeRequest = true;
              madeRequestId = pendingRequestsIds[i];
          }
        })
        if (state.global.madeRequest.value !== madeRequest) {
          state.global.madeRequest.next(madeRequest);
        }
        if (madeRequest && madeRequestId !== -1) waitForRequestResolve(madeRequestId);
      }
      
      overlay.open();
    });

    const { avatarBadge } = this.adapter.exports;
    const addBadge = (context: 'POST' | 'PROFILE') => async (ctx: { authorUsername: string }) => {
      if (!ctx.authorUsername) return;
      let connectedAccountsIds = state[ctx.authorUsername]?.connectedAccounts.value;
      if (connectedAccountsIds === null) {
        connectedAccountsIds = await getConnectedAccounts(ctx.authorUsername, 'twitter');
        if (!connectedAccountsIds || connectedAccountsIds.length !== 0) {
          state[ctx.authorUsername].connectedAccounts.next(connectedAccountsIds);
          state[ctx.authorUsername].hide.next(false);
        }
      } else {
        state[ctx.authorUsername].hide.next(false);
      }
      return avatarBadge({
        DEFAULT: {
          tooltip: state[ctx.authorUsername]?.connectedAccounts,
          vertical:	'bottom',
          horizontal:	'left',
          img: context === 'POST' ? ICON_SMALL : ICON,
          basic: context === 'POST',
          hidden: state[ctx.authorUsername]?.hide,
        },
      })
    };
    this.adapter.attachConfig({
      PROFILE: addBadge('PROFILE'),
      POST: addBadge('POST')
    });
  }
}
