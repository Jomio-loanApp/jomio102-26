
import React from 'react'
import { useParams } from 'react-router-dom'
import Header from '@/components/Header'

const CategoryPage = () => {
  const { categoryId } = useParams()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Category: {categoryId}</h1>
        <p className="text-gray-600">Category page content will be implemented here.</p>
      </div>
    </div>
  )
}

export default CategoryPage
