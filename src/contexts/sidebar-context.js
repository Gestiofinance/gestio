"use client";

import { createContext, useContext, useState } from "react";

const SidebarContext = createContext({ mobileOpen: false, setMobileOpen: () => {} });

export function SidebarProvider({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <SidebarContext.Provider value={{ mobileOpen, setMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
