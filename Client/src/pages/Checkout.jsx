import { useState, useContext, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import Button from '../components/Common/Button'
import CartContext from '../contexts/CartContext'
import useAuth from '../hooks/useAuth'
import api from '../utils/api'
import { toast } from 'react-toastify'
import { FiCheck, FiX } from 'react-icons/fi'

// Form validation schema
const schema = yup.object().shape({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone number is required'),
  address: yup.string().required('Address is required'),
  city: yup.string().required('City is required'),
  state: yup.string().required('State/Province is required'),
  zipCode: yup.string().required('ZIP/Postal code is required'),
  country: yup.string().required('Country is required'),
  paymentMethod: yup.string().required('Payment method is required'),
  cardName: yup.string().when('paymentMethod', {
    is: 'credit-card',
    then: () => yup.string().required('Name on card is required'),
  }),
  cardNumber: yup.string().when('paymentMethod', {
    is: 'credit-card',
    then: () => yup.string().required('Card number is required')
      .matches(/^[0-9]{16}$/, 'Card number must be 16 digits'),
  }),
  cardExpiry: yup.string().when('paymentMethod', {
    is: 'credit-card',
    then: () => yup.string().required('Expiration date is required')
      .matches(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, 'Expiry date must be in MM/YY format'),
  }),
  cardCvc: yup.string().when('paymentMethod', {
    is: 'credit-card',
    then: () => yup.string().required('CVC is required')
      .matches(/^[0-9]{3,4}$/, 'CVC must be 3 or 4 digits'),
  }),
  termsAccepted: yup.boolean().oneOf([true], 'You must accept the terms and conditions'),
})

const Checkout = () => {
  const { 
    cart: cartItems, 
    getCartTotal, 
    clearCart,
    couponCode,
    couponDiscount,
    couponError,
    applyCoupon,
    removeCoupon
  } = useContext(CartContext)
  
  const [couponInput, setCouponInput] = useState('')
  const [applyingCoupon, setApplyingCoupon] = useState(false)
  
  const totalPrice = getCartTotal()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [isLoadingAddress, setIsLoadingAddress] = useState(false)
  
  // Handle coupon application
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) {
      toast.error('Please enter a coupon code')
      return
    }
    
    setApplyingCoupon(true)
    const result = await applyCoupon(couponInput.trim())
    setApplyingCoupon(false)
    
    if (!result.success) {
      toast.error(result.error || 'Failed to apply coupon')
    }
  }
  
  // Initialize form with user data if available
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
      paymentMethod: 'credit-card',
      termsAccepted: false
    }
  })
  
  // Fetch user profile and default address when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        setIsLoadingAddress(true);
        
        // Fetch user profile to get complete user details
        const profileResponse = await api.get('/user/profile');
        const userData = profileResponse.data.data;
        
        // Update form with user profile data
        if (userData) {
          setValue('firstName', userData.firstName || userData.name?.split(' ')[0] || '');
          setValue('lastName', userData.lastName || userData.name?.split(' ')[1] || '');
          setValue('email', userData.email || '');
          setValue('phone', userData.phone || '');
        }
        
        // Fetch default address
        const addressResponse = await api.get('/user/default-address');
        const defaultAddress = addressResponse.data.data;
        
        // Update form with default address if available
        if (defaultAddress) {
          setValue('address', defaultAddress.line1 || '');
          setValue('city', defaultAddress.city || '');
          setValue('state', defaultAddress.state || '');
          setValue('zipCode', defaultAddress.zip || '');
          setValue('country', defaultAddress.country || 'United States');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Don't show error toast as this is a background operation
      } finally {
        setIsLoadingAddress(false);
      }
    };
    
    fetchUserData();
  }, [user, setValue]);
  
  // Watch payment method for conditional fields
  const paymentMethod = watch('paymentMethod')
  
  // Calculate order summary
  const subtotal = totalPrice
  const shippingCost = subtotal > 100 ? 0 : 10
  const tax = subtotal * 0.07 // 7% tax rate
  const total = subtotal + shippingCost + tax
  
  // Handle form submission
  const onSubmit = async (data) => {
    try {
      // Format shipping address for API
      const shippingAddress = {
        line1: data.address,
        city: data.city,
        state: data.state,
        zip: data.zipCode,
        country: data.country,
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        phone: data.phone
      };
    
      // Create order payload
      const orderPayload = {
        shippingAddress,
        paymentMethod: data.paymentMethod,
        // Include cart items in the payload
        items: cartItems.map(item => ({
          productId: item.id || item._id,
          quantity: item.quantity,
          price: item.price,
          size: item.size || null,
          color: item.color || null
        })),
        subtotal,
        shippingCost,
        tax,
        total
      };
    
      // Send order to API
      const response = await api.post('/orders', orderPayload);
      
      // Handle successful order
      if (response.data.success) {
        // Set order ID from response
        setOrderId(response.data.data._id || 'ORD-' + Math.random().toString(36).substring(2, 10).toUpperCase());
        setOrderPlaced(true);
        clearCart();
        toast.success('Order placed successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        });
      } else {
        toast.error('Failed to place order: ' + (response.data.error || 'Unknown error'), {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        });
      }
    } catch (error) {
      console.error('Order error:', error);
      toast.error('Failed to place order: ' + (error.response?.data?.error || error.message || 'Unknown error'), {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    }
  }
  
  // If cart is empty, redirect to cart page
  if (cartItems.length === 0 && !orderPlaced) {
    return (
      <div className="bg-gray-50 py-12">
        <div className="container-custom">
          <div className="bg-white p-8 rounded-lg shadow-sm text-center max-w-2xl mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h1 className="text-2xl font-semibold mb-4">Your Cart is Empty</h1>
            <p className="text-gray-600 mb-8">You need to add items to your cart before checking out.</p>
            <Link to="/shop">
              <Button>Shop Now</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }
  
  // Order confirmation screen
  if (orderPlaced) {
    return (
      <div className="bg-gray-50 py-12">
        <div className="container-custom">
          <div className="bg-white p-8 rounded-lg shadow-sm max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold mb-4">Order Placed Successfully!</h1>
            <p className="text-gray-600 mb-2">Thank you for your purchase.</p>
            <p className="text-gray-600 mb-6">Your order number is: <span className="font-semibold">{orderId}</span></p>
            <p className="text-gray-600 mb-8">We've sent a confirmation email with your order details.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/shop">
                <Button>Continue Shopping</Button>
              </Link>
              <Link to="/account/orders">
                <Button variant="secondary">View Orders</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-gray-50 py-12">
      <div className="container-custom">
        <h1 className="text-3xl font-heading font-semibold mb-8">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Shipping Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      id="firstName"
                      {...register('firstName')}
                      className={`w-full px-3 py-2 border rounded-md text-sm ${errors.firstName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-teal focus:border-teal'}`}
                    />
                    {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      id="lastName"
                      {...register('lastName')}
                      className={`w-full px-3 py-2 border rounded-md text-sm ${errors.lastName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-teal focus:border-teal'}`}
                    />
                    {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      {...register('email')}
                      className={`w-full px-3 py-2 border rounded-md text-sm ${errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-teal focus:border-teal'}`}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      {...register('phone')}
                      className={`w-full px-3 py-2 border rounded-md text-sm ${errors.phone ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-teal focus:border-teal'}`}
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      id="address"
                      {...register('address')}
                      className={`w-full px-3 py-2 border rounded-md text-sm ${errors.address ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-teal focus:border-teal'}`}
                    />
                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      id="city"
                      {...register('city')}
                      className={`w-full px-3 py-2 border rounded-md text-sm ${errors.city ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-teal focus:border-teal'}`}
                    />
                    {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                    <input
                      type="text"
                      id="state"
                      {...register('state')}
                      className={`w-full px-3 py-2 border rounded-md text-sm ${errors.state ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-teal focus:border-teal'}`}
                    />
                    {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">ZIP/Postal Code</label>
                    <input
                      type="text"
                      id="zipCode"
                      {...register('zipCode')}
                      className={`w-full px-3 py-2 border rounded-md text-sm ${errors.zipCode ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-teal focus:border-teal'}`}
                    />
                    {errors.zipCode && <p className="text-red-500 text-xs mt-1">{errors.zipCode.message}</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <select
                      id="country"
                      {...register('country')}
                      className={`w-full px-3 py-2 border rounded-md text-sm ${errors.country ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-teal focus:border-teal'}`}
                    >
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Australia">Australia</option>
                      <option value="Germany">Germany</option>
                      <option value="France">France</option>
                      <option value="Japan">Japan</option>
                      <option value="China">China</option>
                      <option value="India">India</option>
                    </select>
                    {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country.message}</p>}
                  </div>
                </div>
              </div>
              
              {/* Payment Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="credit-card"
                      type="radio"
                      value="credit-card"
                      {...register('paymentMethod')}
                      className="h-4 w-4 text-teal border-gray-300 focus:ring-teal"
                    />
                    <label htmlFor="credit-card" className="ml-2 block text-sm font-medium text-gray-700">
                      Credit Card
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="paypal"
                      type="radio"
                      value="paypal"
                      {...register('paymentMethod')}
                      className="h-4 w-4 text-teal border-gray-300 focus:ring-teal"
                    />
                    <label htmlFor="paypal" className="ml-2 block text-sm font-medium text-gray-700">
                      PayPal
                    </label>
                  </div>
                  
                  {paymentMethod === 'credit-card' && (
                    <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label htmlFor="cardName" className="block text-sm font-medium text-gray-700 mb-1">Name on Card</label>
                          <input
                            type="text"
                            id="cardName"
                            {...register('cardName')}
                            className={`w-full px-3 py-2 border rounded-md text-sm ${errors.cardName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-teal focus:border-teal'}`}
                          />
                          {errors.cardName && <p className="text-red-500 text-xs mt-1">{errors.cardName.message}</p>}
                        </div>
                        
                        <div className="md:col-span-2">
                          <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                          <input
                            type="text"
                            id="cardNumber"
                            placeholder="XXXX XXXX XXXX XXXX"
                            {...register('cardNumber')}
                            className={`w-full px-3 py-2 border rounded-md text-sm ${errors.cardNumber ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-teal focus:border-teal'}`}
                          />
                          {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber.message}</p>}
                        </div>
                        
                        <div>
                          <label htmlFor="cardExpiry" className="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
                          <input
                            type="text"
                            id="cardExpiry"
                            placeholder="MM/YY"
                            {...register('cardExpiry')}
                            className={`w-full px-3 py-2 border rounded-md text-sm ${errors.cardExpiry ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-teal focus:border-teal'}`}
                          />
                          {errors.cardExpiry && <p className="text-red-500 text-xs mt-1">{errors.cardExpiry.message}</p>}
                        </div>
                        
                        <div>
                          <label htmlFor="cardCvc" className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                          <input
                            type="text"
                            id="cardCvc"
                            placeholder="XXX"
                            {...register('cardCvc')}
                            className={`w-full px-3 py-2 border rounded-md text-sm ${errors.cardCvc ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-teal focus:border-teal'}`}
                          />
                          {errors.cardCvc && <p className="text-red-500 text-xs mt-1">{errors.cardCvc.message}</p>}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {paymentMethod === 'paypal' && (
                    <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50 text-center">
                      <p className="text-sm text-gray-600 mb-2">You will be redirected to PayPal to complete your payment.</p>
                      <svg className="h-10 w-auto mx-auto" viewBox="0 0 101 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M37.6 9.5H32.2C31.9 9.5 31.6 9.7 31.5 10L29.4 23.5C29.4 23.7 29.5 23.9 29.7 23.9H32.2C32.5 23.9 32.8 23.7 32.9 23.4L33.5 19.6C33.6 19.3 33.9 19.1 34.2 19.1H35.9C39.1 19.1 41 17.5 41.5 14.5C41.7 13.3 41.5 12.3 40.9 11.6C40.2 10.3 39 9.5 37.6 9.5ZM38.2 14.7C37.9 16.5 36.5 16.5 35.2 16.5H34.4L35 12.7C35 12.6 35.1 12.5 35.2 12.5H35.6C36.5 12.5 37.3 12.5 37.7 13C38 13.3 38.1 13.9 38.2 14.7Z" fill="#253B80"/>
                        <path d="M53.1 14.6H50.6C50.5 14.6 50.4 14.7 50.4 14.8L50.2 16L50 15.7C49.4 14.8 48.2 14.5 47 14.5C44.5 14.5 42.4 16.4 42 18.9C41.8 20.1 42.1 21.3 42.8 22.1C43.4 22.9 44.4 23.2 45.5 23.2C47.5 23.2 48.6 21.9 48.6 21.9L48.4 23.1C48.4 23.3 48.5 23.5 48.7 23.5H51C51.3 23.5 51.6 23.3 51.7 23L53.4 15C53.5 14.8 53.3 14.6 53.1 14.6ZM49.3 19C49.1 20.2 48.1 21 46.9 21C46.3 21 45.8 20.8 45.5 20.5C45.2 20.2 45.1 19.7 45.2 19.2C45.4 18 46.4 17.2 47.5 17.2C48.1 17.2 48.6 17.4 48.9 17.7C49.2 18 49.4 18.5 49.3 19Z" fill="#253B80"/>
                        <path d="M68.7 14.6H66.2C66 14.6 65.8 14.7 65.7 14.9L62.6 19.4L61.3 15.1C61.2 14.8 61 14.6 60.7 14.6H58.3C58.1 14.6 57.9 14.8 58 15L60.5 22.7L58.1 26.1C58 26.3 58.1 26.6 58.4 26.6H60.9C61.1 26.6 61.3 26.5 61.4 26.3L69 15.1C69.1 14.9 69 14.6 68.7 14.6Z" fill="#253B80"/>
                        <path d="M78.5 9.5H73.1C72.8 9.5 72.5 9.7 72.4 10L70.3 23.5C70.3 23.7 70.4 23.9 70.6 23.9H73.2C73.4 23.9 73.6 23.8 73.6 23.6L74.2 19.6C74.3 19.3 74.6 19.1 74.9 19.1H76.6C79.8 19.1 81.7 17.5 82.2 14.5C82.4 13.3 82.2 12.3 81.6 11.6C80.9 10.3 79.8 9.5 78.5 9.5ZM79 14.7C78.7 16.5 77.3 16.5 76 16.5H75.2L75.8 12.7C75.8 12.6 75.9 12.5 76 12.5H76.4C77.3 12.5 78.1 12.5 78.5 13C78.8 13.3 79 13.9 79 14.7Z" fill="#179BD7"/>
                        <path d="M93.9 14.6H91.4C91.3 14.6 91.2 14.7 91.2 14.8L91 16L90.8 15.7C90.2 14.8 89 14.5 87.8 14.5C85.3 14.5 83.2 16.4 82.8 18.9C82.6 20.1 82.9 21.3 83.6 22.1C84.2 22.9 85.2 23.2 86.3 23.2C88.3 23.2 89.4 21.9 89.4 21.9L89.2 23.1C89.2 23.3 89.3 23.5 89.5 23.5H91.8C92.1 23.5 92.4 23.3 92.5 23L94.2 15C94.3 14.8 94.1 14.6 93.9 14.6ZM90.1 19C89.9 20.2 88.9 21 87.7 21C87.1 21 86.6 20.8 86.3 20.5C86 20.2 85.9 19.7 86 19.2C86.2 18 87.2 17.2 88.3 17.2C88.9 17.2 89.4 17.4 89.7 17.7C90 18 90.2 18.5 90.1 19Z" fill="#179BD7"/>
                        <path d="M97.4 10L95.3 23.5C95.3 23.7 95.4 23.9 95.6 23.9H97.8C98.1 23.9 98.4 23.7 98.5 23.4L100.6 10C100.6 9.8 100.5 9.6 100.3 9.6H97.7C97.6 9.5 97.5 9.7 97.4 10Z" fill="#179BD7"/>
                        <path d="M14.4 9.5H8.9C8.6 9.5 8.3 9.7 8.2 10L6.1 23.5C6.1 23.7 6.2 23.9 6.4 23.9H9.1C9.4 23.9 9.7 23.7 9.8 23.4L10.4 19.6C10.5 19.3 10.8 19.1 11.1 19.1H12.8C16 19.1 17.9 17.5 18.4 14.5C18.6 13.3 18.4 12.3 17.8 11.6C17.1 10.3 15.9 9.5 14.4 9.5ZM15 14.7C14.7 16.5 13.3 16.5 12 16.5H11.2L11.8 12.7C11.8 12.6 11.9 12.5 12 12.5H12.4C13.3 12.5 14.1 12.5 14.5 13C14.8 13.3 15 13.9 15 14.7Z" fill="#253B80"/>
                        <path d="M29.9 14.6H27.4C27.3 14.6 27.2 14.7 27.2 14.8L27 16L26.8 15.7C26.2 14.8 25 14.5 23.8 14.5C21.3 14.5 19.2 16.4 18.8 18.9C18.6 20.1 18.9 21.3 19.6 22.1C20.2 22.9 21.2 23.2 22.3 23.2C24.3 23.2 25.4 21.9 25.4 21.9L25.2 23.1C25.2 23.3 25.3 23.5 25.5 23.5H27.8C28.1 23.5 28.4 23.3 28.5 23L30.2 15C30.3 14.8 30.1 14.6 29.9 14.6ZM26.1 19C25.9 20.2 24.9 21 23.7 21C23.1 21 22.6 20.8 22.3 20.5C22 20.2 21.9 19.7 22 19.2C22.2 18 23.2 17.2 24.3 17.2C24.9 17.2 25.4 17.4 25.7 17.7C26 18 26.2 18.5 26.1 19Z" fill="#253B80"/>
                        <path d="M33.4 10L31.3 23.5C31.3 23.7 31.4 23.9 31.6 23.9H33.8C34.1 23.9 34.4 23.7 34.5 23.4L36.6 10C36.6 9.8 36.5 9.6 36.3 9.6H33.7C33.6 9.5 33.5 9.7 33.4 10Z" fill="#253B80"/>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Terms and Conditions */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="termsAccepted"
                      type="checkbox"
                      {...register('termsAccepted')}
                      className={`h-4 w-4 ${errors.termsAccepted ? 'text-red-500 border-red-500 focus:ring-red-500' : 'text-teal border-gray-300 focus:ring-teal'}`}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="termsAccepted" className="font-medium text-gray-700">I agree to the terms and conditions</label>
                    <p className="text-gray-500">By placing this order, you agree to our <a href="#" className="text-teal hover:underline">Terms of Service</a> and <a href="#" className="text-teal hover:underline">Privacy Policy</a>.</p>
                    {errors.termsAccepted && <p className="text-red-500 text-xs mt-1">{errors.termsAccepted.message}</p>}
                  </div>
                </div>
              </div>
              
              {/* Submit Button */}
              <div className="flex justify-end">
                <Button type="submit" size="lg">
                  Place Order
                </Button>
              </div>
            </form>
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              {/* Order Items */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={`${item.id}-${item.size}-${item.color}`} className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-md overflow-hidden">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {item.size && <span className="mr-1">Size: {item.size}</span>}
                        {item.color && <span>Color: {item.color}</span>}
                      </p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              
              {/* Coupon Code */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Have a coupon?</h3>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Enter coupon code"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-teal focus:border-teal"
                    disabled={!!couponCode || applyingCoupon}
                  />
                  {!couponCode ? (
                    <Button 
                      onClick={handleApplyCoupon} 
                      disabled={applyingCoupon || !couponInput.trim()}
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      {applyingCoupon ? 'Applying...' : 'Apply'}
                    </Button>
                  ) : (
                    <Button 
                      onClick={removeCoupon} 
                      variant="outline"
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      Remove
                    </Button>
                  )}
                </div>
                {couponError && (
                  <p className="text-red-500 text-xs mt-1">{couponError}</p>
                )}
                {couponCode && (
                  <div className="flex items-center mt-2 text-sm text-green-600">
                    <FiCheck className="mr-1" />
                    <span>Coupon applied: {couponCode}</span>
                  </div>
                )}
              </div>
              
              {/* Summary Details */}
              <div className="border-t border-gray-200 pt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">-₹{couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {shippingCost === 0 ? 'Free' : `₹${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (7%)</span>
                  <span className="font-medium">₹{tax.toFixed(2)}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout