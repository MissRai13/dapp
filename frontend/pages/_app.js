import {useEffect} from 'react'
import '../styles/globals.css'
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import {wrapper} from '../redux/store'
import { useDispatch } from 'react-redux';
import { getAllFunding, loadAccount, loadCrowdFundingContract, loadWeb3 } from '../redux/interactions';
import { Router } from 'next/router';
import NProgress from 'nprogress'
import "nprogress/nprogress.css";
import { chainOrAccountChangedHandler } from '../helper/helper';
import { appStatusUpdated } from '../redux/actions';
import { toastError } from '../helper/toastMessage';

function MyApp({ Component, pageProps }) {

  const dispatch = useDispatch()

  useEffect(() => {
    loadBlockchain()
  }, [])


  const loadBlockchain = async() =>{
    try {
      const web3 = await loadWeb3(dispatch)
      await loadAccount(web3,dispatch)
      const crowdFundingContract = await loadCrowdFundingContract(web3,dispatch)
      await getAllFunding(crowdFundingContract,web3,dispatch)
      dispatch(appStatusUpdated({ loading: false }))
    } catch (error) {
      const message = error?.message || "Unable to load blockchain data";
      dispatch(appStatusUpdated({ loading: false, error: message }))
      toastError(message)
    }
  }
  
  useEffect(() => {
    const handleStart = () => NProgress.start();
    const handleStop = () => NProgress.done();

    Router.events.on("routeChangeStart", handleStart)
    Router.events.on("routeChangeComplete", handleStop)
    Router.events.on("routeChangeError", handleStop)

    if (window.ethereum?.on) {
      window.ethereum.on('accountsChanged', chainOrAccountChangedHandler);
      window.ethereum.on('chainChanged', chainOrAccountChangedHandler);
    }

    return () => {
      Router.events.off("routeChangeStart", handleStart)
      Router.events.off("routeChangeComplete", handleStop)
      Router.events.off("routeChangeError", handleStop)
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', chainOrAccountChangedHandler);
        window.ethereum.removeListener('chainChanged', chainOrAccountChangedHandler);
      }
    };
  }, [])
  
  
  return (
    <>
      <ToastContainer/>
      <Component {...pageProps} />
    </>
  )
}

export default wrapper.withRedux(MyApp)
