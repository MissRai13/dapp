import {useState} from 'react'
import Link from "next/link";
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { connectWithWallet } from '../helper/helper';
import { getAllFunding, loadAccount, loadCrowdFundingContract, loadWeb3 } from '../redux/interactions';
import { toastError } from '../helper/toastMessage';

const shortAddress = (account) => {
    if(!account){
        return 'Connect Wallet';
    }
    return `${account.slice(0,6)}...${account.slice(-4)}`;
}

const navItems = [
    {
        href: "/dashboard",
        label: "Dashboard",
    },
    {
        href: "/my-contributions",
        label: "My Contribution",
    },
]

const Navbar = () => {

    const router = useRouter()
    const [openMenu,setOpenMenu] = useState(false);
    const account = useSelector(state=>state.web3Reducer.account)
    const web3 = useSelector(state=>state.web3Reducer.connection)
    const network = useSelector(state=>state.web3Reducer.network)
    const appStatus = useSelector(state=>state.web3Reducer.appStatus)
    const dispatch = useDispatch()

    const connectWallet = async () => {
        await connectWithWallet(async() => {
            try {
                const activeWeb3 = web3 || await loadWeb3(dispatch);
                await loadAccount(activeWeb3,dispatch)
                const crowdFundingContract = await loadCrowdFundingContract(activeWeb3,dispatch)
                await getAllFunding(crowdFundingContract,activeWeb3,dispatch)
            } catch (error) {
                toastError(error?.message || "Unable to connect contract")
            }
        })
    }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      {/* Navbar */}
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard">
          <span className="flex cursor-pointer items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-sm font-black text-white shadow-md">
              CF
            </span>
            <span>
              <span className="block text-lg font-bold text-slate-950">CrowdFund</span>
              <span className="hidden text-xs font-medium text-slate-500 sm:block">{network?.name || "Network unknown"}</span>
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-2 rounded-xl bg-slate-100 p-1 md:flex">
          {navItems.map((item) => {
            const active = router.pathname === item.href || (item.href === "/dashboard" && router.pathname.startsWith("/project-details"));
            return (
              <Link href={item.href} key={item.href}>
                <span className={`${active ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-950"} cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden max-w-[220px] flex-col items-end lg:flex">
            <span className="w-full truncate text-right text-xs font-medium text-slate-500">{appStatus?.contractAddress || "Contract not connected"}</span>
            <span className="text-xs text-slate-400">{account ? "Wallet connected" : "Wallet disconnected"}</span>
          </div>
          <button
            type="button"
            className={`${account ? "border-slate-200 bg-slate-50 text-slate-700" : "border-transparent bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-md hover:shadow-lg"} rounded-xl border px-4 py-2 text-sm font-semibold transition`}
            onClick={!account || !appStatus?.contractAddress ? connectWallet : undefined}
          >
            {shortAddress(account)}
          </button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm md:hidden"
            aria-controls="mobile-menu"
            aria-expanded={openMenu}
            onClick={()=>setOpenMenu(!openMenu)}
          >
            <span className="sr-only">Open main menu</span>
            <i className={`fa-solid ${openMenu ? "fa-xmark" : "fa-bars"}`}></i>
          </button>
        </div>
      </nav>

      <div className={`border-t border-slate-200 bg-white px-4 py-3 md:hidden ${!openMenu ? "hidden" : ""}`} id="mobile-menu">
        <div className="mx-auto flex max-w-7xl flex-col gap-2">
          {navItems.map((item) => {
            const active = router.pathname === item.href || (item.href === "/dashboard" && router.pathname.startsWith("/project-details"));
            return (
              <Link href={item.href} key={item.href}>
                <span className={`${active ? "bg-indigo-50 text-indigo-700" : "text-slate-600"} block cursor-pointer rounded-xl px-4 py-3 text-sm font-semibold`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </header>
  )
}

export default Navbar
