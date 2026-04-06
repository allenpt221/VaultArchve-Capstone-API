'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation';

import gccLogo from '@/assets/gcclogo.png';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

function Navbar() {

  const pathname = usePathname();

  const [openMenu, setOpenMenu] = useState(false);

  const navbarItem = [
    { name: "Home", link: "/" },
    { name: "Browse", link: "/browse" },
    { name: "AI Recommendation", link: "/recommendation" },
    { name: "About", link: "/about" },
    { name: "Sign up", link: "/signup" }
  ];

  return (
    // desktop view
    <div className='sticky top-0 z-100 bg-[#0b1f3d] shadow-lg'>
      <div className='flex justify-between max-w-6xl mx-auto items-center p-4'>
        <Link href="/" className="flex items-center gap-3">
          <div className='bg-[#00014f] rounded-full p-2'>
            <Image src={gccLogo} alt="GCC Logo" className="sm:h-9 sm:w-9 h-8 w-8 rounded-full bg" />
          </div>
            <div className="flex flex-col">
              <span className="sm:text-xl text-white font-semibold">
                VaultArchve
              </span>
              <span className="text-white/70 text-xs">
                Guagua Community College
              </span>
            </div>
          </Link>

        <div className=' gap-2 md:flex hidden'>
          {navbarItem.map((items, index) => (
            <div key={index} className=''>
              <Link href={items.link} className={`font-semibold text-sm px-3 py-2 rounded-lg ${
                pathname === items.link
                  ? "bg-yellow-500 text-black"
                  : items.name === "Sign up"
                  ? "bg-yellow-500 hover:bg-yellow-600 text-black"
                  : "hover:bg-white/10 text-white"
              }`}>
                {items.name}
              </Link>
            </div>
          ))}

        </div>
        
        {/* mobile view */}
        <div className='block md:hidden'>
            <button onClick={() => setOpenMenu(!openMenu)}>
              {openMenu ? <X className='text-white' size={25} /> : <Menu className='text-white' size={25} /> }
            </button>
        </div>
      </div>

      <div  className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden ${
          openMenu ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpenMenu(false)}>
        <div
          className={`fixed  top-0 right-0 h-full w-64 bg-[#0b1f3d] z-50 shadow-2xl flex flex-col
            transition-transform duration-300 ease-in-out md:hidden
            ${openMenu ? 'translate-x-0' : 'translate-x-full'}
          `}>
          {/* Drawer header */}
          <div className='flex items-center justify-between p-4 border-b border-white/10'>
            <Link href="/" className="flex items-center gap-2" onClick={() => setOpenMenu(false)}>
              <div className='bg-[#00014f] rounded-full p-1.5'>
                <Image src={gccLogo} alt="GCC Logo" className="h-7 w-7 rounded-full" />
              </div>
              <span className="text-white font-semibold text-sm">VaultArchve</span>
            </Link>
            <button onClick={() => setOpenMenu(false)}>
              <X className='text-white' size={22} />
            </button>
          </div>
          {/* Drawer nav items */}
          <nav className='flex flex-col gap-1 p-4 flex-1'>
            {navbarItem.map((item, index) => (
              <Link
                key={index}
                href={item.link}
                onClick={() => setOpenMenu(false)}
                className={`font-semibold text-sm px-4 py-3 rounded-lg transition-colors ${
                  pathname === item.link
                    ? "bg-yellow-500 text-black"
                    : item.name === "Sign up"
                    ? "bg-yellow-500 hover:bg-yellow-600 text-black mt-2"
                    : "text-white hover:bg-white/10"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
  
          {/* Drawer footer */}
          <div className='p-4 border-t border-white/10'>
            <p className='text-white/40 text-xs text-center'>Guagua Community College</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Navbar