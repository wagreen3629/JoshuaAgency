import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SignaturesPage } from './pages/SignaturesPage';
import { ClientsPage } from './pages/ClientsPage';
import { ClientViewPage } from './pages/ClientViewPage';
import { AddClientPage } from './pages/AddClientPage';
import { EditClientPage } from './pages/EditClientPage';
import { RidesPage } from './pages/RidesPage';
import { RideViewPage } from './pages/RideViewPage';
import RideConfirmationPage from './pages/RideConfirmationPage';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { ContractsPage } from './pages/ContractsPage';
import { ContractViewPage } from './pages/ContractViewPage';
import { ContractEditPage } from './pages/ContractEditPage';
import { AddContractPage } from './pages/AddContractPage';
import { HelpPage } from './pages/HelpPage';
import { ClientsHelpPage } from './pages/help/ClientsHelpPage';
import { RidesHelpPage } from './pages/help/RidesHelpPage';
import { ContractsHelpPage } from './pages/help/ContractsHelpPage';
import { InvoicesHelpPage } from './pages/help/InvoicesHelpPage';
import { FAQHelpPage } from './pages/help/FAQHelpPage';
import { ScheduleRidePage } from './pages/ScheduleRidePage';
import { ReportingPage } from './pages/ReportingPage';
import { UploadReferralPage } from './pages/UploadReferralPage';
import { AuthProvider } from './components/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
 
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          {/* Render Navbar only on non-dashboard routes */}
          <Routes>
            <Route path="/dashboard/*" element={null} />
            <Route path="/clients" element={null} />
            <Route path="/clients/:id" element={null} />
            <Route path="/upload-referral" element={null} />
            <Route path="/rides" element={null} />
            <Route path="/rides/:id" element={null} />
            <Route path="/signatures" element={null} />
            <Route path="/invoices" element={null} />
            <Route path="/contracts" element={null} />
            <Route path="/reporting" element={null} />
            <Route path="/users" element={null} />
            <Route path="/settings" element={null} />
            <Route path="/help" element={null} />
            <Route path="*" element={<Navbar />} />
          </Routes>
          <main>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />              
              <Route 
                path="/rides/confirmation" 
                element={
                  <ProtectedRoute>
                    <DashboardPage>
                      <RideConfirmationPage />
                    </DashboardPage>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/clients" 
                element={
                  <ProtectedRoute>
                    <DashboardPage>
                      <ClientsPage />
                    </DashboardPage>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/clients/:id" 
                element={
                  <ProtectedRoute>
                    <DashboardPage>
                      <ClientViewPage />
                    </DashboardPage>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/clients/new" 
                element={
                  <ProtectedRoute>
                    <DashboardPage>
                      <AddClientPage />
                    </DashboardPage>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/clients/:id/edit" 
                element={
                  <ProtectedRoute>
                    <DashboardPage>
                      <EditClientPage />
                    </DashboardPage>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/upload-referral" 
                element={
                  <ProtectedRoute>
                    <DashboardPage>
                      <UploadReferralPage />
                    </DashboardPage>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/rides" 
                element={
                  <ProtectedRoute>
                    <DashboardPage>
                      <RidesPage />
                    </DashboardPage>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/rides/schedule" 
                element={
                  <ProtectedRoute>
                    <DashboardPage>
                      <ScheduleRidePage />
                    </DashboardPage>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/rides/:id" 
                element={
                  <ProtectedRoute>
                    <DashboardPage>
                      <RideViewPage />
                    </DashboardPage>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/signatures" 
                element={
                  <ProtectedRoute>
                    <DashboardPage>
                      <SignaturesPage />
                    </DashboardPage>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/invoices" 
                element={
                  <ProtectedRoute>
                    <DashboardPage>
                      <InvoicesPage />
                    </DashboardPage>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/contracts" 
                element={
                  <ProtectedRoute>
                    <DashboardPage>
                      <ContractsPage />
                    </DashboardPage>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/contracts/new" 
                element={
                  <ProtectedRoute>
                    <DashboardPage>
                      <AddContractPage />
                    </DashboardPage>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/contracts/:id" 
                element={
                  <ProtectedRoute>
                    <DashboardPage>
                      <ContractViewPage />
                    </DashboardPage>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/contracts/:id/edit" 
                element={
                  <ProtectedRoute>
                    <DashboardPage>
                      <ContractEditPage />
                    </DashboardPage>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/reporting" 
                element={
                  <ProtectedRoute>
                    <DashboardPage>
                      <ReportingPage />
                    </DashboardPage>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/users" 
                element={
                  <ProtectedRoute>
                    <DashboardPage>
                      <UsersPage />
                    </DashboardPage>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <DashboardPage>
                      <SettingsPage />
                    </DashboardPage>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/help" 
                element={
                  <ProtectedRoute>
                    <DashboardPage>
                      <HelpPage />
                    </DashboardPage>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/help/clients" 
                element={
                  <ProtectedRoute>
                    <DashboardPage>
                      <ClientsHelpPage />
                    </DashboardPage>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/help/rides" 
                element={
                  <ProtectedRoute>
                    <DashboardPage>
                      <RidesHelpPage />
                    </DashboardPage>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/help/contracts" 
                element={
                  <ProtectedRoute>
                    <DashboardPage>
                      <ContractsHelpPage />
                    </DashboardPage>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/help/invoices" 
                element={
                  <ProtectedRoute>
                    <DashboardPage>
                      <InvoicesHelpPage />
                    </DashboardPage>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/help/faq" 
                element={
                  <ProtectedRoute>
                    <DashboardPage>
                      <FAQHelpPage />
                    </DashboardPage>
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
        </div>
      </AuthProvider>
  
  );
}

export default App;