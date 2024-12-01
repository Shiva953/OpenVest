import { JupToken, Profile } from "@/types";
import { create } from "zustand";

interface ITokenStore {
    tokens: null | JupToken[];
    selectedToken: null | JupToken
    setTokens: (tokens: JupToken[]) => void;
    setSelectedToken: (selectedToken: JupToken) => void;
}

interface IProfileStore {
    profile: null | Profile
    setProfile: (profile: Profile) => void;
}

interface IRequestStore {
    amount: string;
    message: string;
    setAmount: (amount: string) => void;
    setMessage: (message: string) => void
}

const useTokenStore = create<ITokenStore>((set) => ({
    tokens: null,
    selectedToken: null,
    setTokens: (tokens) =>
        set({
            tokens: tokens,
        }),
    setSelectedToken: (selectedToken) =>
        set({
            selectedToken: selectedToken,
        }),
}));

const useProfileStore = create<IProfileStore>((set) => ({
    profile: null,
    setProfile: (profile) =>
        set({
            profile: profile,
        }),
}));

const useRequestStore = create<IRequestStore>((set) => ({
    amount: "",
    message: "",
    setAmount: (amount) =>
        set({
            amount: amount,
        }),
    setMessage: (message) =>
        set({
            message: message,
        }),
}));

export { useTokenStore, useProfileStore, useRequestStore };