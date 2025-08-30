import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables')
}

// Initialize Stripe with the secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Use latest stable API version
})

// Client-side publishable key
export const getStripePublishableKey = () => {
  if (!process.env.STRIPE_PUBLIC_KEY) {
    throw new Error('STRIPE_PUBLIC_KEY is not defined in environment variables')
  }
  return process.env.STRIPE_PUBLIC_KEY
}
