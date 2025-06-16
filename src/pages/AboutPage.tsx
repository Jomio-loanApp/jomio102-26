
import React from 'react'
import Header from '@/components/Header'

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">About JOMIO Store</h1>
        <div className="space-y-4 text-gray-700">
          <p>
            Welcome to JOMIO Store, your trusted partner for fresh groceries and daily essentials.
          </p>
          <p>
            We are committed to providing high-quality products at competitive prices, delivered
            right to your doorstep with convenience and care.
          </p>
          <p>
            Our mission is to make grocery shopping simple, efficient, and enjoyable for everyone.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AboutPage
