'use client';

import ProductShowcase from './components/ProductShowcase'
import Navbar from './components/Navbar'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        <ProductShowcase />
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-500 text-sm">
              Fingerprint 3DS Demo
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
} 