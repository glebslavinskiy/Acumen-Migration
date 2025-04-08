import { WalletConnect } from './WalletConnect';

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-black border-b border-gray-800 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <a href="/" className="flex items-center">
              <img
                src="/Acumen Logo (1).svg"
                alt="Acumen Logo"
                className="h-7 w-auto"
              />
            </a>
          </div>
          <div className="flex items-center">
            <WalletConnect />
          </div>
        </div>
      </div>
    </nav>
  );
} 