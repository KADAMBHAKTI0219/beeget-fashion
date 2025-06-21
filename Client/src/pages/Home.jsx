import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../components/Common/Button'

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  
  // Hero section images
  const heroImages = [
    'https://janasya.com/cdn/shop/files/Maternity_main_Banner_Desktop.webp?v=1749642930&width=2000',
    'https://janasya.com/cdn/shop/files/Work-Wear-Banner_b447b0b8-d88c-4e5b-9a01-55f169eb1c87.webp?v=1749210863&width=2000',
    'https://janasya.com/cdn/shop/files/Everyday-Essentials-Banner_Desktop.webp?v=1749469271&width=2000',
    'https://janasya.com/cdn/shop/files/Every-Day-Cottons-Banner.webp?v=1747810597&width=2000',
    'https://janasya.com/cdn/shop/files/Cotton_days_main_Banner_Desktop.webp?v=1749642851&width=2000',
    'https://janasya.com/cdn/shop/files/Plus-Size-Banner_f7214f3b-c047-446f-8976-b958cbf01a74.webp?v=1749294158&width=2000'
  ]
  
  // Auto slide change effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === heroImages.length - 1 ? 0 : prev + 1))
    }, 5000) // Change slide every 5 seconds
    
    return () => clearInterval(interval)
  }, [])
  
  // Simulate fetching featured products
  useEffect(() => {
    // In a real app, this would be an API call
    const fetchFeaturedProducts = async () => {
      setLoading(true)
      
      // Simulate API delay
      setTimeout(() => {
        // Mock data
        const mockProducts = [
          {
            id: 1,
            name: 'Classic White Tee',
            price: 29.99,
            image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=400&q=80',
            category: 'women',
            slug: 'classic-white-tee'
          },
          {
            id: 2,
            name: 'Slim Fit Jeans',
            price: 59.99,
            image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=400&q=80',
            category: 'men',
            slug: 'slim-fit-jeans'
          },
          {
            id: 3,
            name: 'Summer Dress',
            price: 49.99,
            image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=400&q=80',
            category: 'women',
            slug: 'summer-dress'
          },
          {
            id: 4,
            name: 'Leather Wallet',
            price: 39.99,
            image: 'https://images.unsplash.com/photo-1517254797898-ee1bd9c0115b?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=400&q=80',
            category: 'accessories',
            slug: 'leather-wallet'
          },
        ]
        
        setFeaturedProducts(mockProducts)
        setLoading(false)
      }, 1000)
    }
    
    fetchFeaturedProducts()
  }, [])
  
  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  }
  
  // Handle manual slide navigation
  const goToSlide = (index) => {
    setCurrentSlide(index)
  }
  
  // Handle next slide
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === heroImages.length - 1 ? 0 : prev + 1))
  }
  
  // Handle previous slide
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? heroImages.length - 1 : prev - 1))
  }
  
  return (
    <div>
      {/* Hero Section with Slider */}
      <section className="relative h-screen overflow-hidden">
        <AnimatePresence initial={false}>
          <motion.div
            key={currentSlide}
            className="absolute inset-0 z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
          >
            <img 
              src={heroImages[currentSlide]} 
              alt={`Fashion collection slide ${currentSlide + 1}`} 
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>
        
        {/* Navigation arrows */}
        <button 
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
          aria-label="Previous slide"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button 
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
          aria-label="Next slide"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
        {/* Slide indicators */}
        <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-2">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${currentSlide === index ? 'bg-white' : 'bg-white/40'}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>
      {/* Categories Section */}
      <section className="w-full py-4 bg-white">
        <div className="container-fluid mx-auto px-0">
          <h2 className="text-3xl font-bold text-center mb-8">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-0">
            {/* Category 1 */}
            <div className="relative overflow-hidden h-[700px] group">
              <img
                src="https://janasya.com/cdn/shop/files/Category_Tops-_-Tunics_81e3ee9f-6fc4-46de-870b-ad38e8af53e9.webp?v=1749643032&width=800"
                alt="Tops & Tunics"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent flex flex-col justify-end p-6">
                <h3 className="text-white text-2xl font-bold mb-4 uppercase tracking-wider text-center">Tops & Tunics</h3>
                <a href="/shop/tops-tunics" className="text-white text-center hover:underline">Shop Collection</a>
              </div>
            </div>
            
            {/* Category 2 */}
            <div className="relative overflow-hidden h-[700px] group">
              <img
                src="https://janasya.com/cdn/shop/files/Category_Dresses_6ecf0375-1c4b-47d7-9a2f-d16d53cde092.webp?v=1749643031&width=800"
                alt="Green Cotton Solid A-line Co-ords Set"
                className="w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent flex flex-col justify-end p-6">
                <h3 className="text-white text-2xl font-bold mb-4 uppercase tracking-wider text-center">Dresses</h3>
                <a href="/shop/dresses" className="text-white text-center hover:underline">Shop Collection</a>
              </div>
            </div>
            
            {/* Category 3 */}
            <div className="relative overflow-hidden h-[700px] group">
              <img
                src="https://janasya.com/cdn/shop/files/Category_Co-Ords_be9f086d-1b5c-4421-ad29-4ee5b69bca25.webp?v=1749646113&width=800"
                alt="Co-Ords"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent flex flex-col justify-end p-6">
                <h3 className="text-white text-2xl font-bold mb-4 uppercase tracking-wider text-center">Co-Ords</h3>
                <a href="/shop/co-ords" className="text-white text-center hover:underline">Shop Collection</a>
              </div>
            </div>
            
            {/* Category 4 */}
            <div className="relative overflow-hidden h-[700px] group">
              <img
                src="https://janasya.com/cdn/shop/files/Category_Kurta-Sets_e4faa5de-ffc7-48c9-bfc7-9e3dbcff1fa9.webp?v=1749643202&width=800"
                alt="Kurta Sets"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent flex flex-col justify-end p-6">
                <h3 className="text-white text-2xl font-bold mb-4 uppercase tracking-wider text-center">Kurta Sets</h3>
                <a href="/shop/kurta-sets" className="text-white text-center hover:underline">Shop Collection</a>
              </div>
            </div>
            
            {/* Category 5 */}
            <div className="relative overflow-hidden h-[700px] group">
              <img
                src="https://janasya.com/cdn/shop/files/Category_Suit-Set_4ea2d3e2-b4b1-4cee-bf6b-03e2e7d21d62.webp?v=1749643032&width=800"
                alt="Suit Sets"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent flex flex-col justify-end p-6">
                <h3 className="text-white text-2xl font-bold mb-4 uppercase tracking-wider text-center">Suit Sets</h3>
                <a href="/shop/suit-sets" className="text-white text-center hover:underline">Shop Collection</a>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Summer Festive Banner Section */}
      <section className="w-full overflow-hidden">
        <img 
          src="https://janasya.com/cdn/shop/files/Summer-Festive-Banner_Desktop.webp?v=1749643277&width=2000" 
          alt="Summer Festive Collection" 
          className="w-full h-auto object-cover"
        />
      </section>
      
      {/* Work Anywhere Banner Section */}
      <section className="w-full overflow-hidden">
        <img 
          src="https://janasya.com/cdn/shop/files/Work-Anywhere_Desktop.webp?v=1744953148&width=2000" 
          alt="Work Anywhere Collection" 
          className="w-full h-auto object-cover"
        />
      </section>
      
      {/* WATCH AND BUY Section */}
      <section className="w-full py-12 bg-gray-50">
        <div className="container-fluid mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8 relative">
            <span className="bg-blue-600 text-white px-4 py-1">WATCH AND BUY</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {/* Product 1 */}
            <div className="bg-white rounded shadow overflow-hidden group relative">
              <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">60% OFF</div>
              <div className="absolute top-2 right-2 bg-white/80 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <img
                src="https://janasya.com/cdn/shop/files/Category_Tops-_-Tunics_81e3ee9f-6fc4-46de-870b-ad38e8af53e9.webp?v=1749643032&width=800"
                alt="Off White Dobby Pure Cotton Self Design A-line Kurta Pant Set"
                className="w-full"
              />
              <div className="p-3">
                <h3 className="text-sm font-medium text-gray-800 line-clamp-2">Off White Dobby Pure Cotton Self Design A-line Kurta Pant Set</h3>
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold">₹1,599.00</span>
                    <span className="text-sm text-gray-500 line-through ml-2">₹3,999.00</span>
                  </div>
                </div>
                <button className="mt-2 w-full bg-gray-800 text-white py-1 text-sm hover:bg-gray-700 transition">Add to cart</button>
              </div>
            </div>

            {/* Product 2 */}
            <div className="bg-white rounded shadow overflow-hidden group relative">
              <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">42% OFF</div>
              <div className="absolute top-2 right-2 bg-white/80 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <img
                src="https://janasya.com/cdn/shop/files/Category_Dresses_6ecf0375-1c4b-47d7-9a2f-d16d53cde092.webp?v=1749643031&width=800"
                alt="Green Cotton Solid A-line Co-ords Set"
                className="w-full"
              />
              <div className="p-3">
                <h3 className="text-sm font-medium text-gray-800 line-clamp-2">Green Cotton Solid A-line Co-ords Set</h3>
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold">₹1,499.00</span>
                    <span className="text-sm text-gray-500 line-through ml-2">₹2,599.00</span>
                  </div>
                </div>
                <button className="mt-2 w-full bg-gray-800 text-white py-1 text-sm hover:bg-gray-700 transition">Add to cart</button>
              </div>
            </div>

            {/* Product 3 */}
            <div className="bg-white rounded shadow overflow-hidden group relative">
              <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">56% OFF</div>
              <div className="absolute top-2 right-2 bg-white/80 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <img
                src="https://janasya.com/cdn/shop/files/Category_Co-Ords_be9f086d-1b5c-4421-ad29-4ee5b69bca25.webp?v=1749646113&width=800"
                alt="White Pure Cotton Floral Printed A-line Co-ord Set"
                className="w-full"
              />
              <div className="p-3">
                <h3 className="text-sm font-medium text-gray-800 line-clamp-2">White Pure Cotton Floral Printed A-line Co-ord Set</h3>
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold">₹1,599.00</span>
                    <span className="text-sm text-gray-500 line-through ml-2">₹3,599.00</span>
                  </div>
                </div>
                <button className="mt-2 w-full bg-gray-800 text-white py-1 text-sm hover:bg-gray-700 transition">Add to cart</button>
              </div>
            </div>

            {/* Product 4 */}
            <div className="bg-white rounded shadow overflow-hidden group relative">
              <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">58% OFF</div>
              <div className="absolute top-2 right-2 bg-white/80 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <img
                src="https://janasya.com/cdn/shop/files/Category_Kurta-Sets_e4faa5de-ffc7-48c9-bfc7-9e3dbcff1fa9.webp?v=1749643202&width=800"
                alt="Light Pink Dobby Pure Cotton Self Design A-line Co-ord Set"
                className="w-full"
              />
              <div className="p-3">
                <h3 className="text-sm font-medium text-gray-800 line-clamp-2">Light Pink Dobby Pure Cotton Self Design A-line Co-ord Set</h3>
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold">₹1,799.00</span>
                    <span className="text-sm text-gray-500 line-through ml-2">₹4,247.00</span>
                  </div>
                </div>
                <button className="mt-2 w-full bg-gray-800 text-white py-1 text-sm hover:bg-gray-700 transition">Add to cart</button>
              </div>
            </div>

            {/* Product 5 */}
            <div className="bg-white rounded shadow overflow-hidden group relative">
              <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">58% OFF</div>
              <div className="absolute top-2 right-2 bg-white/80 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <img
                src="https://janasya.com/cdn/shop/files/Category_Suit-Set_4ea2d3e2-b4b1-4cee-bf6b-03e2e7d21d62.webp?v=1749643032&width=800"
                alt="Navy Blue Pure Cotton Floral Printed A-line Kurta Pant With Dupatta"
                className="w-full"
              />
              <div className="p-3">
                <h3 className="text-sm font-medium text-gray-800 line-clamp-2">Navy Blue Pure Cotton Floral Printed A-line Kurta Pant With Dupatta</h3>
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold">₹2,599.00</span>
                    <span className="text-sm text-gray-500 line-through ml-2">₹6,249.00</span>
                  </div>
                </div>
                <button className="mt-2 w-full bg-gray-800 text-white py-1 text-sm hover:bg-gray-700 transition">Add to cart</button>
              </div>
            </div>

            {/* Product 6 */}
            <div className="bg-white rounded shadow overflow-hidden group relative">
              <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">45% OFF</div>
              <div className="absolute top-2 right-2 bg-white/80 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <img
                src="https://janasya.com/cdn/shop/files/Category_Tops-_-Tunics_81e3ee9f-6fc4-46de-870b-ad38e8af53e9.webp?v=1749643032&width=800"
                alt="Navy Blue Pure Cotton Floral Printed A-line Co-ord Set"
                className="w-full"
              />
              <div className="p-3">
                <h3 className="text-sm font-medium text-gray-800 line-clamp-2">Navy Blue Pure Cotton Floral Printed A-line Co-ord Set</h3>
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold">₹1,499.00</span>
                    <span className="text-sm text-gray-500 line-through ml-2">₹2,699.00</span>
                  </div>
                </div>
                <button className="mt-2 w-full bg-gray-800 text-white py-1 text-sm hover:bg-gray-700 transition">Add to cart</button>
              </div>
            </div>

            {/* Product 7 */}
            <div className="bg-white rounded shadow overflow-hidden group relative">
              <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">60% OFF</div>
              <div className="absolute top-2 right-2 bg-white/80 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <img
                src="https://janasya.com/cdn/shop/files/Category_Dresses_6ecf0375-1c4b-47d7-9a2f-d16d53cde092.webp?v=1749643031&width=800"
                alt="Yellow Dobby Pure Cotton Self Design Straight Kurta Pant Set"
                className="w-full"
              />
              <div className="p-3">
                <h3 className="text-sm font-medium text-gray-800 line-clamp-2">Yellow Dobby Pure Cotton Self Design Straight Kurta Pant Set</h3>
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold">₹1,899.00</span>
                    <span className="text-sm text-gray-500 line-through ml-2">₹4,747.00</span>
                  </div>
                </div>
                <button className="mt-2 w-full bg-gray-800 text-white py-1 text-sm hover:bg-gray-700 transition">Add to cart</button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Ready Set Summer Banner Section */}
    
      
      {/* Summer Festive Banner Section */}
      <section className="w-full overflow-hidden">
        <img 
          src="https://janasya.com/cdn/shop/files/Ready-Set-Summer_Desktop_e512ef97-cffd-4394-a6dc-5fe0753d0d8a.webp?v=1749643465&width=2000" 
          alt="Summer Festive Collection" 
          className="w-full h-auto object-cover"
        />
      </section>
      
      {/* Work Anywhere Banner Section */}
      <section className="w-full overflow-hidden">
        <img 
          src="https://janasya.com/cdn/shop/files/Playful-Florals-Banner_22e33db5-ce61-4687-ba79-b7f36909abf7.webp?v=1749643623&width=2000" 
          alt="Work Anywhere Collection" 
          className="w-full h-auto object-cover"
        />
      </section>  
      <section className="w-full overflow-hidden">
        <img 
          src="https://janasya.com/cdn/shop/files/Plus-Size_Collections_Banner_Desktop.webp?v=1749643755&width=2000" 
          alt="Work Anywhere Collection" 
          className="w-full h-auto object-cover"
        />
      </section>
      {/* Featured Products Section */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl font-heading font-semibold mb-10 text-center">Featured Products</h2>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg overflow-hidden shadow-md animate-pulse">
                  <div className="h-64 bg-gray-300"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {featuredProducts.map((product) => (
                <motion.div 
                  key={product.id} 
                  className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                  variants={itemVariants}
                >
                  <Link to={`/product/${product.slug}`} className="block overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-64 object-cover transition-transform hover:scale-105 duration-300"
                    />
                  </Link>
                  <div className="p-4">
                    <Link to={`/product/${product.slug}`} className="block">
                      <h3 className="text-lg font-medium text-charcoal hover:text-teal transition-colors">{product.name}</h3>
                    </Link>
                    <p className="text-gray-600 mt-1">${product.price.toFixed(2)}</p>
                    <div className="mt-4">
                      <Button fullWidth>Add to Cart</Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
          
          <div className="text-center mt-10">
            <Button as={Link} to="/shop" variant="secondary">
              View All Products
            </Button>
          </div>
        </div>
      </section>
      
      {/* Newsletter Section */}
      <section className="py-16 bg-teal text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-heading font-semibold mb-4">Join Our Newsletter</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.</p>
          
          <form className="max-w-md mx-auto flex">
            <input 
              type="email" 
              placeholder="Your email address" 
              className="flex-grow px-4 py-2 rounded-l-md focus:outline-none text-charcoal" 
              required 
            />
            <Button type="submit" className="rounded-l-none">
              Subscribe
            </Button>
          </form>
        </div>
      </section>
    </div>
  )
}

export default Home