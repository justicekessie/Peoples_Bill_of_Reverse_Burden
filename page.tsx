'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Users, MapPin, FileText, TrendingUp, Shield, Vote, MessageSquare } from 'lucide-react'
import { motion } from 'framer-motion'
import { useStats } from '@/hooks/useStats'

export default function HomePage() {
  const { data: stats, isLoading } = useStats()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-600 via-yellow-500 to-red-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Shape Ghana's Future
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
              Join thousands of Ghanaians in creating the People's Bill on Reverse Burden 
              - legislation to combat corruption and ensure accountability in public service.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/submit"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-green-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Submit Your Input
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              
              <Link
                href="/bill"
                className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-green-700 transition-colors"
              >
                Read the Draft Bill
                <FileText className="ml-2 h-5 w-5" />
              </Link>
            </div>
            
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <div className="text-3xl font-bold">
                  {mounted ? (stats?.total_submissions || '0').toLocaleString() : '...'}
                </div>
                <div className="text-sm text-white/80">Submissions</div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <div className="text-3xl font-bold">
                  {mounted ? (stats?.regions_represented || '0') : '...'}
                </div>
                <div className="text-sm text-white/80">Regions Active</div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <div className="text-3xl font-bold">
                  {mounted ? (stats?.clusters_formed || '0') : '...'}
                </div>
                <div className="text-sm text-white/80">Themes Identified</div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center"
              >
                <div className="text-3xl font-bold">
                  {mounted ? (stats?.clauses_drafted || '0') : '...'}
                </div>
                <div className="text-sm text-white/80">Clauses Drafted</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
        
        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" 
                  fill="white"/>
          </svg>
        </div>
      </section>

      {/* What is Reverse Burden Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What is the Reverse Burden Bill?
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              A groundbreaking legislation that shifts the burden of proof to public officials 
              to explain wealth that doesn't match their legitimate income.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-green-50 rounded-lg p-6"
            >
              <Shield className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Fight Corruption
              </h3>
              <p className="text-gray-600">
                Public officials must explain how they acquired assets beyond their 
                legitimate income, making corruption harder to hide.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-yellow-50 rounded-lg p-6"
            >
              <Vote className="h-12 w-12 text-yellow-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Citizen-Driven
              </h3>
              <p className="text-gray-600">
                Every clause is shaped by citizen input, ensuring the law reflects 
                the will and needs of the Ghanaian people.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-red-50 rounded-lg p-6"
            >
              <TrendingUp className="h-12 w-12 text-red-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Build Trust
              </h3>
              <p className="text-gray-600">
                Restore public confidence in government by ensuring those in power 
                are held to the highest standards of accountability.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How Your Voice Shapes the Law
            </h2>
            <p className="text-lg text-gray-600">
              A transparent, AI-powered process that turns citizen input into legislation
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-green-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="font-semibold mb-2">Submit</h3>
              <p className="text-sm text-gray-600">
                Share your ideas, concerns, and suggestions through our platform
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-yellow-500 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="font-semibold mb-2">Cluster</h3>
              <p className="text-sm text-gray-600">
                AI groups similar submissions to identify common themes
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-red-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="font-semibold mb-2">Draft</h3>
              <p className="text-sm text-gray-600">
                Legal experts transform themes into formal bill clauses
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-gray-800 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                4
              </div>
              <h3 className="font-semibold mb-2">Parliament</h3>
              <p className="text-sm text-gray-600">
                The people's bill is submitted to Ghana's Parliament
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Regional Participation */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Every Region, Every Voice Matters
            </h2>
            <p className="text-lg text-gray-600">
              Participation from all 16 regions ensures national representation
            </p>
          </div>
          
          {stats && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-green-600" />
                Regional Participation
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(stats.submissions_by_region || {})
                  .sort(([,a], [,b]) => (b as number) - (a as number))
                  .slice(0, 8)
                  .map(([region, count]) => (
                    <div key={region} className="flex justify-between">
                      <span className="text-sm text-gray-600">{region}</span>
                      <span className="text-sm font-semibold">{count}</span>
                    </div>
                  ))}
              </div>
              <div className="mt-4 text-center">
                <Link href="/stats" className="text-green-600 hover:text-green-700 text-sm font-medium">
                  View all regions →
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <MessageSquare className="h-16 w-16 mx-auto mb-6 text-white/80" />
          <h2 className="text-3xl font-bold mb-4">
            Your Voice Can Change Ghana
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Join thousands of citizens already shaping this historic legislation. 
            Every submission counts, every voice matters.
          </p>
          <Link
            href="/submit"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-green-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Submit Your Input Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <p className="mt-4 text-sm text-white/70">
            Takes only 2 minutes · Available in English, Twi & Ga (coming soon)
          </p>
        </div>
      </section>
    </>
  )
}