import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Auth from './pages/Auth'
import Layout from './components/Layout'
import { Spinner } from './components/ui'

const DailyIntentions = lazy(() => import('./pages/daily/DailyIntentions'))
const Practices = lazy(() => import('./pages/daily/Practices'))
const HealthBody = lazy(() => import('./pages/daily/HealthBody'))
const MindsetHealing = lazy(() => import('./pages/daily/MindsetHealing'))
const Finances = lazy(() => import('./pages/money/Finances'))
const ExpenseTracker = lazy(() => import('./pages/money/ExpenseTracker'))
const DebtTracker = lazy(() => import('./pages/money/DebtTracker'))
const CreditPlan = lazy(() => import('./pages/money/CreditPlan'))
const WealthBuilding = lazy(() => import('./pages/money/WealthBuilding'))
const DreamHome = lazy(() => import('./pages/money/DreamHome'))
const HairClients = lazy(() => import('./pages/business/HairClients'))
const HairBusiness = lazy(() => import('./pages/business/HairBusiness'))
const BusinessPlanning = lazy(() => import('./pages/business/BusinessPlanning'))
const PersonalBrand = lazy(() => import('./pages/business/PersonalBrand'))
const DigitalPresence = lazy(() => import('./pages/business/DigitalPresence'))
const ContentIdeas = lazy(() => import('./pages/business/ContentIdeas'))
const Testimonials = lazy(() => import('./pages/business/Testimonials'))
const Library = lazy(() => import('./pages/growth/Library'))
const PlantMedicine = lazy(() => import('./pages/growth/PlantMedicine'))
const CoachingModalities = lazy(() => import('./pages/growth/CoachingModalities'))
const LifePlan = lazy(() => import('./pages/growth/LifePlan'))
const DreamsGoals = lazy(() => import('./pages/growth/DreamsGoals'))
const Relationships = lazy(() => import('./pages/relationships/Relationships'))
const Mentors = lazy(() => import('./pages/relationships/Mentors'))
const Community = lazy(() => import('./pages/relationships/Community'))
const Travel = lazy(() => import('./pages/relationships/Travel'))
const CreativeLife = lazy(() => import('./pages/creative/CreativeLife'))
const FutureSelfLetter = lazy(() => import('./pages/creative/FutureSelfLetter'))
const MissionLegacy = lazy(() => import('./pages/creative/MissionLegacy'))
const IdealLife = lazy(() => import('./pages/creative/IdealLife'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner />
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--cream)' }}>
        <div className="text-center">
          <div className="text-4xl mb-4" style={{ color: 'var(--gold)' }}>✦</div>
          <Spinner />
        </div>
      </div>
    )
  }

  if (!session) return <Auth />

  return (
    <BrowserRouter>
      <Layout session={session}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Navigate to="/daily/intentions" replace />} />
            <Route path="/daily/intentions" element={<DailyIntentions session={session} />} />
            <Route path="/daily/practices" element={<Practices session={session} />} />
            <Route path="/daily/health" element={<HealthBody session={session} />} />
            <Route path="/daily/mindset" element={<MindsetHealing session={session} />} />
            <Route path="/money/finances" element={<Finances session={session} />} />
            <Route path="/money/expenses" element={<ExpenseTracker session={session} />} />
            <Route path="/money/debt" element={<DebtTracker session={session} />} />
            <Route path="/money/credit" element={<CreditPlan session={session} />} />
            <Route path="/money/wealth" element={<WealthBuilding session={session} />} />
            <Route path="/money/dream-home" element={<DreamHome session={session} />} />
            <Route path="/business/clients" element={<HairClients session={session} />} />
            <Route path="/business/hair" element={<HairBusiness session={session} />} />
            <Route path="/business/planning" element={<BusinessPlanning session={session} />} />
            <Route path="/business/brand" element={<PersonalBrand session={session} />} />
            <Route path="/business/digital" element={<DigitalPresence session={session} />} />
            <Route path="/business/content" element={<ContentIdeas session={session} />} />
            <Route path="/business/testimonials" element={<Testimonials session={session} />} />
            <Route path="/growth/library" element={<Library session={session} />} />
            <Route path="/growth/plant-medicine" element={<PlantMedicine session={session} />} />
            <Route path="/growth/coaching" element={<CoachingModalities session={session} />} />
            <Route path="/growth/life-plan" element={<LifePlan session={session} />} />
            <Route path="/growth/dreams" element={<DreamsGoals session={session} />} />
            <Route path="/relationships/people" element={<Relationships session={session} />} />
            <Route path="/relationships/mentors" element={<Mentors session={session} />} />
            <Route path="/relationships/community" element={<Community session={session} />} />
            <Route path="/relationships/travel" element={<Travel session={session} />} />
            <Route path="/creative/projects" element={<CreativeLife session={session} />} />
            <Route path="/creative/future-letter" element={<FutureSelfLetter session={session} />} />
            <Route path="/creative/mission" element={<MissionLegacy session={session} />} />
            <Route path="/creative/ideal-life" element={<IdealLife session={session} />} />
            <Route path="*" element={<Navigate to="/daily/intentions" replace />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  )
}
