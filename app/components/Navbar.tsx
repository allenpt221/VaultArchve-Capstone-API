'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import gccLogo from '@/assets/gcclogo.png';
import Image from 'next/image';

function Navbar() {

  const pathname = usePathname();

  const navbarItem = [
    { name: "Home", link: "/" },
    { name: "Browse", link: "/browse" },
    { name: "AI Recommendation", link: "/recommendation" },
    { name: "About", link: "/about" },
    { name: "Sign up", link: "/signup" }
  ];

  return (
    <div className='sticky top-0 bg-[#030831] shadow-lg font-sans'>
      <div className='flex justify-between max-w-6xl mx-auto items-center p-4'>
        <Link href="/" className="flex items-center gap-3 group">
          <div className='bg-[#00014f] rounded-full p-2'>
            <Image src={gccLogo} alt="GCC Logo" className="h-9 w-9 rounded-full bg-primary-foreground/10" />
          </div>
            <div className="flex flex-col gap-1">
              <span className="text-primary-foreground font-display font-bold text-lg leading-tight tracking-wide">
                VaultArchve
              </span>
              <span className="text-primary-foreground/60 text-white/70 text-[9px] font-body uppercase tracking-widest leading-none">
                Guagua Community College
              </span>
            </div>
          </Link>

        <div className='flex gap-2'>
          {navbarItem.map((items, index) => (
            <div key={index} className=''>
              <Link href={items.link} className={`font-semibold text-sm ${pathname === items.link ? 'bg-yellow-500 text-black' : 'hover:bg-white/10'} px-3 py-2 rounded-lg
              ${items.name === "Sign up" ? "bg-yellow-500 text-black hover:bg-yellow-600" : ""}`}>
                {items.name}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Navbar