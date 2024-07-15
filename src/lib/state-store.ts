import { create } from "zustand";

type State = {
  href: string;
  pageOut: boolean;
  openMenu: boolean;
};

type Action = {
  setHref: (href: string) => void;
  setPageOut: (state: boolean) => void;
  setOpenMenu: (state: boolean) => void;
};

export const useStateStore = create<State & Action>((set) => ({
  pageOut: false,
  openMenu: false,
  href: "",
  setPageOut: (state) => set(() => ({ pageOut: state })),
  setOpenMenu: (state) => set(() => ({ openMenu: state })),
  setHref: (href) => set(() => ({ href: href })),
}));
