import { Zap, Linkedin, Twitter, Facebook, Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
    return (
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
            {/* Company Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#82ffb2] flex items-center justify-center">
                  <Zap className="w-6 h-6 text-gray-900" />
                </div>
                <span className="text-2xl font-bold text-white">Proanbud</span>
              </div>
              <p className="text-gray-400 leading-relaxed max-w-sm">
                Den komplette tilbudsplattformen for moderne håndverkere. Spar tid, øk lønnsomhet og vinn flere oppdrag.
              </p>
              <div className="flex items-center gap-4">
                <a
                  href="#"
                  className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-[#82ffb2] flex items-center justify-center transition-colors group"
                >
                  <Linkedin className="w-5 h-5 group-hover:text-gray-900" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-[#82ffb2] flex items-center justify-center transition-colors group"
                >
                  <Twitter className="w-5 h-5 group-hover:text-gray-900" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-[#82ffb2] flex items-center justify-center transition-colors group"
                >
                  <Facebook className="w-5 h-5 group-hover:text-gray-900" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-white font-bold mb-4">Produkt</h3>
              <ul className="space-y-3">
                <li><a href="#features" className="hover:text-[#82ffb2] transition-colors">Funksjoner</a></li>
                <li><a href="#" className="hover:text-[#82ffb2] transition-colors">Priser</a></li>
                <li><a href="#" className="hover:text-[#82ffb2] transition-colors">Integrasjoner</a></li>
                <li><a href="#" className="hover:text-[#82ffb2] transition-colors">API</a></li>
                <li><a href="#" className="hover:text-[#82ffb2] transition-colors">Hva er nytt</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-white font-bold mb-4">Selskap</h3>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-[#82ffb2] transition-colors">Om oss</a></li>
                <li><a href="#blog" className="hover:text-[#82ffb2] transition-colors">Blogg</a></li>
                <li><a href="#" className="hover:text-[#82ffb2] transition-colors">Karriere</a></li>
                <li><a href="#" className="hover:text-[#82ffb2] transition-colors">Presse</a></li>
                <li><a href="#" className="hover:text-[#82ffb2] transition-colors">Partnere</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-white font-bold mb-4">Support</h3>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-[#82ffb2] transition-colors">Hjelpesenter</a></li>
                <li><a href="#faq" className="hover:text-[#82ffb2] transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-[#82ffb2] transition-colors">Kontakt</a></li>
                <li><a href="#" className="hover:text-[#82ffb2] transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-[#82ffb2] transition-colors">Dokumentasjon</a></li>
              </ul>
            </div>
          </div>

          {/* Contact Bar */}
          <div className="border-t border-gray-800 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-[#82ffb2]" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">E-post</div>
                  <div className="text-white font-medium">post@proanbud.no</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-[#82ffb2]" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Telefon</div>
                  <div className="text-white font-medium">+47 (utilgjengelig)</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-[#82ffb2]" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Adresse</div>
                  <div className="text-white font-medium">Bergen, Norge</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
              © 2024 Nag Software. Alle rettigheter forbeholdt.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/personvern" className="hover:text-[#82ffb2] transition-colors">Personvern</Link>
              <Link href="/vilkar" className="hover:text-[#82ffb2] transition-colors">Vilkår</Link>
              <Link href="/cookies" className="hover:text-[#82ffb2] transition-colors">Cookies</Link>
              <Link href="/tilgjengelighet" className="hover:text-[#82ffb2] transition-colors">Tilgjengelighet</Link>
            </div>
          </div>
        </div>
      </footer>
    );
}