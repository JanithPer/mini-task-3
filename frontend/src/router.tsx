import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { SearchPage } from './pages/SearchPage'
import { StatsPage } from './pages/StatsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <SearchPage /> },
      { path: 'stats', element: <StatsPage /> },
    ],
  },
])
