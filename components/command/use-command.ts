'use client'

import { create } from "zustand"

interface CommandState {
  open: boolean
  setOpen: (value: boolean) => void
  toggle: () => void
}

export const useCommand = create<CommandState>((set) => ({
  open: false,

  setOpen: (value) => set({ open: value }),

  toggle: () => set((state) => ({ open: !state.open }))
}))