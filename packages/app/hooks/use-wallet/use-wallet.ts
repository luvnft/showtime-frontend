import { useEffect, useMemo, useRef, useState } from "react";

import { useEmbeddedWallet, isConnected } from "@privy-io/expo";
import { createWalletClient, custom } from "viem";
import { mainnet } from "viem/chains";

import { useLatestValueRef } from "app/hooks/use-latest-value-ref";
import { useWalletMobileSDK } from "app/hooks/use-wallet-mobile-sdk";
import { useWeb3Modal } from "app/lib/react-native-web3-modal";

import { baseChain } from "../creator-token/utils";
import { useStableCallback } from "../use-stable-callback";
import { ConnectResult, UseWalletReturnType } from "./types";
import { useRandomWallet } from "./use-random-wallet";

const useWallet = (): UseWalletReturnType => {
  const walletConnectedPromiseResolveCallback = useRef<any>(null);
  const walletDisconnectedPromiseResolveCallback = useRef<any>(null);
  const web3Modal = useWeb3Modal();
  const mobileSDK = useWalletMobileSDK();
  const privyWallet = useEmbeddedWallet();
  // we use this hook to prevent stale values in closures
  const walletConnectInstanceRef = useLatestValueRef(web3Modal);
  const coinbaseMobileSDKInstanceRef = useLatestValueRef(mobileSDK);

  const isPrivyWallet = isConnected(privyWallet);
  const privyWalletClient = useMemo(() => {
    if (isConnected(privyWallet)) {
      return createWalletClient({
        chain: baseChain,
        transport: custom(privyWallet.provider),
      });
    }
  }, [privyWallet]);

  const walletConnected =
    web3Modal.isConnected || mobileSDK.connected || isPrivyWallet;
  const [address, setAddress] = useState<`0x${string}` | undefined>();

  useEffect(() => {
    (async function fetchUserAddress() {
      if (web3Modal.address) {
        setAddress(web3Modal.address as `0x${string}`);
      } else if (mobileSDK.address) {
        setAddress(mobileSDK.address as `0x${string}`);
      } else if (privyWalletClient) {
        const address = (await privyWalletClient.getAddresses())[0];
        setAddress(address);
      } else {
        setAddress(undefined);
      }
    })();
  }, [mobileSDK.address, privyWalletClient, web3Modal.address]);

  // WalletConnect connected
  useEffect(() => {
    if (
      walletConnectedPromiseResolveCallback.current &&
      web3Modal.isConnected
    ) {
      walletConnectedPromiseResolveCallback.current({
        address: web3Modal.address,
        walletName: "",
      });
      walletConnectedPromiseResolveCallback.current = null;
    }
  }, [web3Modal]);

  // Coinbase connected
  useEffect(() => {
    if (
      walletConnectedPromiseResolveCallback.current &&
      mobileSDK.connected &&
      mobileSDK.address
    ) {
      walletConnectedPromiseResolveCallback.current({
        address: mobileSDK.address,
        walletName: mobileSDK.metadata?.name,
      });
      walletConnectedPromiseResolveCallback.current = null;
    }
  }, [mobileSDK]);

  // WalletConnect disconnected
  useEffect(() => {
    if (
      walletDisconnectedPromiseResolveCallback.current &&
      !web3Modal.isConnected
    ) {
      walletDisconnectedPromiseResolveCallback.current();
      walletDisconnectedPromiseResolveCallback.current = null;
    }
  }, [web3Modal]);

  // Coinbase disconnected
  useEffect(() => {
    if (
      walletDisconnectedPromiseResolveCallback.current &&
      !mobileSDK.connected
    ) {
      walletDisconnectedPromiseResolveCallback.current();
      walletDisconnectedPromiseResolveCallback.current = null;
    }
  }, [mobileSDK]);

  const getWalletClient = useStableCallback(async () => {
    if (isPrivyWallet) {
      return privyWalletClient;
    }

    if (web3Modal.isConnected && web3Modal.provider) {
      const client = createWalletClient({
        chain: mainnet,
        transport: custom(web3Modal.provider),
      });
      return client;
    } else if (mobileSDK.connected && mobileSDK.address) {
      const MobileSDKProvider = (
        await import(
          "@coinbase/wallet-mobile-sdk/build/WalletMobileSDKEVMProvider"
        )
      ).WalletMobileSDKEVMProvider;
      const mobileSDKProvider = new MobileSDKProvider({
        jsonRpcUrl: `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_ID}`,
        address: mobileSDK.address,
      });

      const client = createWalletClient({
        chain: mainnet,
        transport: custom(mobileSDKProvider as any),
      });

      return client;
    }
  });

  const result = useMemo(() => {
    const wcConnected = web3Modal.isConnected;
    const mobileSDKConnected = mobileSDK.connected;

    let walletName: string | undefined;
    if (wcConnected) {
      walletName = "";
    } else if (mobileSDKConnected) {
      walletName = mobileSDK.metadata?.name;
    }

    return {
      address,
      connect: async () => {
        walletConnectInstanceRef.current.open();
        return new Promise<ConnectResult>((resolve) => {
          walletConnectedPromiseResolveCallback.current = resolve;
        });
      },
      disconnect: async () => {
        if (walletConnectInstanceRef.current.isConnected) {
          walletConnectInstanceRef.current.disconnect();
        }
        if (coinbaseMobileSDKInstanceRef.current.connected) {
          coinbaseMobileSDKInstanceRef.current.disconnect();
        }

        return new Promise<ConnectResult>((resolve) => {
          walletDisconnectedPromiseResolveCallback.current = resolve;
        });
      },
      name: walletName,
      connected: walletConnected,
      getWalletClient,
      signMessageAsync: async (args: { message: string }) => {
        if (
          walletConnectInstanceRef.current.isConnected &&
          walletConnectInstanceRef.current.provider &&
          walletConnectInstanceRef.current.address
        ) {
          const walletClient = createWalletClient({
            chain: mainnet,
            transport: custom(walletConnectInstanceRef.current.provider),
          });

          const signature = await walletClient.signMessage({
            account: walletConnectInstanceRef.current.address as `0x${string}`,
            message: args.message,
          });

          return signature;
        } else if (
          coinbaseMobileSDKInstanceRef.current.connected &&
          coinbaseMobileSDKInstanceRef.current.address
        ) {
          const signature =
            await coinbaseMobileSDKInstanceRef.current.personalSign(
              args.message,
              coinbaseMobileSDKInstanceRef.current.address
            );
          return signature;
        }
      },
    };
  }, [
    web3Modal.isConnected,
    mobileSDK.connected,
    mobileSDK.metadata?.name,
    walletConnected,
    walletConnectInstanceRef,
    coinbaseMobileSDKInstanceRef,
    getWalletClient,
    address,
  ]);

  if (process.env.E2E) {
    // env variables won't change between renders, so this looks safe

    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useRandomWallet();
  }

  return result;
};

export { useWallet };
