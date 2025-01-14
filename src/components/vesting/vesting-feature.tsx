'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { AppHero } from '../ui/ui-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { VestingCreate, VestingList } from './vesting-ui'
import { AllocationList } from './employee-allocations-list'
import { WalletButton } from '../solana/solana-provider'

export default function VestingFeature() {
  const { publicKey } = useWallet()

  return publicKey ? (
    <div className="flex flex-col z-40 w-full min-h-screen mt--16 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none"></div>
      <div className="absolute inset-0 flex items-center justify-center bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      <div 
        className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                    w-[30rem] h-[20rem] rounded-full 
                    bg-gradient-to-r from-blue-500/30 via-cyan-400/20 to-teal-300/10 
                    blur-[8rem] opacity-70"
      ></div>
      <nav className="container flex w-full items-center justify-between px-4 md:px-6 py-6 bg-transparent z-10">
        <div className="flex items-center gap-2">
          <WalletButton className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200" />
        </div>
      </nav>
      <AppHero
        title="OpenVest"
        subtitle="Create Token Vesting Schedules for companies and their employees"
      >
        <VestingCreate />
      </AppHero>

      <div className="w-full px-4 md:px-6 lg:px-8 z-10">
        <Tabs defaultValue="vesting" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="vesting">Vesting Accounts</TabsTrigger>
            <TabsTrigger value="allocation">Employee Allocations</TabsTrigger>
          </TabsList>
          <TabsContent value="vesting">
            <Card>
              <CardContent className="">
                <VestingList />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="allocation">
            <Card>
              <CardContent className="pt-6 bg-[rgb(1,1,3)]">
                <AllocationList />
                {/* <CompanyList/> */}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  ) : (
    <div className="bg-gradient-to-b from-gray-900 to-black w-full min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none"></div>
      <div className="absolute inset-0 flex items-center justify-center bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      <div 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                    w-[30rem] h-[30rem] rounded-full 
                    bg-gradient-to-r from-blue-500/30 via-cyan-400/20 to-teal-300/10 
                    blur-[8rem] opacity-70"
      ></div>
      <div className='z-10 text-center mb-12'>
        <AppHero
          title="OpenVest"
          subtitle="Reward your project contributors with vested tokens!"
        />
      </div>
      <div className="z-10">
        <WalletButton className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors duration-200" />
      </div>
    </div>
  )
}