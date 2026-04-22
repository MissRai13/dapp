import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import Loader from '../components/Loader'
import authWrapper from '../helper/authWrapper'
import { getMyContributionList } from '../redux/interactions'
import Link from "next/link";

const MyContributions = () => {

    const crowdFundingContract = useSelector(state=>state.fundingReducer.contract)
    const account = useSelector(state=>state.web3Reducer.account)

    const [contributions, setContributions] = useState(null)

    useEffect(() => {
        (async() => {
            if(crowdFundingContract && account){
                var res = await getMyContributionList(crowdFundingContract,account)
                setContributions(res)
            } else if (crowdFundingContract && !account) {
                setContributions([])
            }
        })();
    }, [crowdFundingContract, account])

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-12">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Portfolio</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">My Contributions</h1>
          </div>
          <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
            {account ? `${account.slice(0,6)}...${account.slice(-4)}` : "Wallet not connected"}
          </div>
        </div>

        {
          contributions?
            contributions.length > 0?
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {contributions.map((data,i)=>(
                    <Link href={`/project-details/${data.projectAddress}`} key={i}>
                      <article className='cursor-pointer rounded-xl border border-slate-200 bg-white p-6 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg'>
                        <div className="mb-5 flex items-center justify-between">
                          <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-sm font-black text-white'>
                            ETH
                          </div>
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">Contributed</span>
                        </div>
                        <p className='truncate text-sm font-semibold text-slate-500'>{data.projectAddress}</p>
                        <p className='mt-3 text-2xl font-bold text-slate-950'>{data.amount} ETH</p>
                      </article>
                    </Link>
                ))}
              </div>
            :
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800">{account ? "No contributions yet" : "Wallet not connected"}</h2>
            </div>
        :
        <div className="rounded-xl bg-white p-10 shadow-md"> <Loader/></div>
       
        }
      </section>
    </main>
  )
}

export default authWrapper(MyContributions)
