import React,{useState} from 'react'
import Link from "next/link";
import { useDispatch, useSelector } from 'react-redux'
import { contribute, createWithdrawRequest } from '../redux/interactions';
import { etherToWei } from '../helper/helper';
import { toastSuccess,toastError } from '../helper/toastMessage'

const colorMaker = (state) =>{
    if(state === 'Fundraising'){
        return 'bg-cyan-50 text-cyan-700 ring-cyan-200'
    }else if(state === 'Expired'){
        return 'bg-red-50 text-red-700 ring-red-200'
    }else{
        return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
    }
}

const FundRiserCard = ({props,pushWithdrawRequests}) => {

  const [btnLoader, setBtnLoader] = useState(false)
  const [amount, setAmount] = useState("")
  const dispatch = useDispatch();
  const crowdFundingContract = useSelector(state=>state.fundingReducer.contract)
  const account = useSelector(state=>state.web3Reducer.account)
  const web3 = useSelector(state=>state.web3Reducer.connection)

  if(!props){
    return null;
  }

  const progress = Number.isFinite(Number(props.progress)) ? Math.min(100, Math.max(0, Number(props.progress))) : 0;
  const isOwner = props.creator === account;

  const contributeAmount = (projectId,minContribution) =>{
    if(!crowdFundingContract || !account){
      toastError("Please connect your wallet first");
      return;
    }

    if(Number(amount) < Number(minContribution)){
      toastError(`Minimum contribution amount is ${minContribution}`);
      return;
    }

    setBtnLoader(projectId)
    const contributionAmount = etherToWei(amount);

    const data = {
      contractAddress:projectId,
      amount:contributionAmount,
      account:account
    }
    const onSuccess = () =>{
      setBtnLoader(false)
      setAmount("")
      toastSuccess(`Successfully contributed ${amount} ETH`)
    }
    const onError = (message) =>{
      setBtnLoader(false)
      toastError(message)
    }
    contribute(crowdFundingContract,data,dispatch,onSuccess,onError)
  }

  const requestForWithdraw = (projectId) =>{
    if(!account){
      toastError("Please connect your wallet first");
      return;
    }
    if(Number(amount) <= 0){
      toastError("Enter a valid withdraw amount");
      return;
    }
    if(Number(amount) > Number(props.contractBalance)){
      toastError("Withdraw amount exceeds available contract balance");
      return;
    }
    setBtnLoader(projectId)
    const contributionAmount = etherToWei(amount);

    const data = {
      description:`${amount} ETH requested for withdraw`,
      amount:contributionAmount,
      recipient:account,
      account:account
    }
    const onSuccess = (data) =>{
      setBtnLoader(false)
      setAmount("")
      if(pushWithdrawRequests){
        pushWithdrawRequests(data)
      }
      toastSuccess(`Successfully requested for withdraw ${amount} ETH`)
    }
    const onError = (message) =>{
      setBtnLoader(false)
      toastError(message)
    }
    createWithdrawRequest(web3,projectId,data,onSuccess,onError)
  }

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">
      {/* Campaign card */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${colorMaker(props.state)}`}>
            {props.state}
          </span>
          <Link href={`/project-details/${props.address}`} >
            <h3 className="mt-4 cursor-pointer text-xl font-bold text-slate-950 transition hover:text-indigo-600">{props.title}</h3>
          </Link>
          <p className="mt-2 text-sm leading-6 text-slate-500">{props.description}</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Funded</p>
          <p className="text-2xl font-bold text-slate-950">{progress}%</p>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-500">{props.currentAmount} ETH raised</span>
          <span className="font-semibold text-slate-700">{props.goalAmount} ETH goal</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Minimum</p>
          <p className="mt-1 text-sm font-bold text-slate-800">{props.minContribution} ETH</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Deadline</p>
          <p className="mt-1 text-sm font-bold text-slate-800">{props.deadline}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Balance</p>
          <p className="mt-1 text-sm font-bold text-slate-800">{props.contractBalance} ETH</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        {
          props.state === "Fundraising" ?
          <>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Contribution amount</label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <input type="number" min="0" step="0.0001" placeholder={props.minContribution} value={amount} onChange={(e)=>setAmount(e.target.value)} disabled={btnLoader === props.address} className="input pr-14" />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-semibold text-slate-400">ETH</span>
              </div>
              <button className="rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:shadow-lg sm:w-36"
              onClick={()=>contributeAmount(props.address,props.minContribution)}
              disabled={btnLoader === props.address}
              >
                {btnLoader === props.address?"Processing":"Contribute"}
              </button>
            </div>
          </>
          : props.state === "Successful" ?
          <>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-700">Campaign successful</p>
                <p className="text-sm text-slate-500">{props.contractBalance} ETH available</p>
              </div>
              {isOwner && <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">Owner</span>}
            </div>

            {
              isOwner?
              <>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Withdraw request</label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <input type="number" min="0" step="0.0001" placeholder="0.0" value={amount} onChange={(e)=>setAmount(e.target.value)} disabled={btnLoader === props.address} className="input pr-14" />
                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-semibold text-slate-400">ETH</span>
                </div>
                <button className="rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:shadow-lg sm:w-36" onClick={()=>requestForWithdraw(props.address)} disabled={btnLoader === props.address}>
                  {btnLoader === props.address?"Processing":"Withdraw"}
                </button>
              </div>
            </>
            :""
            }

          </>
          :
          <div>
            <p className="text-sm font-semibold text-slate-700">Campaign expired</p>
            <p className="text-sm text-slate-500">Funding is closed for this campaign.</p>
          </div>
        }
      </div>
    </article>
  )
}

export default FundRiserCard
