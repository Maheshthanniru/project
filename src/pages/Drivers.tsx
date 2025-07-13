import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, AlertTriangle, Phone, MapPin } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import { Driver } from '../lib/supabaseDatabase';
import { supabaseDB } from '../lib/supabaseDatabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format, differenceInDays } from 'date-fns';

const Drivers: React.FC = () => {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(false);

  const [newDriver, setNewDriver] = useState({
    driver_name: '',
    license_no: '',
    contact_no: '',
    license_expiry: '',
    address: '',
  });

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const driversData = await supabaseDB.getDrivers();
      setDrivers(driversData);
    } catch (error) {
      console.error('Error loading drivers:', error);
      toast.error('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const getExpiryStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = differenceInDays(expiry, today);

    if (daysUntilExpiry < 0) {
      return { status: 'expired', color: 'text-red-600 bg-red-50', days: Math.abs(daysUntilExpiry) };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring', color: 'text-orange-600 bg-orange-50', days: daysUntilExpiry };
    } else {
      return { status: 'valid', color: 'text-green-600 bg-green-50', days: daysUntilExpiry };
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (editingDriver) {
      setEditingDriver({ ...editingDriver, [field]: value });
    } else {
      setNewDriver({ ...newDriver, [field]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingDriver) {
        // Update existing driver
        const updatedDriver = await supabaseDB.updateDriver(editingDriver.id, editingDriver);
        if (updatedDriver) {
          await loadDrivers();
          setEditingDriver(null);
          toast.success('Driver updated successfully!');
        } else {
          toast.error('Failed to update driver');
        }
      } else {
        // Add new driver
        const newDriverData = await supabaseDB.addDriver(newDriver);
        if (newDriverData) {
          await loadDrivers();
          setNewDriver({
            driver_name: '',
            license_no: '',
            contact_no: '',
            license_expiry: '',
            address: '',
          });
          setShowAddForm(false);
          toast.success('Driver added successfully!');
        } else {
          toast.error('Failed to add driver');
        }
      }
    } catch (error) {
      console.error('Error saving driver:', error);
      toast.error('Failed to save driver');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver({ ...driver });
    setShowAddForm(false);
  };

  const handleCancelEdit = () => {
    setEditingDriver(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Page content */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Drivers Management</h1>
            <p className="text-gray-600">Track driver information and license expiry dates</p>
          </div>
          
          <Button
            icon={Plus}
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingDriver(null);
            }}
          >
            Add Driver
          </Button>
        </div>

        {/* Add/Edit Driver Form */}
        {(showAddForm || editingDriver) && (
          <Card title={editingDriver ? 'Edit Driver' : 'Add New Driver'}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Driver Name"
                  value={editingDriver ? editingDriver.driver_name : newDriver.driver_name}
                  onChange={(value) => handleInputChange('driver_name', value)}
                  placeholder="Enter driver name"
                  required
                />
                
                <Input
                  label="License Number"
                  value={editingDriver ? editingDriver.license_no : newDriver.license_no}
                  onChange={(value) => handleInputChange('license_no', value)}
                  placeholder="TN-123456789"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="License Expiry Date"
                  type="date"
                  value={editingDriver ? editingDriver.license_expiry : newDriver.license_expiry}
                  onChange={(value) => handleInputChange('license_expiry', value)}
                  required
                />
                
                <Input
                  label="Phone Number"
                  value={editingDriver ? editingDriver.contact_no : newDriver.contact_no}
                  onChange={(value) => handleInputChange('contact_no', value)}
                  placeholder="9876543210"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Address"
                  value={editingDriver ? editingDriver.address : newDriver.address}
                  onChange={(value) => handleInputChange('address', value)}
                  placeholder="Driver address..."
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (editingDriver ? 'Update Driver' : 'Add Driver')}
                </Button>
                
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingDriver(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Drivers List */}
        <Card title="Drivers List" subtitle={`${drivers.length} drivers registered`}>
          <div className="space-y-4">
            {drivers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No drivers registered yet.
              </div>
            ) : (
              drivers.map((driver) => {
                const licenseStatus = getExpiryStatus(driver.license_expiry);
                
                return (
                  <div key={driver.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Users className="w-5 h-5 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">{driver.driver_name}</h3>
                          <span className={`px-2 py-1 text-sm rounded-full ${
                            licenseStatus.status === 'expired' ? 'bg-red-100 text-red-800' :
                            licenseStatus.status === 'expiring' ? 'bg-orange-100 text-orange-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {licenseStatus.status === 'expired' ? 'License Expired' :
                             licenseStatus.status === 'expiring' ? 'License Expiring' : 'License Valid'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
                          <div>
                            <span className="font-medium text-gray-700">License No:</span>
                            <div className="text-gray-600">{driver.license_no}</div>
                          </div>
                          
                          <div className={`${licenseStatus.color} p-2 rounded-lg`}>
                            <span className="font-medium">License Expiry:</span>
                            <div>{format(new Date(driver.license_expiry), 'MMM dd, yyyy')}</div>
                            <div className="text-xs">
                              {licenseStatus.status === 'expired' 
                                ? `Expired ${licenseStatus.days} days ago`
                                : `${licenseStatus.days} days remaining`
                              }
                            </div>
                          </div>
                          
                          <div>
                            <span className="font-medium text-gray-700">Address:</span>
                            <div className="text-gray-600">{driver.address}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          {driver.contact_no && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {driver.contact_no}
                            </div>
                          )}
                          
                          {driver.address && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {driver.address}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {licenseStatus.status !== 'valid' && (
                          <AlertTriangle className="w-5 h-5 text-orange-500" />
                        )}
                        
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={Edit}
                          onClick={() => handleEdit(driver)}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Drivers;