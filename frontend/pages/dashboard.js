import React, { useEffect, useState } from "react";
import authWrapper from "../helper/authWrapper";
import FundRiserForm from "../components/FundRiserForm";
import { useSelector } from "react-redux";
import FundRiserCard from "../components/FundRiserCard";
import Loader from "../components/Loader";
import { getMyContributionList } from "../redux/interactions";

const Dashboard = () => {

  const projectsList = useSelector(state=>state.projectReducer.projects)
  const crowdFundingContract = useSelector(state=>state.fundingReducer.contract)
  const account = useSelector(state=>state.web3Reducer.account)
  const [myContributionTotal, setMyContributionTotal] = useState(0)

  const projects = projectsList || []
  const totalFundsRaised = projects.reduce((total, project) => total + Number(project.currentAmount || 0), 0)

  useEffect(() => {
    (async() => {
      try {
        if(crowdFundingContract && account){
          const contributions = await getMyContributionList(crowdFundingContract,account)
          const totalContribution = contributions.reduce((total, data) => total + Number(data.amount || 0), 0)
          setMyContributionTotal(totalContribution)
        }else{
          setMyContributionTotal(0)
        }
      } catch {
        setMyContributionTotal(0)
      }
    })();
  }, [crowdFundingContract, account, projectsList])

  const stats = [
    {
      label: "Total Campaigns",
      value: projects.length,
      helper: "Live on this contract",
    },
    {
      label: "Total Funds Raised",
      value: `${totalFundsRaised.toFixed(3)} ETH`,
      helper: "Across all campaigns",
    },
    {
      label: "My Contributions",
      value: `${myContributionTotal.toFixed(3)} ETH`,
      helper: account ? "Connected wallet" : "Wallet not connected",
    },
  ]

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-12">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Crowdfunding Dashboard</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">Fund ideas with confidence</h1>
          </div>
          <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
            {account ? `${account.slice(0,6)}...${account.slice(-4)}` : "Wallet not connected"}
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-md" key={stat.label}>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="mt-3 text-2xl font-bold text-slate-950">{stat.value}</p>
              <p className="mt-1 text-sm text-slate-400">{stat.helper}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          {/* Campaign list */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950">Active Campaigns</h2>
              </div>
            </div>

            {projectsList !== undefined?
              projects.length > 0 ?
                projects.map((data, i) => (
                  <FundRiserCard props={data} key={i}/>
                ))
              :
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800">No campaigns found</h3>
              </div>
            :
            <div className="rounded-xl bg-white p-10 shadow-md"><Loader/></div>
          }
          </section>

          {/* Form */}
          <aside className="h-fit rounded-xl border border-slate-200 bg-white p-6 shadow-md lg:sticky lg:top-24">
            <FundRiserForm/>
          </aside>
        </div>
      </section>
    </main>
  );
};

export default authWrapper(Dashboard);
