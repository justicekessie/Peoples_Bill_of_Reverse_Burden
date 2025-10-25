'use client'

import { useState, useEffect } from 'react'
import { FileText, Users, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getBillClauses, getFullBill, submitVote } from '@/lib/api'
import { useToast } from '@/hooks/useToast'
import { formatNumber } from '@/lib/utils'

interface BillClause {
  id: number
  section_number: number
  title: string
  content: string
  rationale: string
  cluster_id: number
  submission_count: number
  approval_rate: number
  created_at: string
  updated_at: string
}

export default function BillPage() {
  const [clauses, setClauses] = useState<BillClause[]>([])
  const [fullBill, setFullBill] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [expandedClause, setExpandedClause] = useState<number | null>(null)
  const [votedClauses, setVotedClauses] = useState<Set<number>>(new Set())
  const [viewMode, setViewMode] = useState<'sections' | 'full'>('sections')
  const { toast } = useToast()

  useEffect(() => {
    loadBillData()
  }, [])

  const loadBillData = async () => {
    try {
      const [clausesData, billData] = await Promise.all([
        getBillClauses(),
        getFullBill()
      ])
      setClauses(clausesData)
      setFullBill(billData)
    } catch (error) {
      toast({
        title: 'Error loading bill',
        description: 'Please try refreshing the page',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (clauseId: number, voteType: 'approve' | 'reject') => {
    if (votedClauses.has(clauseId)) {
      toast({
        title: 'Already voted',
        description: 'You have already voted on this clause',
        variant: 'default'
      })
      return
    }

    try {
      await submitVote(clauseId, voteType)
      setVotedClauses(new Set([...votedClauses, clauseId]))
      
      // Update local approval rate
      setClauses(clauses.map(clause => {
        if (clause.id === clauseId) {
          const adjustment = voteType === 'approve' ? 0.5 : -0.5
          return {
            ...clause,
            approval_rate: Math.max(0, Math.min(100, clause.approval_rate + adjustment))
          }
        }
        return clause
      }))
      
      toast({
        title: 'Vote recorded',
        description: 'Thank you for your feedback!',
        variant: 'success'
      })
    } catch (error) {
      toast({
        title: 'Vote failed',
        description: 'Please try again later',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading the People's Bill...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          The People's Bill on Reverse Burden
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-6">
          Every clause below has been shaped by citizen submissions. This is democracy in action - 
          a bill written by the people, for the people.
        </p>
        
        {/* View Mode Toggle */}
        <div className="inline-flex rounded-lg border border-gray-200 p-1">
          <button
            onClick={() => setViewMode('sections')}
            className={`px-4 py-2 rounded-md transition-colors ${
              viewMode === 'sections'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            View by Sections
          </button>
          <button
            onClick={() => setViewMode('full')}
            className={`px-4 py-2 rounded-md transition-colors ${
              viewMode === 'full'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Full Document
          </button>
        </div>
      </div>

      {/* Bill Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sections</p>
              <p className="text-2xl font-bold text-gray-900">{clauses.length}</p>
            </div>
            <FileText className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Citizen Contributors</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(clauses.reduce((sum, c) => sum + c.submission_count, 0))}
              </p>
            </div>
            <Users className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Approval</p>
              <p className="text-2xl font-bold text-gray-900">
                {clauses.length > 0 
                  ? Math.round(clauses.reduce((sum, c) => sum + c.approval_rate, 0) / clauses.length)
                  : 0}%
              </p>
            </div>
            <ThumbsUp className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Bill Content */}
      {viewMode === 'sections' ? (
        <div className="space-y-6">
          {clauses.map((clause) => (
            <motion.div
              key={clause.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              {/* Clause Header */}
              <div
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedClause(expandedClause === clause.id ? null : clause.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Section {clause.section_number}
                      </span>
                      <span className="text-sm text-gray-500">
                        {clause.submission_count} submissions
                      </span>
                      <span className="text-sm text-gray-500">
                        {Math.round(clause.approval_rate)}% approval
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {clause.title}
                    </h3>
                    <p className="mt-2 text-gray-600 line-clamp-2">
                      {clause.content}
                    </p>
                  </div>
                  <div className="ml-4">
                    {expandedClause === clause.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              <AnimatePresence>
                {expandedClause === clause.id && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 border-t border-gray-100">
                      {/* Full Content */}
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-900 mb-2">Full Text:</h4>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {clause.content}
                        </p>
                      </div>

                      {/* Rationale */}
                      {clause.rationale && (
                        <div className="mt-4">
                          <h4 className="font-medium text-gray-900 mb-2">Rationale:</h4>
                          <p className="text-gray-600">
                            {clause.rationale}
                          </p>
                        </div>
                      )}

                      {/* Voting */}
                      <div className="mt-6 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => handleVote(clause.id, 'approve')}
                            disabled={votedClauses.has(clause.id)}
                            className="inline-flex items-center px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <ThumbsUp className="h-4 w-4 mr-2" />
                            Support
                          </button>
                          <button
                            onClick={() => handleVote(clause.id, 'reject')}
                            disabled={votedClauses.has(clause.id)}
                            className="inline-flex items-center px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <ThumbsDown className="h-4 w-4 mr-2" />
                            Oppose
                          </button>
                        </div>
                        
                        <div className="text-sm text-gray-500">
                          <MessageCircle className="h-4 w-4 inline mr-1" />
                          Based on {clause.submission_count} citizen inputs
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Full Document View */
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-center text-2xl font-bold mb-6">
              THE PEOPLE'S BILL ON REVERSE BURDEN
            </h2>
            <p className="text-center italic mb-8">
              An Act to require public officers to explain wealth disproportionate to their 
              lawful income and to provide for the confiscation of unexplained assets.
            </p>
            <p className="font-semibold mb-8">
              BE IT ENACTED by the Parliament of Ghana as follows:
            </p>
            
            <div className="space-y-8">
              {clauses.map((clause) => (
                <div key={clause.id}>
                  <h3 className="font-bold mb-2">
                    SECTION {clause.section_number}: {clause.title}
                  </h3>
                  <p className="whitespace-pre-wrap">
                    {clause.content}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="mt-12 pt-8 border-t border-gray-300">
              <p className="text-center text-sm text-gray-600">
                This draft bill was created through the collaborative input of {formatNumber(
                  clauses.reduce((sum, c) => sum + c.submission_count, 0)
                )} citizen submissions from all 16 regions of Ghana.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Download Section */}
      <div className="mt-12 text-center">
        <div className="inline-flex space-x-4">
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
          >
            Print Bill
          </button>
          <button
            onClick={async () => {
              const data = await getFullBill()
              const blob = new Blob([data.full_text], { type: 'text/plain' })
              const url = window.URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'peoples-bill-reverse-burden.txt'
              a.click()
            }}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Download Text
          </button>
        </div>
      </div>
    </div>
  )
}
