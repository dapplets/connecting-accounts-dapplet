import React, { useState } from "react";
import Bridge, { IDappStateProps } from "@dapplets/dapplet-overlay-bridge";
import { IBridge, IStorage } from "./types";
import Form from "./Form";
import { cutString } from "./helpers/cutString";

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

  const handleUpdate = async (e: any) => {
    e.preventDefault();
    setIsWaiting(true);
    await bridge.updateAll();
    setIsWaiting(false);
  };

  const makeRequest = (requestFn: () => Promise<number>) => async (e: any) => {
    e.preventDefault();
    setIsWaiting(true);
    const requestId = await requestFn();
    if (requestId >= 0) {
      changeSharedState?.({ madeRequest: true });
      await bridge.waitForRequestResolve(requestId);
    }
    await bridge.updateAll();
    setIsWaiting(false);
  };

  const handleConnectAccounts = makeRequest(bridge.connectAccounts);
  const handleDisconnectAccounts = makeRequest(bridge.disconnectAccounts);

  const addForm = () => {
    if (sharedState.global.userWebsiteId === "") {
      return (
        <Form title="Connecting Accounts" loading={isWaiting}>
          <p>
            To connect or disconnect your accounts, you need to be logged into{" "}
            {sharedState.global.websiteName}.
          </p>
        </Form>
      );
    }
    if (sharedState.global.userNearId === "") {
      return (
        <Form
          title="Start connection"
          buttonLabel="Login"
          action={handleLogIn}
          loading={isWaiting}
        >
          <p>
            To connect{" "}
            <b>
              {sharedState.global.websiteName === "Twitter" ? "@" : ""}
              {sharedState.global.userWebsiteId}
            </b>{" "}
            to some NEAR wallet you need to log in
          </p>
        </Form>
      );
    }
    if (sharedState.global.madeRequest) {
      return (
        <Form
          title="Processing"
          buttonLabel="Log out"
          action={handleLogOut}
          loading={true}
        >
          <p>
            The Oracle needs some time to verifiy your account. Check the status
            in your list of connected accounts
          </p>
        </Form>
      );
    }
    const hasWebsiteIdNearId = sharedState[
      sharedState.global.userWebsiteId
    ]?.connectedAccounts
      ?.filter((x) => x.closeness === 1)
      ?.map((x) => x.name)
      .includes(sharedState.global.userNearId);
    if (hasWebsiteIdNearId) {
      return (
        <Form
          title="Your accounts are linked"
          buttonLabel="Disconnect accounts"
          action={handleDisconnectAccounts}
          buttonLabel2="Log out"
          action2={handleLogOut}
          loading={isWaiting}
        >
          <p>
            You have already connected{" "}
            <b>
              {sharedState.global.websiteName === "Twitter" ? "@" : ""}
              {sharedState.global.userWebsiteId}
            </b>{" "}
            to{" "}
            <b>
              {sharedState.global.userNearId.length > 40
                ? cutString(sharedState.global.userNearId)
                : sharedState.global.userNearId}
            </b>
            . You can disconnect these accounts or log in with another NEAR
            wallet
          </p>
        </Form>
      );
    }
    return (
      <Form
        title="Start connection"
        buttonLabel="Connect accounts"
        action={handleConnectAccounts}
        buttonLabel2="Log out"
        action2={handleLogOut}
        loading={isWaiting}
      >
        <p>
          You can connect{" "}
          <b>
            {sharedState.global.websiteName === "Twitter" ? "@" : ""}
            {sharedState.global.userWebsiteId}
          </b>{" "}
          to{" "}
          <b>
            {" "}
            {sharedState.global.userNearId.length > 40
              ? cutString(sharedState.global.userNearId)
              : sharedState.global.userNearId}
          </b>
        </p>
      </Form>
    );
  };

  return (
    sharedState &&
    !!sharedState.global && <div className="container">{addForm()}</div>
  );
};
