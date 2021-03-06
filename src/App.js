import "./App.css";
import { providers, Contract } from "ethers";
import { useState, useEffect, useRef } from "react";
import { WHITELIST_CONTRACT_ADDRESS, abi } from "./constants";
import Web3Modal from "web3modal";

function App() {
  // This keeps track to see if the users wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);
  // joinedWhitelist keeps track of whether the current users mm address has joined the whitelist or not
  const [joinedWhitelist, setJoinedWhitelist] = useState(false);
  // loading is set to true when we are waiting for a transaction to go through
  const [loading, setLoading] = useState(false);
  // numberOfWhitelisted keeps track of the number of whitelisted addresses
  const [numberOfWhitelisted, setNumberOfWhitelisted] = useState(0);
  // Create a referece to the Web3 Modal (used when connecting to MM) which persists as long as the page is open
  const web3ModalRef = useRef();

  /**
   * Returns a Provider or Signer object representing the Ethereum RPC with or without the
   * signing capabilities of metamask attached
   *
   * A `Provider` is needed to interact with the blockchain - reading transactions, reading balances, reading state, etc.
   *
   * A `Signer` is a special type of Provider used in case a `write` transaction needs to be made to the blockchain, which involves the connected account
   * needing to make a digital signature to authorize the transaction being sent. Metamask exposes a Signer API to allow your website to
   * request signatures from the user using Signer functions.
   */

  const getProviderOrSigner = async (needSigner = false) => {
    // Connected to Metamask
    // Since "web3Modal" is stored as a reference, we need to access the 'current' value to get access to the underlying object
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // if the user is not connected to the Rinkeby network alert the user
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Please change the network to Rinkeby");
      throw new Error("Please change the network to Rinkeby");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  /**
   * addAddressToWhitelist: Adds the current connected address to the whitelist
   */
  const addAddressToWhitelist = async () => {
    try {
      // Since this is a "write" transaction we need a Signer
      const signer = await getProviderOrSigner(true);
      // Creates a new instance of the contract with a signer, which allows update methods
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        signer
      );
      // call teh addAddressToWhitelist from the contract
      const tx = await whitelistContract.addAddressToWhitelist();
      setLoading(true);
      // wait for the transaction to get mined
      await tx.wait();
      setLoading(false);
      // get the updated number of addresses in the whitelist
      await getNumberOfWhitelisted();
      setJoinedWhitelist(true);
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * getNumberOfWhitelisted:  gets the number of whitelisted addresses
   */
  const getNumberOfWhitelisted = async () => {
    try {
      // Get the provider from web3Modal, which is MM for our case
      // There is no need for a signer here as we are only reading the state fromt he blockchain
      const provider = await getProviderOrSigner();
      // We connect to the contratc using a provider so will only have read-only access to the contract
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        provider
      );
      // call the numAddressesWhitelisted from the contract
      const _numberOfWhitelisted =
        await whitelistContract.numAddressesWhitelisted();
      setNumberOfWhitelisted(_numberOfWhitelisted);
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * checkIfAddressInWhitelist: Checks if the address is in whitelist
   */
  const checkIfAddressIsWhitelist = async () => {
    try {
      // We will need the signer later to get the users address
      // Even though this is a read transaction, since the signers are just special kinds of providers we can use it in its place
      const signer = await getProviderOrSigner(true);
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        signer
      );
      // Get the address associated to the signer which is connected to MM
      const address = await signer.getAddress();
      // call the whitelistedAddresses from the contract
      const _joinedWhitelist = await whitelistContract.whitelistedAddresses(
        address
      );
      setJoinedWhitelist(_joinedWhitelist);
    } catch (err) {
      console.error(err);
    }
  };

  /*
    connectWallet: Connects the MetaMask wallet
  */
  const connectWallet = async () => {
    try {
      // get the provider from web3Modal, which in this case is MM
      // When this is used for the first time it primpts the user to connect their wallet
      await getProviderOrSigner();
      setWalletConnected(true);

      checkIfAddressIsWhitelist();
      getNumberOfWhitelisted();
    } catch (err) {
      console.error(err);
    }
  };

  /*
    renderButton: Returns a button based on the state of the dapp
  */
  const renderButton = () => {
    if (walletConnected) {
      if (joinedWhitelist) {
        return (
          <div className="description">Thanks for Joining the Whitelist!</div>
        );
      } else if (loading) {
        return <button className="button">Loading...</button>;
      } else {
        return (
          <button onClick={addAddressToWhitelist} className="button">
            Join the Whitelist
          </button>
        );
      }
    } else {
      return (
        <button onClick={connectWallet} className="button">
          Connect your wallet
        </button>
      );
    }
  };

  // UseEffects are used to react to changed in state of the website
  // The array at the end of the function call represents what state changes will trigger this effect
  // In this case, whenever the value of "walletConnected" changes this effect will be called
  useEffect(() => {
    // If the wallet is not connected then create a new instance of Web3Modal and connect the MM wallet
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting its current value
      // The current value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
    }
  }, [walletConnected]);

  return (
    <div>
      <div>
        <title>Whitelist Dapp</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="favicon.ico" />
      </div>
      <div className="main">
        <div>
          <h1 className="title">Welcome to Mudded NFT!</h1>
          <div className="description">
            Its an NFT collection for lovers of Crypto
          </div>
          <div className="description">
            {numberOfWhitelisted} have already joined the Whitelist
          </div>
          {renderButton()}
        </div>
      </div>
      <footer className="footer">Made by Ruaridh</footer>
    </div>
  );
}

export default App;
