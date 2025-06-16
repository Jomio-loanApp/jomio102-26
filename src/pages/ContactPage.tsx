
import React from 'react'
import Header from '@/components/Header'
import { Card } from '@/components/ui/card'
import { Mail, Phone, MapPin } from 'lucide-react'

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Get in Touch</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-green-600" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-green-600" />
                <span>support@jomiostore.com</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-green-600" />
                <span>123 Store Street, City, State 123456</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Customer Support</h2>
            <p className="text-gray-600 mb-4">
              We're here to help! Reach out to us for any questions about orders, 
              products, or general inquiries.
            </p>
            <p className="text-sm text-gray-500">
              Support Hours: Monday - Sunday, 9:00 AM - 9:00 PM
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ContactPage
