import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { WishlistProvider } from './contexts/WishlistContext'
import Layout from './components/Layout/Layout'
import ProtectedRoute from './components/Common/ProtectedRoute'
import ScrollToTop from './components/Common/ScrollToTop'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'))
const Shop = lazy(() => import('./pages/Shop'))
const Product = lazy(() => import('./pages/Product'))
const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'))
const Account = lazy(() => import('./pages/Account'))
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
        <WishlistProvider>
          <ToastContainer />
          <ScrollToTop />
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
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="reset-password" element={<ResetPassword />} />
              <Route path="verify-email" element={<VerifyEmail />} />
              
              {/* New routes */}
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
              <Route path="shipping" element={<Shipping />} />
              <Route path="faq" element={<FAQ />} />
              <Route path="privacy-policy" element={<PrivacyPolicy />} />
              
              {/* Protected Account Route */}
              <Route path="account/*" element={<ProtectedRoute />}>
                <Route path="*" element={<Account />} />
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
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  )
}

export default App