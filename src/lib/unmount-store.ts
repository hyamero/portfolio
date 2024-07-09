import { create } from "zustand";

type State = {
  unmount: boolean;
  pageOut: boolean;
  href: string;
};

type Action = {
  setUnmount: (unmount: boolean) => void;
  setPageOut: (pageOut: boolean) => void;
  setHref: (href: string) => void;
};

export const useUnmountStore = create<State & Action>((set) => ({
  unmount: false,
  pageOut: false,
  href: "",
  setUnmount: (unmount) => set(() => ({ unmount: unmount })),
  setPageOut: (pageOut) => set(() => ({ pageOut: pageOut })),
  setHref: (href) => set(() => ({ href: href })),
}));
