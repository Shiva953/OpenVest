"use client";

import { UnifiedWalletButton, useWallet } from "@jup-ag/wallet-adapter";
import { useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfileStore } from "@/store";
import { formatAddress } from "@/app/lib/utils";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

export default function ConnectButton() {
  const { connected, disconnect, publicKey } = useWallet();

  if (connected) {
    return (
      <Button className="w-32 h-8">
        {/* {formatAddress(publicKey?.toString()!)} */}
      <DropdownMenu>
        <DropdownMenuTrigger>
            {/* <AvatarImage src={""} alt={"neutron"} />
            <AvatarFallback> */}
              {formatAddress(publicKey?.toString()!)}
            {/* </AvatarFallback> */}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="mr-4">
          <DropdownMenuItem className="cursor-pointer" onClick={disconnect}>
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </Button>
    );
  }

  return (
    <UnifiedWalletButton
      currentUserClassName="!focus:outline-none !hover:bg-blue-800 !focus:ring-4 !px-5 !py-3 !text-lg font-normal border border-black !border-opacity-[12%] !rounded-md"
      buttonClassName="!text-white !bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800
      "
    />
  );
}