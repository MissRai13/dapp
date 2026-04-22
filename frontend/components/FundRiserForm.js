import React, { useEffect, useState } from 'react'
import moment from 'moment'
import { loadCrowdFundingContract, startFundRaising } from '../redux/interactions'
import { useDispatch, useSelector } from 'react-redux'
import { etherToWei } from '../helper/helper'
import { toastSuccess,toastError } from '../helper/toastMessage'

const FundRiserForm = () => {

    const crowdFundingContract = useSelector(state=>state.fundingReducer.contract)
    const account = useSelector(state=>state.web3Reducer.account)
    const web3 = useSelector(state=>state.web3Reducer.connection)

    const dispatch = useDispatch()

    const [title,setTitle] = useState("")
    const [description,setDescription] = useState("")
    const [targetedContributionAmount,setTargetedContributionAmount] = useState("")
    const [minimumContributionAmount,setMinimumContributionAmount] = useState("")
    const [deadline,setDeadline] = useState("")
    const [btnLoading,setBtnLoading] = useState(false)
    const [formMessage,setFormMessage] = useState(null)


    const riseFund = async (e) =>{
       e.preventDefault();

       const showError = (message) => {
        setFormMessage({ type: "error", text: message })
        toastError(message)
       }

       if(!account){
        showError("Please connect wallet first");
        return;
       }

       if(!web3){
        showError("Blockchain connection is not ready. Refresh the page and try again.");
        return;
       }

       let activeCrowdFundingContract = crowdFundingContract;
       if(!activeCrowdFundingContract){
        try {
          setFormMessage({ type: "info", text: "Connecting to crowdfunding contract..." })
          activeCrowdFundingContract = await loadCrowdFundingContract(web3,dispatch)
        } catch (error) {
          showError(error?.message || "Crowdfunding contract is not connected.");
          return;
        }
       }

       const minAmount = Number(minimumContributionAmount);
       const targetAmount = Number(targetedContributionAmount);
       const unixDate = moment(deadline).unix();

       if(!unixDate || unixDate <= moment().unix()){
        showError("Please choose a future deadline");
        return;
       }
       if(minAmount <= 0 || targetAmount <= 0){
        showError("Contribution values should be greater than 0");
        return;
       }
       if(targetAmount < minAmount){
        showError("Target amount should be greater than minimum contribution");
        return;
       }

       setBtnLoading(true)
       setFormMessage({ type: "info", text: "Waiting for wallet confirmation..." })

       const onSuccess = () =>{
        setBtnLoading(false)
        setTitle("")
        setDescription("")
        setTargetedContributionAmount("")
        setMinimumContributionAmount("")
        setDeadline("")
        setFormMessage({ type: "success", text: "Campaign created successfully." })
        toastSuccess("Fundraising campaign created");
      }

       const onError = (error) =>{
         setBtnLoading(false)
         setFormMessage({ type: "error", text: error })
         toastError(error);
       }

       const data = {
        minimumContribution:etherToWei(minimumContributionAmount),
        deadline:unixDate,
        targetContribution:etherToWei(targetedContributionAmount),
        projectTitle:title,
        projectDesc:description,
        account:account
       }

       startFundRaising(web3,activeCrowdFundingContract,data,onSuccess,onError,dispatch)
    }

  return (
    <>
        {/* Form */}
        <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">New Campaign</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">Create a Fundraising Campaign</h2>
        </div>

        {formMessage && (
          <div className={`${formMessage.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : formMessage.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-indigo-200 bg-indigo-50 text-indigo-700"} mb-5 rounded-xl border px-4 py-3 text-sm font-medium`}>
            {formMessage.text}
          </div>
        )}

        <form className="space-y-5" onSubmit={(e)=>riseFund(e)}>
            <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Campaign title</label>
                <input type="text" placeholder="Community solar project" className="form-control-input" value={title} onChange={(e)=>setTitle(e.target.value)} required/>
            </div>
            <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
                <textarea placeholder="Tell contributors what this campaign will fund" rows="4" className="form-control-input resize-none" value={description} onChange={(e)=>setDescription(e.target.value)} required></textarea>
            </div>
            <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Target contribution</label>
                <div className="relative">
                  <input type="number" min="0" step="0.0001" placeholder="10.0" className="form-control-input pr-14" value={targetedContributionAmount} onChange={(e)=>setTargetedContributionAmount(e.target.value)} required/>
                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-semibold text-slate-400">ETH</span>
                </div>
            </div>
            <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Minimum contribution</label>
                <div className="relative">
                  <input type="number" min="0" step="0.0001" placeholder="0.05" className="form-control-input pr-14" value={minimumContributionAmount} onChange={(e)=>setMinimumContributionAmount(e.target.value)} required/>
                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-semibold text-slate-400">ETH</span>
                </div>
            </div>
            <div className="date-picker">
                <label className="mb-2 block text-sm font-semibold text-slate-700">Deadline</label>
                <input type="date" className="form-control-input" value={deadline} onChange={(e)=>setDeadline(e.target.value)} required/>
            </div>

            <button className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg" disabled={btnLoading} >
              {btnLoading?"Creating campaign...":"Create Campaign"}
            </button>
        </form>
    </>
  )
}

export default FundRiserForm
