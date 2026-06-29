import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/store';
import Layout from './components/Layout/Layout';
import Login from './components/Layout/Login';
import Home from './components/Home/Home';
import Dashboard from './components/Dashboard/Dashboard';
import Contacts from './components/Contacts/Contacts';
import ContactDetail from './components/Contacts/ContactDetail';
import Companies from './components/Companies/Companies';
import CompanyDetail from './components/Companies/CompanyDetail';
import Deals from './components/Deals/Deals';
import DealDetail from './components/Deals/DealDetail';
import Invoices from './components/Invoices/Invoices';
import InvoiceDetail from './components/Invoices/InvoiceDetail';
import Conversations from './components/Conversations/Conversations';
import AIAssistant from './components/AIAssistant/AIAssistant';
import Apps from './components/Apps/Apps';
import Tickets from './components/Tickets/Tickets';
import TicketDetail from './components/Tickets/TicketDetail';
import CalendarView from './components/Calendar/CalendarView';
import Profile from './components/Profile/Profile';
import Integrations from './components/Integrations/Integrations';
import Guide from './components/Guide/Guide';
import Workflows from './components/Workflows/Workflows';

function PrivateRoute({ children }) {
  const isAuthenticated = useStore(s => s.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const isAuthenticated = useStore(s => s.isAuthenticated);

  useEffect(() => {
    document.title = 'Smart CRM';
  }, []);

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="calendar" element={<CalendarView />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="contacts/:id" element={<ContactDetail />} />
        <Route path="companies" element={<Companies />} />
        <Route path="companies/:id" element={<CompanyDetail />} />
        <Route path="deals" element={<Deals />} />
        <Route path="deals/:id" element={<DealDetail />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="invoices/:id" element={<InvoiceDetail />} />
        <Route path="conversations" element={<Conversations />} />
        <Route path="ai-assistant" element={<AIAssistant />} />
        <Route path="apps" element={<Apps />} />
        <Route path="tickets" element={<Tickets />} />
        <Route path="tickets/:id" element={<TicketDetail />} />
        <Route path="profile" element={<Profile />} />
        <Route path="integrations" element={<Integrations />} />
        <Route path="guide" element={<Guide />} />
        <Route path="workflows" element={<Workflows />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
