'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { AppHero } from '../ui/ui-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { VestingCreate, VestingList } from './vesting-ui'
import { AllocationList } from './employee-allocations-list'
import ConnectButton from '../solana/wallet-button'
import { UnifiedWalletButton } from '@jup-ag/wallet-adapter'

export default function VestingFeature() {
  const { publicKey } = useWallet()

  return publicKey ? (
    <div className="flex flex-col w-full bg-grid-white/[0.2]">
      <div className="z--20 absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      <div 
        className="z--10 absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                    w-96 h-72 rounded-full 
                    bg-gradient-to-r from-teal-300/50 via-cyan-400/40 to-green-300/30 
                    blur-[110px]"
      ></div>
      {/* animate-pulse */}
      {/* <WalletButton className='z-20 left-0 mt-4 ml-4 fixed'/> */}
      <nav className="container flex w-full items-center justify-between px-4 md:px-6 py-4 border-black border-opacity-10 bg-transparent">
      <div className="z-20 flex items-center gap-2">
        <ConnectButton
        // currentUserClassName="!focus:outline-none !hover:bg-blue-800 !focus:ring-4 !px-5 !py-3 !text-lg font-normal border border-black !border-opacity-[12%] !rounded-md h-16 w-42" 
        // buttonClassName="!text-white !bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-md px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 h-8 w-24" 
        />
      </div>
    </nav>
      {/* <ConnectButton/> */}
      <AppHero
        title="VestX"
        subtitle={'Create Token Vesting Schedules for companies and their employees'}
      >
        <VestingCreate />
      </AppHero>

      <div className="w-full px-4 md:px-6 lg:px-8 mt-8">
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
    <div className="bg-grid-white/[0.2] w-full h-[100vh]">
      <div className="z--20 absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      <div 
        className="z--10 absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                    w-72 h-72 rounded-full 
                    bg-gradient-to-r from-teal-300/50 via-cyan-400/40 to-green-300/30 
                    blur-[110px]"
      ></div>
      <div className='mt-8 mb--16'>
      <AppHero
        title="VestX"
        subtitle={'Reward your project contributors with vested tokens!'}
      />
      </div>
      <div className="hero pb-8 pt--8">
        <div className="hero-content text-center">
          <UnifiedWalletButton
           buttonClassName="!text-white !bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 h-12 w-42"/>
        </div>
      </div>
    </div>
  )
}