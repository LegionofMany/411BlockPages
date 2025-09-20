
"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "./components/Navbar";

export default function Home() {
  const router = useRouter();
  return (
  <div className="text-gray-100">
      <Navbar variant="landing" />
      <main className="relative overflow-hidden">
        <div className="pt-16 sm:pt-24 lg:pt-40">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 sm:static">
            <div className="sm:max-w-lg">
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
                The Future of Wallet Reputation is Here
              </h1>
              <p className="mt-4 text-xl text-cyan-100">
                Blockpage411 is a community-driven platform for flagging and rating wallet addresses across all major blockchains. Build trust and reputation in Web3.
              </p>
            </div>
            <div>
              <div className="mt-10">
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="inline-block text-center bg-indigo-600 border border-transparent rounded-xl py-4 px-10 font-bold text-white shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-300 hover:bg-indigo-700 hover:scale-105 hover:shadow-xl active:bg-indigo-800 text-lg"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chain Navigation Buttons Section */}
        <section className="max-w-4xl mx-auto px-4 py-10 flex flex-col items-center">
          <h2 className="text-2xl font-bold text-white mb-6">Explore Supported Chains</h2>
          <div className="flex flex-wrap gap-4 justify-center w-full">
            {[
              { name: 'Bitcoin', color: 'bg-yellow-400 text-gray-900', route: '/chain/bitcoin' },
              { name: 'Ethereum', color: 'bg-blue-600 text-white', route: '/chain/ethereum' },
              { name: 'Binance', color: 'bg-yellow-300 text-gray-900', route: '/chain/binance' },
              { name: 'Polygon', color: 'bg-purple-600 text-white', route: '/chain/polygon' },
              { name: 'Solana', color: 'bg-gradient-to-r from-green-400 to-purple-500 text-white', route: '/chain/solana' },
              { name: 'Tron', color: 'bg-red-500 text-white', route: '/chain/tron' },
              { name: 'Avalanche', color: 'bg-red-300 text-gray-900', route: '/chain/avalanche' },
              { name: 'Cardano', color: 'bg-blue-300 text-gray-900', route: '/chain/cardano' },
            ].map((chain) => (
              <button
                key={chain.name}
                className={`px-6 py-3 rounded-xl font-bold shadow-md text-base transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400/60 ${chain.color}`}
                onClick={() => router.push(chain.route)}
                type="button"
              >
                {chain.name}
              </button>
            ))}
          </div>
        </section>

        {/* Why Blockpage411 Section */}
        <section aria-labelledby="cause-heading">
          <div className="relative bg-gray-800 bg-opacity-80 py-32 px-6 sm:py-40 sm:px-12 lg:px-16 rounded-3xl max-w-5xl mx-auto mb-12">
            <div className="relative max-w-3xl mx-auto flex flex-col items-center text-center">
              <h2 id="cause-heading" className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Why Blockpage411?
              </h2>
              <p className="mt-3 text-xl text-white">
                We believe in a transparent and trustworthy Web3. Our mission is to empower users to make informed decisions by providing a platform for community-driven wallet reputation.
              </p>
              <a
                href="#"
                className="mt-8 w-full block bg-white border border-transparent rounded-md py-3 px-8 text-base font-medium text-gray-900 hover:bg-gray-100 sm:w-auto"
              >
                Read our story
              </a>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section aria-labelledby="features-heading" className="relative">
          <div className="relative pt-16 pb-32 px-4 sm:px-6 lg:px-8 lg:pt-32">
            <div className="max-w-md mx-auto text-center sm:max-w-2xl">
              <h2 id="features-heading" className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Features
              </h2>
              <p className="mt-4 text-lg text-cyan-100">
                Everything you need to navigate the world of Web3 with confidence.
              </p>
            </div>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="pt-6">
                <div className="flow-root bg-gray-900 bg-opacity-80 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-md shadow-lg">
                        <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-white tracking-tight">Wallet Search</h3>
                    <p className="mt-5 text-base text-cyan-100">
                      Find any wallet address and view its reputation, flags, and ratings across multiple blockchains.
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-6">
                <div className="flow-root bg-gray-900 bg-opacity-80 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-md shadow-lg">
                        <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-white tracking-tight">Flag & Report</h3>
                    <p className="mt-5 text-base text-cyan-100">
                      Report scam, trusted, or suspicious wallets to help protect the community.
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-6">
                <div className="flow-root bg-gray-900 bg-opacity-80 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-md shadow-lg">
                        <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.52 4.674c.3.921-.755 1.688-1.539 1.118l-3.975-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.539-1.118l1.52-4.674a1 1 0 00-.363-1.118L2.05 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-white tracking-tight">Rate & Review</h3>
                    <p className="mt-5 text-base text-cyan-100">
                      Leave ratings and reviews for wallet addresses to build a transparent reputation system.
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-6">
                <div className="flow-root bg-gray-900 bg-opacity-80 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-md shadow-lg">
                        <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-white tracking-tight">Profile & History</h3>
                    <p className="mt-5 text-base text-cyan-100">
                      View wallet profiles, transaction history, and community feedback in one place.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Community Section */}
        <section aria-labelledby="community-heading" className="bg-gray-900 bg-opacity-80 rounded-3xl max-w-5xl mx-auto mb-12">
          <div className="max-w-7xl mx-auto py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto lg:max-w-none">
              <h2 id="community-heading" className="text-2xl font-extrabold tracking-tight text-white">
                Join the Community
              </h2>
              <div className="mt-6 space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-6">
                <div className="group relative">
                  <div className="relative h-48 bg-gray-800 rounded-lg overflow-hidden group-hover:opacity-75" />
                  <h3 className="mt-6 text-sm text-gray-300">
                    <a href="#">
                      <span className="absolute inset-0" />
                      Discord
                    </a>
                  </h3>
                  <p className="text-base font-semibold text-white">Join our Discord server to chat with other users and get support.</p>
                </div>
                <div className="group relative">
                  <div className="relative h-48 bg-gray-800 rounded-lg overflow-hidden group-hover:opacity-75" />
                  <h3 className="mt-6 text-sm text-gray-300">
                    <a href="#">
                      <span className="absolute inset-0" />
                      Twitter
                    </a>
                  </h3>
                  <p className="text-base font-semibold text-white">Follow us on Twitter for the latest news and updates.</p>
                </div>
                <div className="group relative">
                  <div className="relative h-48 bg-gray-800 rounded-lg overflow-hidden group-hover:opacity-75" />
                  <h3 className="mt-6 text-sm text-gray-300">
                    <a href="#">
                      <span className="absolute inset-0" />
                      Blog
                    </a>
                  </h3>
                  <p className="text-base font-semibold text-white">Read our blog for tips, tutorials, and insights into the world of Web3.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

  {/* Footer */}
  <footer aria-labelledby="footer-heading" className="bg-indigo-600 rounded-3xl max-w-5xl mx-auto mb-8">
          <h2 id="footer-heading" className="sr-only">
            Footer
          </h2>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-20 xl:grid xl:grid-cols-3 xl:gap-8">
              <div className="grid grid-cols-2 gap-8 xl:col-span-2">
                <div className="space-y-12 md:space-y-0 md:grid md:grid-cols-2 md:gap-8">
                  <div>
                    <h3 className="text-sm font-medium text-white">Solutions</h3>
                    <ul role="list" className="mt-6 space-y-6">
                      <li className="text-sm">
                        <a href="#" className="text-gray-300 hover:text-white">
                          Marketing
                        </a>
                      </li>
                      <li className="text-sm">
                        <a href="#" className="text-gray-300 hover:text-white">
                          Analytics
                        </a>
                      </li>
                      <li className="text-sm">
                        <a href="#" className="text-gray-300 hover:text-white">
                          Commerce
                        </a>
                      </li>
                      <li className="text-sm">
                        <a href="#" className="text-gray-300 hover:text-white">
                          Insights
                        </a>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">Support</h3>
                    <ul role="list" className="mt-6 space-y-6">
                      <li className="text-sm">
                        <a href="#" className="text-gray-300 hover:text-white">
                          Pricing
                        </a>
                      </li>
                      <li className="text-sm">
                        <a href="#" className="text-gray-300 hover:text-white">
                          Documentation
                        </a>
                      </li>
                      <li className="text-sm">
                        <a href="#" className="text-gray-300 hover:text-white">
                          Guides
                        </a>
                      </li>
                      <li className="text-sm">
                        <a href="#" className="text-gray-300 hover:text-white">
                          API Status
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="space-y-12 md:space-y-0 md:grid md:grid-cols-2 md:gap-8">
                  <div>
                    <h3 className="text-sm font-medium text-white">Company</h3>
                    <ul role="list" className="mt-6 space-y-6">
                      <li className="text-sm">
                        <a href="#" className="text-gray-300 hover:text-white">
                          About
                        </a>
                      </li>
                      <li className="text-sm">
                        <a href="#" className="text-gray-300 hover:text-white">
                          Blog
                        </a>
                      </li>
                      <li className="text-sm">
                        <a href="#" className="text-gray-300 hover:text-white">
                          Jobs
                        </a>
                      </li>
                      <li className="text-sm">
                        <a href="#" className="text-gray-300 hover:text-white">
                          Press
                        </a>
                      </li>
                      <li className="text-sm">
                        <a href="#" className="text-gray-300 hover:text-white">
                          Partners
                        </a>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">Legal</h3>
                    <ul role="list" className="mt-6 space-y-6">
                      <li className="text-sm">
                        <a href="#" className="text-gray-300 hover:text-white">
                          Claim
                        </a>
                      </li>
                      <li className="text-sm">
                        <a href="#" className="text-gray-300 hover:text-white">
                          Privacy
                        </a>
                      </li>
                      <li className="text-sm">
                        <a href="#" className="text-gray-300 hover:text-white">
                          Terms
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="mt-12 xl:mt-0">
                <h3 className="text-sm font-medium text-white">Subscribe to our newsletter</h3>
                <p className="mt-6 text-sm text-gray-300">The latest news, articles, and resources, sent to your inbox weekly.</p>
                <form className="mt-2 flex sm:max-w-md">
                  <label htmlFor="email-address" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="email-address"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none min-w-0 w-full bg-white border border-white rounded-md shadow-sm py-2 px-4 text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white focus:border-white focus:placeholder-gray-400"
                  />
                  <div className="ml-4 flex-shrink-0">
                    <button
                      type="submit"
                      className="w-full bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 flex items-center justify-center text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500"
                    >
                      Subscribe
                    </button>
                  </div>
                </form>
              </div>
            </div>
            <div className="border-t border-gray-800 py-10">
              <p className="text-sm text-gray-400">Copyright &copy; {new Date().getFullYear()} Blockpage411, Inc.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
