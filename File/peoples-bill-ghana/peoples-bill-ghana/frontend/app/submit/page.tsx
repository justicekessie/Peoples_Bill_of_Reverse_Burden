'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle, Info } from 'lucide-react'
import { submitSubmission } from '@/lib/api'
import { useToast } from '@/hooks/useToast'

// Ghana's 16 regions
const GHANA_REGIONS = [
  "Greater Accra", "Ashanti", "Western", "Eastern", "Central",
  "Volta", "Oti", "Northern", "North East", "Savannah",
  "Upper East", "Upper West", "Bono", "Bono East", "Ahafo", "Western North"
]

// Form validation schema
const submissionSchema = z.object({
  content: z.string()
    .min(10, 'Your submission must be at least 10 characters')
    .max(5000, 'Your submission must be less than 5000 characters'),
  region: z.string().min(1, 'Please select your region'),
  age: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  occupation: z.string().optional(),
  agree_terms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms'
  })
})

type SubmissionForm = z.infer<typeof submissionSchema>

export default function SubmitPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [charCount, setCharCount] = useState(0)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm<SubmissionForm>({
    resolver: zodResolver(submissionSchema)
  })
  
  // Watch content for character count
  const content = watch('content', '')
  
  const onSubmit = async (data: SubmissionForm) => {
    setIsSubmitting(true)
    
    try {
      const response = await submitSubmission({
        content: data.content,
        region: data.region,
        age: data.age,
        occupation: data.occupation,
        language: 'en'
      })
      
      setSubmitted(true)
      toast({
        title: 'Submission Received!',
        description: 'Thank you for contributing to Ghana\'s democratic future.',
        variant: 'success'
      })
      
      // Reset form after short delay
      setTimeout(() => {
        reset()
        setSubmitted(false)
      }, 5000)
      
    } catch (error) {
      toast({
        title: 'Submission Failed',
        description: 'Please try again or contact support if the problem persists.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Thank You for Your Submission!
          </h1>
          <p className="text-gray-600 mb-6">
            Your voice has been heard. Your input will help shape the People's Bill 
            on Reverse Burden.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setSubmitted(false)
                reset()
              }}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Submit Another
            </button>
            <button
              onClick={() => router.push('/bill')}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              View Draft Bill
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Share Your Voice
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Help create legislation that fights corruption and ensures accountability. 
          Every submission matters in shaping Ghana's future.
        </p>
      </div>
      
      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <div className="flex">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">What to include in your submission:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>Your thoughts on how public officials should declare their assets</li>
              <li>Suggestions for investigation procedures</li>
              <li>Ideas for penalties for unexplained wealth</li>
              <li>Concerns about fairness and due process</li>
              <li>Any other relevant suggestions for the bill</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Submission Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Main Submission */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            Your Submission <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('content', {
              onChange: (e) => setCharCount(e.target.value.length)
            })}
            rows={8}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            placeholder="Share your thoughts on the Reverse Burden bill. What provisions should it include? What concerns do you have? How can it best serve Ghana?"
          />
          <div className="mt-2 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {charCount}/5000 characters
            </div>
            {errors.content && (
              <p className="text-sm text-red-600">{errors.content.message}</p>
            )}
          </div>
        </div>
        
        {/* Region */}
        <div>
          <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
            Your Region <span className="text-red-500">*</span>
          </label>
          <select
            {...register('region')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
          >
            <option value="">Select your region</option>
            {GHANA_REGIONS.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
          {errors.region && (
            <p className="text-sm text-red-600 mt-1">{errors.region.message}</p>
          )}
        </div>
        
        {/* Optional Demographics */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
              Age (Optional)
            </label>
            <input
              type="number"
              {...register('age')}
              min="18"
              max="120"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              placeholder="Your age"
            />
          </div>
          
          <div>
            <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 mb-2">
              Occupation (Optional)
            </label>
            <input
              type="text"
              {...register('occupation')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              placeholder="e.g., Teacher, Farmer, Student"
            />
          </div>
        </div>
        
        {/* Terms Agreement */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start">
            <input
              type="checkbox"
              {...register('agree_terms')}
              className="mt-1 h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="agree_terms" className="ml-3 text-sm text-gray-700">
              I understand that my submission will be used to help draft the People's Bill 
              on Reverse Burden. My submission will be anonymized and aggregated with others. 
              I am a Ghanaian citizen or resident interested in Ghana's democratic development.
            </label>
          </div>
          {errors.agree_terms && (
            <p className="text-sm text-red-600 mt-2 ml-7">{errors.agree_terms.message}</p>
          )}
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-center pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Submitting...
              </>
            ) : (
              'Submit Your Input'
            )}
          </button>
        </div>
      </form>
      
      {/* Privacy Note */}
      <div className="mt-12 text-center text-sm text-gray-500">
        <p>
          Your privacy is important to us. Submissions are anonymized and no personal 
          information will be shared publicly. 
          <a href="/privacy" className="text-green-600 hover:text-green-700 ml-1">
            Learn more about our privacy policy
          </a>
        </p>
      </div>
    </div>
  )
}
