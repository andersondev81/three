import { Suspense } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import LoadingScreens from "./pages/LoadingScreen/LoadingScreen"
import Experience from "./pages/Experience"
import { AudioProvider } from "./contexts/AudioContext"

// ✅ LOADING PAGE - APENAS SUSPENSE
function LoadingPage() {
  return (
    <Suspense fallback={<LoadingScreens />}>
      <Experience />
    </Suspense>
  )
}

// ✅ EXPERIENCE PAGE - DIRETO
function ExperiencePage() {
  return <Experience />
}

// ✅ APP LIMPO COM SUSPENSE
function App() {
  return (
    <BrowserRouter>
      <AudioProvider>
        <Routes>
          <Route path="/" element={<LoadingPage />} />
          <Route path="/experience" element={<ExperiencePage />} />
        </Routes>
      </AudioProvider>
    </BrowserRouter>
  )
}

export default App
