import { create } from "zustand";

type State = {
  href: string;
  pageOut: boolean;
  openMenu: boolean;
};

type Action = {
  animatePageOut: (href: string) => void;
  setPageOut: (pageOut: boolean) => void;
  setOpenMenu: (openMenu: boolean) => void;
  toggleOpenMenu: () => void;
};

export const useStateStore = create<State & Action>()((set) => ({
  href: "",
  pageOut: false,
  openMenu: false,
  // TransitionLoader plays the page-out animation, then navigates to `href`.
  animatePageOut: (href) => set({ href, pageOut: true }),
  setPageOut: (pageOut) => set({ pageOut }),
  setOpenMenu: (openMenu) => set({ openMenu }),
  toggleOpenMenu: () => set((state) => ({ openMenu: !state.openMenu })),
}));
