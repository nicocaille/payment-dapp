declare let window: any;
import Network from "@maticnetwork/meta/network";
import { createContext, useContext, useState } from "react";
import Web3 from "web3";

interface DataContextProps {
  account: string;
  loading: boolean;
  loadWallet: () => Promise<void>;
  sendPayment: ({
    amount,
    toAddress,
  }: {
    amount: any;
    toAddress: any;
  }) => Promise<any>;
  balance: number;
  selectedToken: Token;
  updateSelectedToken: (token: Token) => void;
}

const DataContext = createContext<DataContextProps | null>(null);

export const DataProvider: React.FC = ({ children }) => {
  const data = useProviderData();

  return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
};

export const useData = () => useContext<DataContextProps | null>(DataContext);

export const useProviderData = () => {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<string>();
  const [balance, setBalance] = useState<number>();
  const [selectedToken, setSelectedToken] = useState<Token>(tokensList[0]);
  const [erc20Abi, setErc20Abi] = useState<any>();

  const loadWallet = async () => {
    const network = new Network("mainnet", "v1");
    const ERC20ABI = network.abi("ERC20");
    setErc20Abi(ERC20ABI);

    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
      const web3 = window.web3;
      window.ethereum.on("accountsChanged", function (accounts) {
        loadWallet();
      });
      var allAccounts = await web3.eth.getAccounts();
      setAccount(allAccounts[0]);

      var paymentTokenInstance = new web3.eth.Contract(
        ERC20ABI,
        "0x4ecc07Dc7141a09B4160306C46c95F8663D0A41F"
      );
      var bal = await paymentTokenInstance.methods
        .balanceOf(allAccounts[0])
        .call();
      setBalance(bal);

      setLoading(false);
    } else {
      window.alert("Non-Eth browser detected. Please consider using MetaMask.");
    }
  };

  const sendPayment = async ({ amount, toAddress }) => {
    try {
      var amountInDecimal;
      if (selectedToken.decimals === 18) {
        amountInDecimal = window.web3.utils.toWei(amount, "ether");
      } else {
        amountInDecimal = amount * Math.pow(10, selectedToken.decimals);
      }
      var tokenContract = new window.web3.eth.Contract(
        erc20Abi,
        selectedToken.address
      );

      var bal = await tokenContract.methods.balanceOf(account).call();
      if (bal < amountInDecimal) {
        return "You don't have enough balance";
      }
      const txHash = await tokenContract.methods
        .transfer(toAddress, amountInDecimal)
        .send({
          from: account,
        });
      setTimeout(async () => {
        var bal = await tokenContract.methods.balanceOf(account).call();
        setBalance(bal);
      }, 2000);
      return "Payment success";
    } catch (e) {
      return e.message;
    }
  };

  const updateSelectedToken = async (token: Token) => {
    var tokenContract = new window.web3.eth.Contract(erc20Abi, token.address);
    var bal = await tokenContract.methods.balanceOf(account).call();
    setBalance(bal);
    setSelectedToken(token);
  };

  return {
    account,
    loading,
    loadWallet,
    sendPayment,
    balance,
    selectedToken,
    updateSelectedToken,
  };
};

export interface Token {
  name: string;
  symbol: string;
  address: string;
  logo: string;
  decimals: number;
}

export const tokensList: Token[] = [
  {
    name: "CYTech EUR Payment Token",
    symbol: "CEUR",
    address: "0x4ecc07Dc7141a09B4160306C46c95F8663D0A41F",
    logo: "https://cytech.cyu.fr/medias/photo/cy-tech-coul_1606496968382-jpg",
    decimals: 18,
  },
  {
    name: "Chainlink",
    symbol: "LINK",
    address: "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
    logo: "https://gemini.com/images/currencies/icons/default/link.svg",
    decimals: 18,
  },
];