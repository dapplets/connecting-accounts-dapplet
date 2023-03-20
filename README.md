<img width="1245" alt="connecting-accounts-dapplet" src="https://user-images.githubusercontent.com/43613968/225055074-ed48e91f-9bb6-4a69-a369-c5354c837b00.png">

# Connected Accounts Dapplet

This dapplet is a part of Connected Accounts service for [Dapplets].

It allows you to pair accounts of various social networks with blockchain accounts. Thus, the user can create his own network of accounts, which can be represented as a graph.

Types of links that can be created using the dapplet at the moment:

-   NEAR Testnet + Twitter
-   NEAR Testnet + GitHub

It also adds widgets to social media pages that display your connected accounts. Currently you can see them:

-   Twitter profile avatar on the profile page and on tweets
-   GitHub profile avatar on the profile page

## See also:

-   [Connected Accounts Smart Contract]
-   [Dapplets Browser Extension]

## Quick Start

Before you compile this code, you will need to install [Node.js] ≥ 12.

To run the dapplet locally, install the dependencies and run the `start` script:

```bash
npm i
npm start
```

How to use it in the browser see here: [How To Use Dapplets]

## Publishing

How to publish the dapplet on the Dapplets platphorm you can see here: [publishing]

[node.js]: https://nodejs.org/en/download/package-manager/
[connected accounts smart contract]: https://github.com/dapplets/connected-accounts-assembly
[dapplets browser extension]: https://github.com/dapplets/dapplet-extension
[publishing]: https://docs.dapplets.org/docs/publishing
[how to use dapplets]: https://docs.dapplets.org/docs/how-to-use-dapplets
[dapplets]: https://dapplets.org/
