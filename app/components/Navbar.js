import { Disclosure } from '@headlessui/react'
import { Bars3Icon, XMarkIcon, ShoppingCartIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useFingerprintODI } from './FingerprintProvider'

const navigation = [
  { name: 'Products', href: '/', current: false },
  { name: 'About', href: '/about', current: false },
  { name: 'Support', href: '/support', current: false },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Navbar() {
  const { resetEnvironment } = useFingerprintODI();

  const handleResetEnvironment = () => {
    resetEnvironment();
    // More specific feedback for the user
    alert('Environment reset completed! Fingerprint cookies cleared, latency reset, and new identification process started.');
  };

  return (
    <Disclosure as="nav" className="bg-white shadow-md">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative flex h-16 items-center justify-between">
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                {/* Mobile menu button*/}
                <Disclosure.Button className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                  <span className="absolute -inset-0.5" />
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
              <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                <Link href="/" className="flex shrink-0 items-center cursor-pointer">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">AI</span>
                  </div>
                  <span className="ml-2 text-xl font-bold text-indigo-600">Hyper AI</span>
                </Link>
                <div className="hidden sm:ml-8 sm:block">
                  <div className="flex space-x-4">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={classNames(
                          item.current ? 'text-indigo-600 border-b-2 border-indigo-500' : 'text-gray-600 hover:text-indigo-600 hover:border-b-2 hover:border-indigo-300',
                          'px-3 py-2 text-sm font-medium'
                        )}
                        aria-current={item.current ? 'page' : undefined}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                {/* Reset Environment Button */}
                <button
                  onClick={handleResetEnvironment}
                  className="mr-3 rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center"
                  title="Reset Environment"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-1.5" aria-hidden="true" />
                  Reset
                </button>
                
                {/* User account link - can be linked to a login page */}
                <Link 
                  href="/checkout"
                  className="relative rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center"
                >
                  <ShoppingCartIcon className="h-4 w-4 mr-1.5" aria-hidden="true" />
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center text-xs text-white">1</span>
                  Checkout
                </Link>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={classNames(
                    item.current ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600',
                    'block rounded-md px-3 py-2 text-base font-medium'
                  )}
                  aria-current={item.current ? 'page' : undefined}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Mobile Reset Environment Button */}
              <button
                onClick={handleResetEnvironment}
                className="w-full text-left text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 block rounded-md px-3 py-2 text-base font-medium"
              >
                Reset Environment
              </button>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  )
} 