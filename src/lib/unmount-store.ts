import { create } from "zustand";

type State = {
  pageOut: boolean;
  href: string;
};

type Action = {
  setPageOut: (pageOut: boolean) => void;
  setHref: (href: string) => void;
};

export const useUnmountStore = create<State & Action>((set) => ({
  unmount: false,
  pageOut: false,
  href: "",
  setPageOut: (pageOut) => set(() => ({ pageOut: pageOut })),
  setHref: (href) => set(() => ({ href: href })),
}));
