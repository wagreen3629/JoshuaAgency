import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  FileText, 
  Upload, 
  AlertCircle,
  Car,
  Tag,
  Users,
  Building,
  DollarSign,
  FileSignature,
  Check,
  X,
  Trash2,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Button } from '../components/Button';
import { 
  fetchClientById, 
  fetchClientRides, 
  fetchClients, 
  toggleClientReviewed, 
  ClientDetails, 
  Ride,
  Address,
  fetchClientAddresses,
  createAddress,
  updateAddressStatus,
  deleteAddress,
  fetchClientNotes,
  createClientNote,
  deleteClientNote,
  Note
} from '../lib/airtable';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { validateClientForRide } from '../lib/ride-validation';

function ClientViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [allClients, setAllClients] = useState<ClientDetails[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [client, setClient] = useState<ClientDetails | null>(null);
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressLoading, setAddressLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReviewed, setIsReviewed] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ address: '', title: '', notes: '', status: 'Active' as const });
  const [addressError, setAddressError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [showDeleteAddressDialog, setShowDeleteAddressDialog] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);
  const [showDeleteNoteDialog, setShowDeleteNoteDialog] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  // Function to validate address
  const validateAddress = (address: string): boolean => {
    // Split address into components
    const components = address.trim().split(',').map(part => part.trim().replace(/\.$/, '')); // Remove trailing periods
    
    // Check if we have at least street address, city, and state
    if (components.length < 3) {
      setAddressError('Please enter a complete address with street, city, and state (e.g., "123 Main St, Montgomery, AL")');
      return false;
    }
    
    // Check if each component has content
    if (components.some(component => component.replace(/\.$/, '').length < 2)) {
      setAddressError('Each part of the address must be complete');
      return false;
    }
    
    // Basic street address validation
    const streetAddress = components[0];
    if (!/^\d+\s+\w+.*$/i.test(streetAddress)) {
      setAddressError('Street address must include a number and street name');
      return false;
    }
    
    // State validation - should be last component
    const state = components[components.length - 1].replace(/\.$/, '').trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(state) && !/^[A-Z]{2}\s+\d{5}(-\d{4})?$/.test(state)) {
      setAddressError('State should be a valid two-letter abbreviation (e.g., AL, GA)');
      return false;
    }
    
    setAddressError(null);
    return true;
  };

  // Fetch all clients to enable navigation
  useEffect(() => {
    const getAllClients = async () => {
      try {
        const clients = await fetchClients();
        setAllClients(clients);
        // Find current client's index
        const index = clients.findIndex(c => c.id === id);
        setCurrentIndex(index);
      } catch (err) {
        console.error('Error fetching all clients:', err);
      }
    };

    getAllClients();
  }, [id]);

  useEffect(() => {
    const getClientDetails = async () => {
      if (!id) {
        setError('Client ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [clientData, ridesData] = await Promise.all([
          fetchClientById(id),
          fetchClientRides(id)
        ]);
        
        if (!clientData) {
          setError('Client not found');
        } else {
          setIsReviewed(clientData.reviewed || false);
          setClient(clientData);
          setRides(ridesData);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching client details:', err);
        setError('Failed to load client details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    getClientDetails();
  }, [id]);

  // Fetch approved addresses
  useEffect(() => {
    const getAddresses = async () => {
      if (!id) return;
      
      try {
        setAddressLoading(true);
        const addressData = await fetchClientAddresses(id);
        setAddresses(addressData);
      } catch (err) {
        console.error('Error fetching addresses:', err);
      } finally {
        setAddressLoading(false);
      }
    };

    getAddresses();
  }, [id]);

  // Fetch client notes
  useEffect(() => {
    const getNotes = async () => {
      if (!id) return;
      
      try {
        setNotesLoading(true);
        const notesData = await fetchClientNotes(id);
        setNotes(notesData);
      } catch (err) {
        console.error('Error fetching notes:', err);
      } finally {
        setNotesLoading(false);
      }
    };

    getNotes();
  }, [id]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    const trimmedAddress = newAddress.address.trim();
    if (!trimmedAddress) {
      setAddressError('Address is required');
      return;
    }
    
    // Validate address format
    if (!validateAddress(trimmedAddress)) {
      return;
    }

    try {
      const result = await createAddress({
        address: trimmedAddress,
        title: newAddress.title,
        notes: newAddress.notes,
        status: newAddress.status,
        clientId: id
      }).catch(error => {
        // Handle the rejected promise
        setAddressError(error);
        return null;
      });

      if (!result) {
        return; // Error was already handled
      }

      setAddresses(prev => [result, ...prev]);
      setNewAddress({ address: '', title: '', notes: '', status: 'Active' });
      setAddressError(null);
      setShowAddAddress(false);
    } catch (err) {
      console.error('Error adding address:', err);
      setAddressError(err instanceof Error ? err.message : 'Failed to save address. Please try again.');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    const trimmedNote = newNote.trim();
    if (!trimmedNote) {
      setNoteError('Note content is required');
      return;
    }

    try {
      setNoteSubmitting(true);
      setNoteError(null);
      
      // Use the current user's name or email as the creator
      const creatorName = client?.clientName || 'System User';
      
      const result = await createClientNote(id, trimmedNote, creatorName);
      
      if (!result) {
        throw new Error('Failed to save note');
      }

      setNotes(prev => [result, ...prev]);
      setNewNote('');
      setShowAddNote(false);
    } catch (err) {
      console.error('Error adding note:', err);
      setNoteError(err instanceof Error ? err.message : 'Failed to save note. Please try again.');
    } finally {
      setNoteSubmitting(false);
    }
  };

  const handleToggleAddressStatus = async (addressId: string, currentStatus: 'Active' | 'Inactive') => {
    try {
      const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
      const success = await updateAddressStatus(addressId, newStatus);
      
      if (success) {
        setAddresses(prev => prev.map(addr => 
          addr.id === addressId 
            ? { ...addr, status: newStatus }
            : addr
        ));
      }
    } catch (err) {
      console.error('Error updating address status:', err);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    setAddressToDelete(addressId);
    setShowDeleteAddressDialog(true);
  };

  const confirmDeleteAddress = async () => {
    try {
      if (!addressToDelete) return;
      
      const success = await deleteAddress(addressToDelete);
      if (success) {
        setAddresses(prev => prev.filter(addr => addr.id !== addressToDelete));
      } else {
        throw new Error('Failed to delete address');
      }
    } catch (err) {
      console.error('Error deleting address:', err);
      alert('Failed to delete address. Please try again.');
    } finally {
      setShowDeleteAddressDialog(false);
      setAddressToDelete(null);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setNoteToDelete(noteId);
    setShowDeleteNoteDialog(true);
  };

  const confirmDeleteNote = async () => {
    try {
      if (!noteToDelete) return;
      
      const success = await deleteClientNote(noteToDelete);
      if (success) {
        setNotes(prev => prev.filter(note => note.id !== noteToDelete));
      } else {
        throw new Error('Failed to delete note');
      }
    } catch (err) {
      console.error('Error deleting note:', err);
      alert('Failed to delete note. Please try again.');
    } finally {
      setShowDeleteNoteDialog(false);
      setNoteToDelete(null);
    }
  };

  const handleUploadReferral = () => {
    navigate('/upload-referral', {
      state: {
        client: {
          id: client?.id,
          name: client?.name,
          clientName: client?.clientName
        }
      }
    });
  };

  const handleToggleReviewed = async () => {
    if (!client?.id) return;
    
    try {
      const success = await toggleClientReviewed(client.id, !isReviewed);
      if (success) {
        setIsReviewed(!isReviewed);
      }
    } catch (err) {
      console.error('Error toggling client reviewed status:', err);
      // Show error message to user
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevClient = allClients[currentIndex - 1];
      navigate(`/clients/${prevClient.id}`);
    }
  };

  const handleNext = () => {
    if (currentIndex < allClients.length - 1) {
      const nextClient = allClients[currentIndex + 1];
      navigate(`/clients/${nextClient.id}`);
    }
  };

  const handleViewRide = (rideId: string) => {
    navigate(`/rides/${rideId}`);
  };

  const handleEmailClick = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const handleScheduleRide = async () => {
    if (!id) return;
    
    const validation = await validateClientForRide(id);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setShowValidationDialog(true);
      return;
    }
    
    navigate('/rides/schedule', {
      state: { 
        clientId: id,
        returnPath: `/clients/${id}`
      }
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) {
     return "No date provided";
    }
    return new Date(dateString).toLocaleDateString();
    //return dateString;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <p className="text-gray-600">Loading client details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" role="alert">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
          <div className="mt-4">
            <Button onClick={() => navigate('/clients')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clients
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/clients')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Client Details</h1>
          
          {/* Navigation buttons */}
          <div className="ml-4 flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentIndex <= 0}
              className="h-8 px-2"
              title="Previous client"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentIndex >= allClients.length - 1}
              className="h-8 px-2"
              title="Next client"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline"
            onClick={handleUploadReferral}
            className="flex items-center"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Referral
          </Button>
          <Button
            variant="outline"
            onClick={handleToggleReviewed}
            className={`flex items-center ${
              isReviewed ? 'text-green-600 hover:text-green-700' : 'text-red-600 hover:text-red-700'
            }`}
          >
            {isReviewed ? (
              <>
                <Check className="h-4 w-4 mr-2 text-green-600" />
                Reviewed
              </>
            ) : (
              <>
                <X className="h-4 w-4 mr-2 text-red-600" />
                Not Reviewed
              </>
            )}
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate(`/clients/${id}/edit`)}
            className="flex items-center"
          >
            <User className="h-4 w-4 mr-2" />
            Edit Client
          </Button>
          <Button 
            onClick={handleScheduleRide}
            className="flex items-center"
          >
            <Car className="h-4 w-4 mr-2" />
            Schedule Ride
          </Button>
        </div>
      </div>

      {/* Success message from upload */}
      {location.state?.message && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          <p className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            {location.state.message}
          </p>
        </div>
      )}

      {/* Client Information */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        {/* Case Information Section */}
        <div className="px-6 py-4">
          <div className="flex justify-between items-center mb-4 pb-2 border-b">
            <h3 className="text-lg font-bold text-gray-900">Case Information</h3>
            {client.referralFile && client.referralFile.length > 0 && (
              <a
                href={client.referralFile[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <FileText className="h-4 w-4 mr-2" />
                View Referral File
              </a>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm font-medium text-gray-500">DHR Case Manager</div>
              <div className="mt-1 flex items-center">
                <User className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-gray-900">{client.caseManager || 'N/A'}</span>
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-gray-500">County</div>
              <div className="mt-1 flex items-center">
                <Building className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-gray-900">{client.county || 'N/A'}</span>
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-gray-500">Case Manager Phone</div>
              <div className="mt-1 flex items-center">
                <Phone className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-gray-900">{client.telephone || 'N/A'}</span>
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-gray-500">Case Manager Email</div>
              <div className="mt-1 flex items-center">
                <Mail className="h-4 w-4 text-gray-400 mr-1" />
                <button 
                  onClick={() => handleEmailClick(client.email)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {client.email || 'N/A'}
                </button>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <div className="text-sm font-medium text-gray-500">Program Responsible for Payment</div>
              <div className="mt-1 flex items-center">
                <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-gray-900">{client.paymentResponsibility || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Client Information Section */}
        <div className="px-6 py-4 border-t border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Client Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm font-medium text-gray-500">Client Name</div>
              <div className="mt-1 flex items-center">
                <User className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-gray-900">{client.clientName || 'N/A'}</span>
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-gray-500">SSN</div>
              <div className="mt-1 flex items-center">
                <FileSignature className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-gray-900">{client.ssn || 'N/A'}</span>
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-gray-500">Client Phone</div>
              <div className="mt-1 flex items-center">
                <Phone className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-gray-900">{client.clientTelephone || 'N/A'}</span>
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-gray-500">Other Phone</div>
              <div className="mt-1 flex items-center">
                <Phone className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-gray-900">{client.otherTelephone || 'N/A'}</span>
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-gray-500">Client Email</div>
              <div className="mt-1 flex items-center">
                <Mail className="h-4 w-4 text-gray-400 mr-1" />
                <button 
                  onClick={() => handleEmailClick(client.clientEmail)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {client.clientEmail || 'N/A'}
                </button>
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-gray-500">Status</div>
              <div className="mt-1">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  client.status === 'Active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {client.status || 'Unknown'}
                </span>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <div className="text-sm font-medium text-gray-500">Address</div>
              <div className="mt-1 flex items-start">
                <MapPin className="h-4 w-4 text-gray-400 mr-1 mt-0.5 flex-shrink-0" />
                <div>
                  <div>{client.address || 'N/A'}</div>
                  <div>{client.city || ''}{client.city && client.zipCode ? ', ' : ''}{client.zipCode || ''}</div>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <div className="text-sm font-medium text-gray-500">Additional Information</div>
              <div className="mt-1 text-gray-900">
                {client.additionalInformation || 'No additional information provided.'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Program Information Section */}
        <div className="px-6 py-4 border-t border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Program Information</h3>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <div className="text-sm font-medium text-gray-500">Programs</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {Array.isArray(client.program) ? (
                  client.program.map((prog, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                    >
                      {prog}
                    </span>
                  ))
                ) : client.program ? (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {client.program}
                  </span>
                ) : (
                  <span className="text-gray-500">No programs selected</span>
                )}
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-gray-500">Activities</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {Array.isArray(client.activity) ? (
                  client.activity.map((act, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium"
                    >
                      {act}
                    </span>
                  ))
                ) : client.activity ? (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    {client.activity}
                  </span>
                ) : (
                  <span className="text-gray-500">No activities selected</span>
                )}
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-gray-500">Transportation Dates Needed</div>
              <div className="mt-1 flex items-center">
                <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-gray-900">{client.dateNeeded || 'N/A'}</span>
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-gray-500">Contract</div>
              <div className="mt-1 flex items-center">
                <Tag className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-gray-900">{client.contractName ? client.contractName : 'No contract assigned'}</span>
              </div>
            </div>                     
            
            <div>
              <div className="text-sm font-medium text-gray-500">Notes</div>
              <div className="mt-1 flex items-center">
                <FileText className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-gray-900">{client.Notes}</span>
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-gray-500">Created Date</div>
              <div className="mt-1 flex items-center">
                <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-gray-900">{formatDate(client.createdDate)}</span>
              </div>
            </div>
            
            {client.attachments && client.attachments.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-500">Attachments</div>
                <div className="mt-2 space-y-2">
                  {client.attachments.map((attachment, index) => (
                    <a
                      key={index}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {attachment.filename}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approved Destinations */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Approved Destinations</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddAddress(!showAddAddress)}
              className="flex items-center"
            >
              {showAddAddress ? 'Cancel' : 'Add Address'}
            </Button>
          </div>
        </div>

        {showAddAddress && (
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <form onSubmit={handleAddAddress} className="space-y-4">
              {addressError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 mr