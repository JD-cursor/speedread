import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './ui/AppShell'
import { LibraryView } from './ui/LibraryView'
import { ReaderView } from './ui/ReaderView'
import { DisclaimerPopup } from './ui/DisclaimerPopup'

function App() {
  return (
    <>
      <DisclaimerPopup />
      <AppShell>
        <Routes>
          <Route path="/" element={<LibraryView />} />
          <Route path="/read/:documentId" element={<ReaderView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </>
  )
}

export default App
