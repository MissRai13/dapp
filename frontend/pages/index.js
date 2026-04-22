import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import { connectWithWallet } from '../helper/helper';
import { getAllFunding, loadAccount, loadCrowdFundingContract, loadWeb3 } from '../redux/interactions';
import { toastError } from '../helper/toastMessage';

export default function Home() {

  const router = useRouter();
  const dispatch = useDispatch();
  const web3 = useSelector(state => state.web3Reducer.connection)
  const account = useSelector(state => state.web3Reducer.account)
  const network = useSelector(state => state.web3Reducer.network)
  const appStatus = useSelector(state => state.web3Reducer.appStatus)

  const connect = async () =>{
    const onSuccess = async () =>{
      try {
        const activeWeb3 = web3 || await loadWeb3(dispatch)
        await loadAccount(activeWeb3,dispatch)
        const crowdFundingContract = await loadCrowdFundingContract(activeWeb3,dispatch)
        await getAllFunding(crowdFundingContract,activeWeb3,dispatch)
        router.push('/dashboard')
      } catch (error) {
        toastError(error?.message || "Unable to connect contract")
      }
    }
    await connectWithWallet(onSuccess)
  }

  useEffect(() => {
     (async()=>{
      if(web3 && account){
        const account = await loadAccount(web3,dispatch)
        if(account.length > 0){
          router.push('/dashboard')
        }
      }
     })()
  }, [web3, account])
  

  return (
    <div className="flex flex-col items-center justify-center my-40 px-4">
    <h1 className="text-3xl font-bold text-center text-gray-800">Crowdfunding DApp</h1>
    <p className="text-center text-gray-500 mt-3 max-w-xl">
      Connect MetaMask, switch to the correct network, and start funding or creating campaigns.
    </p>
    <button className="p-4 my-10 text-lg font-bold text-white rounded-md w-56 bg-[#8D8DAA] drop-shadow-md hover:bg-[#b1b1d6] hover:drop-shadow-xl" onClick={()=>connect()}>
      {account ? "Open Dashboard" : "Connect to MetaMask"}
    </button>
    <div className="card w-full max-w-2xl">
      <p><span className="font-semibold">Wallet:</span> {account || "Not connected"}</p>
      <p><span className="font-semibold">Network:</span> {network?.name || "Unknown"}</p>
      <p><span className="font-semibold">Contract:</span> {appStatus?.contractAddress || "Not loaded yet"}</p>
      {appStatus?.error && <p className="text-red-600 mt-2">{appStatus.error}</p>}
    </div>
  </div>
  )
}
