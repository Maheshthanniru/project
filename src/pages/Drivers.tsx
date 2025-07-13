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

  // Driver state according to schema
  const [newDriver, setNewDriver] = useState({
    driver_name: '',
    license_no: '',
    exp_date: '',
    particulars: '',
    phone: '',
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
            exp_date: '',
            particulars: '',
            phone: '',
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
                  placeholder="License number"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="License Expiry Date"
                  type="date"
                  value={editingDriver ? editingDriver.exp_date : newDriver.exp_date}
                  onChange={(value) => handleInputChange('exp_date', value)}
                />
                <Input
                  label="Phone"
                  value={editingDriver ? editingDriver.phone : newDriver.phone}
                  onChange={(value) => handleInputChange('phone', value)}
                  placeholder="Phone number"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Address"
                  value={editingDriver ? editingDriver.address : newDriver.address}
                  onChange={(value) => handleInputChange('address', value)}
                  placeholder="Driver address..."
                />
                <Input
                  label="Particulars"
                  value={editingDriver ? editingDriver.particulars : newDriver.particulars}
                  onChange={(value) => handleInputChange('particulars', value)}
                  placeholder="Description..."
                />
              </div>
              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : (editingDriver ? 'Update Driver' : 'Add Driver')}
                </Button>
                <Button type="button" variant="secondary" onClick={() => { setShowAddForm(false); setEditingDriver(null); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Drivers List */}
        <Card title="Drivers List" subtitle={`${drivers.length} drivers registered`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left font-bold text-blue-700">S.No</th>
                  <th className="px-3 py-2 text-left font-bold text-blue-700">Driver Name</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">License Number</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">License Expiry</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Phone</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Address</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Particulars</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((driver) => (
                  <tr key={driver.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2 font-medium">{driver.sno}</td>
                    <td className="px-3 py-2 font-bold text-blue-700">{driver.driver_name}</td>
                    <td className="px-3 py-2">{driver.license_no}</td>
                    <td className="px-3 py-2">{driver.exp_date ? format(new Date(driver.exp_date), 'dd-MM-yyyy') : '-'}</td>
                    <td className="px-3 py-2">{driver.phone}</td>
                    <td className="px-3 py-2">{driver.address}</td>
                    <td className="px-3 py-2">{driver.particulars}</td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={Edit}
                          onClick={() => handleEdit(driver)}
                        >
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Drivers;