import { BookOpen } from "lucide-react";

function Footer(){
    return (
    <footer className="bg-[#0b1f3d] text-primary-foreground/70 font-body">
        <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
            <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-5 w-5 text-secondary" />
                <span className="font-display font-bold text-primary-foreground text-lg">VaultArchve</span>
            </div>
            <p className="text-sm leading-relaxed">
                A digital repository preserving and sharing academic theses from Guagua Community College.
            </p>
            </div>
            <div>
            <h4 className="font-display font-semibold text-primary-foreground mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
                <li><a href="/browse" className="hover:text-secondary transition-colors">Browse Theses</a></li>
                    <li><a href="/recommendation" className="hover:text-secondary transition-colors">AI Recommendation</a></li>
                <li><a href="/about" className="hover:text-secondary transition-colors">About</a></li>
            </ul>
            </div>
            <div>
            <h4 className="font-display font-semibold text-primary-foreground mb-3">Contact</h4>
            <p className="text-sm">Guagua Community College</p>
            <p className="text-sm">Guagua, Pampanga, Philippines</p>
            <p className="text-sm mt-1">library@gcc.edu.ph</p>
            </div>
        </div>
        <div className="border-t border-primary-foreground/10 mt-8 pt-6 text-center text-xs">
            © {new Date().getFullYear()} VaultArchve — Guagua Community College. All rights reserved.
        </div>
        </div>
    </footer>
    )};

export default Footer;
