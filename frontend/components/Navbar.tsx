'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation';
import gccLogo from '@/assets/gcclogo.png';
import Image from 'next/image';
import { Menu, X, LogOut, Shield, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { authUserStore } from '@/Stores/authStores';

function Navbar() {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState(false);
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const { user, logOut } = authUserStore();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navbarItem = [
    { name: "Home", link: "/" },
    { name: "Browse", link: "/browse" },
    { name: "AI Recommendation", link: "/recommendation" },
    { name: "About", link: "/about" },
  ];

  const handleLogOut = () => {
    logOut();
    setOpenUserMenu(false);
    router.push('/');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (email: string) => email?.charAt(0).toUpperCase() ?? "U";

  return (
    <nav className='sticky top-0 z-50'>
      {/* Glassmorphism backdrop */}
      <div className='absolute inset-0 bg-[#060f24]/90 backdrop-blur-md border-b border-white/10' />

      <div className='relative flex justify-between max-w-6xl mx-auto items-center px-4 py-3'>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className='relative'>
            <div className='absolute inset-0 bg-yellow-500/30 rounded-full blur-md group-hover:blur-lg transition-all duration-300' />
            <div className='relative bg-gradient-to-br from-[#0a1a3e] to-[#00014f] rounded-full p-2 border border-white/10'>
              <Image src={gccLogo} alt="GCC Logo" className="sm:h-8 sm:w-8 h-7 w-7 rounded-full" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="sm:text-lg text-white font-bold tracking-tight leading-tight">
              Vault<span className="text-yellow-400">Archve</span>
            </span>
            <span className="text-white/40 text-[10px] tracking-widest uppercase">Guagua Community College</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className='gap-1 lg:flex hidden items-center'>
          {navbarItem.map((item, index) => (
            <Link
              key={index}
              href={item.link}
              className={`relative font-medium text-sm px-4 py-2 rounded-lg transition-all duration-200 ${
                pathname === item.link
                  ? "text-black bg-yellow-400 shadow-lg shadow-yellow-500/20"
                  : "text-white/70 hover:text-white hover:bg-white/8"
              }`}
            >
              {item.name}
            </Link>
          ))}

          {/* Admin link */}
          {user?.role === "admin" && (
            <Link
              href='/admin'
              className={`flex items-center gap-1.5 font-medium text-sm px-4 py-2 rounded-lg transition-all duration-200 ${
                pathname.startsWith('/admin')
                  ? "text-black bg-yellow-400 shadow-lg shadow-yellow-500/20"
                  : "text-yellow-400/80 hover:text-yellow-400 hover:bg-yellow-400/10 border border-yellow-400/20"
              }`}
            >
              <Shield size={13} />
              Admin
            </Link>
          )}

          {/* Divider */}
          <div className='w-px h-5 bg-white/10 mx-2' />

          {/* User menu or Login */}
          {user ? (
            <div className='relative' ref={dropdownRef}>
              <button
                onClick={() => setOpenUserMenu(!openUserMenu)}
                className='flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/8 transition-all duration-200 group'
              >
                {/* Avatar */}
                <div className='h-7 w-7 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-black font-bold text-xs shadow-md'>
                  {getInitials(user.email)}
                </div>
                <span className='text-white/80 text-sm font-medium max-w-28 truncate group-hover:text-white transition-colors'>
                  {user.email}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-white/40 transition-transform duration-200 ${openUserMenu ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown */}
              {openUserMenu && (
                <div className='absolute right-0 top-full mt-2 w-52 bg-[#0d1f3c] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden'>
                  <div className='px-4 py-3 border-b border-white/10'>
                    <p className='text-white/40 text-xs uppercase tracking-wider'>Signed in as</p>
                    <p className='text-white text-sm font-medium truncate mt-0.5'>{user.email}</p>
                  </div>
                  <div className='p-1.5'>
                    <button
                      onClick={handleLogOut}
                      className='w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 text-sm font-medium'
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className='font-semibold text-sm px-5 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black transition-all duration-200 shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30'
            >
              Log In
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className='lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors'
          onClick={() => setOpenMenu(!openMenu)}
        >
          {openMenu
            ? <X className='text-white' size={22} />
            : <Menu className='text-white' size={22} />
          }
        </button>
      </div>

      {/* Mobile drawer backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden ${
          openMenu ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpenMenu(false)}
      />

      {/* Mobile drawer */}
      <div className={`fixed top-0 right-0 h-full w-72 bg-[#080f22] z-50 shadow-2xl flex flex-col
        transition-transform duration-300 ease-in-out lg:hidden border-l border-white/10
        ${openMenu ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Drawer header */}
        <div className='flex items-center justify-between p-4 border-b border-white/10'>
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpenMenu(false)}>
            <div className='bg-gradient-to-br from-[#0a1a3e] to-[#00014f] rounded-full p-1.5 border border-white/10'>
              <Image src={gccLogo} alt="GCC Logo" className="h-7 w-7 rounded-full" />
            </div>
            <span className="text-white font-bold text-sm">
              Vault<span className='text-yellow-400'>Archve</span>
            </span>
          </Link>
          <button
            onClick={() => setOpenMenu(false)}
            className='p-1.5 rounded-lg hover:bg-white/10 transition-colors'
          >
            <X className='text-white/60' size={18} />
          </button>
        </div>

        {/* User info in drawer */}
        {user && (
          <div className='mx-4 mt-4 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3'>
            <div className='h-9 w-9 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-black font-bold text-sm flex-shrink-0'>
              {getInitials(user.email)}
            </div>
            <div className='min-w-0'>
              <p className='text-white/40 text-xs'>Signed in as</p>
              <p className='text-white text-sm font-medium truncate'>{user.email}</p>
            </div>
          </div>
        )}

        {/* Drawer nav */}
        <nav className='flex flex-col gap-1 p-4 flex-1'>
          {navbarItem.map((item, index) => (
            <Link
              key={index}
              href={item.link}
              onClick={() => setOpenMenu(false)}
              className={`font-medium text-sm px-4 py-3 rounded-lg transition-colors ${
                pathname === item.link
                  ? "bg-yellow-400 text-black shadow-lg shadow-yellow-500/20"
                  : "text-white/70 hover:text-white hover:bg-white/8"
              }`}
            >
              {item.name}
            </Link>
          ))}

          {user?.role === "admin" && (
            <Link
              href='/admin'
              onClick={() => setOpenMenu(false)}
              className={`flex items-center gap-2 font-medium text-sm px-4 py-3 rounded-lg transition-colors ${
                pathname.startsWith('/admin')
                  ? "bg-yellow-400 text-black"
                  : "text-yellow-400/80 hover:text-yellow-400 hover:bg-yellow-400/10 border border-yellow-400/20"
              }`}
            >
              <Shield size={14} />
              Admin Panel
            </Link>
          )}

          {/* Divider */}
          <div className='h-px bg-white/10 my-2' />

          {user ? (
            <button
              onClick={() => { handleLogOut(); setOpenMenu(false); }}
              className='flex items-center gap-2.5 font-medium text-sm px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors'
            >
              <LogOut size={14} />
              Sign Out
            </button>
          ) : (
            <Link
              href="/login"
              onClick={() => setOpenMenu(false)}
              className='font-semibold text-sm px-4 py-3 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black text-center transition-colors shadow-lg shadow-yellow-500/20'
            >
              Log In
            </Link>
          )}
        </nav>

        {/* Drawer footer */}
        <div className='p-4 border-t border-white/10'>
          <p className='text-white/20 text-xs text-center tracking-wider uppercase'>Guagua Community College</p>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;