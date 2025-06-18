import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import Layout from './components/Layout/Layout'
import ProtectedRoute from './components/Common/ProtectedRoute'

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'))
const Shop = lazy(() => import('./pages/Shop'))
const Product = lazy(() => import('./pages/Product'))
const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Profile = lazy(() => import('./pages/Profile'))
const Orders = lazy(() => import('./pages/Orders'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const NotFound = lazy(() => import('./pages/NotFound'))

// New pages
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const Shipping = lazy(() => import('./pages/Shipping'))
const FAQ = lazy(() => import('./pages/FAQ'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-16 h-16 border-4 border-teal border-t-transparent rounded-full animate-spin"></div>
  </div>
)

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="shop" element={<Shop />} />
              <Route path="product/:slug" element={<Product />} />
              <Route path="cart" element={<Cart />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              
              {/* New routes */}
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
              <Route path="shipping" element={<Shipping />} />
              <Route path="faq" element={<FAQ />} />
              <Route path="privacy-policy" element={<PrivacyPolicy />} />
              
              {/* Protected Account Routes */}
              <Route path="account" element={<ProtectedRoute />}>
                <Route path="profile" element={<Profile />} />
                <Route path="orders" element={<Orders />} />
              </Route>
              
              {/* Protected Admin Routes */}
              <Route path="admin" element={<ProtectedRoute adminOnly={true} />}>
                <Route path="dashboard" element={<AdminDashboard />} />
              </Route>
              
              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </CartProvider>
    </AuthProvider>
  )
}

export default App