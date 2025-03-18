import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Auth components
import Auth from './pages/Auth';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Layout
import MainLayout from './components/ui/MainLayout';

// Pages
import Dashboard from './pages/Dashboard';
import DeckList from './components/decks/DeckList';
import DeckForm from './components/decks/DeckForm';
import SpreadsheetImport from './components/decks/SpreadsheetImport';
import CardList from './components/cards/CardList';
import CardForm from './components/cards/CardForm';
import StudySession from './components/study/StudySession';

// Import statistics page and settings page
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/auth" element={<Auth />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Deck routes */}
              <Route path="/decks" element={<DeckList />} />
              <Route path="/decks/new" element={<DeckForm />} />
              {/* Add debugging info to help track the issue */}
              <Route
                path="/decks/:deckId/edit"
                element={
                  <div>
                    <DeckForm isEditing={true} />
                  </div>
                }
              />
              <Route path="/decks/:deckId" element={<CardList />} />
              <Route path="/decks/import" element={<SpreadsheetImport />} />

              {/* Card routes */}
              <Route path="/decks/:deckId/cards/new" element={<CardForm />} />
              <Route path="/decks/:deckId/cards/:cardId/edit" element={<CardForm isEditing={true} />} />

              {/* Study routes */}
              <Route path="/study" element={<StudySession />} />
              <Route path="/decks/:deckId/study" element={<StudySession />} />

              {/* Stats and settings */}
              <Route path="/stats" element={<Statistics />} />
              <Route path="/settings" element={<Settings />} />

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
