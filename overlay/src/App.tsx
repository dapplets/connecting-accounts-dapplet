import React, { useState } from 'react';
import Bridge, { IDappStateProps } from '@dapplets/dapplet-overlay-bridge';
import { IBridge, IStorage } from './types';
import Form from './Form';

export default (props: IDappStateProps<IStorage>) => {
  const [isWaiting, setIsWaiting] = useState(false);
  const { sharedState, changeSharedState } = props;
  const bridge = new Bridge<IBridge>();

  const handleLogIn = async (e: any) => {
    e.preventDefault();
    setIsWaiting(true);
    const res = await bridge.login();
    setIsWaiting(false);
  };

  const handleLogOut = async (e: any) => {
    e.preventDefault();
    setIsWaiting(true);
    const res = await bridge.logout();
    setIsWaiting(false);
  };

  const handleConnectAccounts = async (e: any) => {
    e.preventDefault();
    setIsWaiting(true);
    const requestId = await bridge.connectAccounts();
    if (requestId >= 0) {
      changeSharedState?.({ madeRequest: true });
      const result = await bridge.waitForRequestResolve(requestId);
      if (result === 'approved' && sharedState.global) {
        bridge.updateUserConnectedAccounts(sharedState.global.userTwitterId);
      }
    }
    setIsWaiting(false);
  };

  const handleDisconnectAccounts = async (e: any) => {
    e.preventDefault();
    setIsWaiting(true);
    const requestId = await bridge.disconnectAccounts();
    if (requestId >= 0) {
      changeSharedState?.({ madeRequest: true });
      const result = await bridge.waitForRequestResolve(requestId);
      if (result === 'approved' && sharedState.global) {
        bridge.updateUserConnectedAccounts(sharedState.global.userTwitterId);
      }
    }
    setIsWaiting(false);
  };

  const handleUpdate = async (e: any) => {
    e.preventDefault()
    setIsWaiting(true);
    await bridge.updateAll()
    setIsWaiting(false);
  }

  return sharedState && !!sharedState.global && (
    <div className='container'>
      {sharedState.global.userTwitterId === ''
        ? <Form
          title='Connecting Accounts'
          buttonLabel='Update'
          action={handleUpdate}
          loading={isWaiting}
        >
          <p>To start you have to sign in to Twitter</p>
        </Form>
        : sharedState.global.userNearId === ''
          ? <Form
            title='Start connection'
            buttonLabel='Login'
            action={handleLogIn}
            loading={isWaiting}
          >
            <p>To connect <b>@{sharedState.global.userTwitterId}</b> to some NEAR wallet you need to log in</p>
          </Form>
          : sharedState.global.madeRequest
            ? <Form
              title='Processing'
              buttonLabel='Log out'
              action={handleLogOut}
              loading={true}
            >
              <p>The Oracle needs some time to verifiy your account. Check the status in your list of connected accounts</p>
            </Form>
            : sharedState[sharedState.global.userTwitterId]?.connectedAccounts?.map(x => x.name).includes(sharedState.global.userNearId)
              ? <Form
                title='Your accounts are linked'
                buttonLabel='Disconnect accounts'
                action={handleDisconnectAccounts}
                buttonLabel2='Log out'
                action2={handleLogOut}
                loading={isWaiting}
              >
                <p>You have already connected <b>@{sharedState.global.userTwitterId}</b> to <b>{sharedState.global.userNearId}</b>. You can disconnect these accounts or log in with another NEAR wallet</p>
              </Form>
              : <Form
                title='Start connection'
                buttonLabel='Connect accounts'
                action={handleConnectAccounts}
                buttonLabel2='Log out'
                action2={handleLogOut}
                loading={isWaiting}
              >
                <p>You can connect <b>@{sharedState.global.userTwitterId}</b> to <b>{sharedState.global.userNearId}</b></p>
              </Form>}
    </div>
  );
};
