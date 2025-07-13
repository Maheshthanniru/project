import React, { useState, useEffect } from 'react';
import { 
  Truck, Plus, Edit, AlertTriangle, Calendar, Search, 
  RefreshCw, Download, Printer, X, Trash2, Eye,
  Clock, CheckCircle, Filter, Settings
} from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import { vehicleTypes } from '../lib/mockData';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format, differenceInDays, parseISO } from 'date-fns';
import { supabaseDB } from '../lib/supabaseDatabase';
import { Vehicle } from '../lib/supabaseDatabase';

const Vehicles: React.FC = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    vehicleType: '',
    expiryStatus: '',
    dateRange: '',
  });

  const [newVehicle, setNewVehicle] = useState({
    vehicle_no: '',
    vehicle_type: '',
    owner_name: '',
    contact_no: '',
    insurance_expiry: '',
    permit_expiry: '',
    fitness_expiry: '',
    puc_expiry: '',
  });

  // Summary stats
  const [stats, setStats] = useState({
    totalVehicles: 0,
    expiredDocuments: 0,
    expiringDocuments: 0,
    validDocuments: 0,
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    applyFilters();
    updateStats();
  }, [vehicles, searchTerm, filters]);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const vehiclesData = await supabaseDB.getVehicles();
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...vehicles];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(vehicle =>
        vehicle.vehicle_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.vehicle_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.owner_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Vehicle type filter
    if (filters.vehicleType) {
      filtered = filtered.filter(vehicle => vehicle.vehicle_type === filters.vehicleType);
    }

    // Expiry status filter
    if (filters.expiryStatus) {
      filtered = filtered.filter(vehicle => {
        const hasExpiredDoc = hasExpiredDocuments(vehicle);
        const hasExpiringDoc = hasExpiringDocuments(vehicle);
        
        switch (filters.expiryStatus) {
          case 'expired':
            return hasExpiredDoc;
          case 'expiring':
            return hasExpiringDoc && !hasExpiredDoc;
          case 'valid':
            return !hasExpiredDoc && !hasExpiringDoc;
          default:
            return true;
        }
      });
    }

    setFilteredVehicles(filtered);
  };

  const updateStats = () => {
    const totalVehicles = vehicles.length;
    let expiredDocuments = 0;
    let expiringDocuments = 0;
    let validDocuments = 0;

    vehicles.forEach(vehicle => {
      if (hasExpiredDocuments(vehicle)) {
        expiredDocuments++;
      } else if (hasExpiringDocuments(vehicle)) {
        expiringDocuments++;
      } else {
        validDocuments++;
      }
    });

    setStats({
      totalVehicles,
      expiredDocuments,
      expiringDocuments,
      validDocuments,
    });
  };

  const getExpiryStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = differenceInDays(expiry, today);

    if (daysUntilExpiry < 0) {
      return { status: 'expired', color: 'bg-red-500 text-white', days: Math.abs(daysUntilExpiry) };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring', color: 'bg-orange-500 text-white', days: daysUntilExpiry };
    } else {
      return { status: 'valid', color: 'bg-green-500 text-white', days: daysUntilExpiry };
    }
  };

  const hasExpiredDocuments = (vehicle: Vehicle) => {
    const dates = [vehicle.insurance_expiry, vehicle.permit_expiry, vehicle.fitness_expiry, vehicle.puc_expiry];
    return dates.some(date => date && getExpiryStatus(date).status === 'expired');
  };

  const hasExpiringDocuments = (vehicle: Vehicle) => {
    const dates = [vehicle.insurance_expiry, vehicle.permit_expiry, vehicle.fitness_expiry, vehicle.puc_expiry];
    return dates.some(date => date && getExpiryStatus(date).status === 'expiring');
  };

  const handleInputChange = (field: string, value: string) => {
    if (editingVehicle) {
      setEditingVehicle({ ...editingVehicle, [field]: value });
    } else {
      setNewVehicle({ ...newVehicle, [field]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingVehicle) {
        // Update existing vehicle
        const updatedVehicle = await supabaseDB.updateVehicle(editingVehicle.id, editingVehicle);
        if (updatedVehicle) {
          await loadVehicles();
          setEditingVehicle(null);
          toast.success('Vehicle updated successfully!');
        } else {
          toast.error('Failed to update vehicle');
        }
      } else {
        // Add new vehicle
        const newVehicleData = await supabaseDB.addVehicle(newVehicle);
        if (newVehicleData) {
          await loadVehicles();
          setNewVehicle({
            vehicle_no: '',
            vehicle_type: '',
            owner_name: '',
            contact_no: '',
            insurance_expiry: '',
            permit_expiry: '',
            fitness_expiry: '',
            puc_expiry: '',
          });
          setShowAddForm(false);
          toast.success('Vehicle added successfully!');
        } else {
          toast.error('Failed to add vehicle');
        }
      }
    } catch (error) {
      console.error('Error saving vehicle:', error);
      toast.error('Failed to save vehicle');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle({ ...vehicle });
    setShowAddForm(false);
  };

  const handleDelete = (vehicleId: string) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      setVehicles(vehicles.filter(v => v.id !== vehicleId));
      toast.success('Vehicle deleted successfully!');
    }
  };

  const handleViewDetails = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDetails(true);
  };

  const exportToExcel = () => {
    const exportData = filteredVehicles.map(vehicle => ({
      'Vehicle Number': vehicle.vehicle_no,
      'Type': vehicle.vehicle_type,
      'Owner': vehicle.owner_name,
      'Contact': vehicle.contact_no,
      'Insurance Expiry': vehicle.insurance_expiry,
      'Permit Expiry': vehicle.permit_expiry,
      'Fitness Expiry': vehicle.fitness_expiry,
      'PUC Expiry': vehicle.puc_expiry,
    }));

    // Create CSV content
    const headers = Object.keys(exportData[0] || {});
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vehicles-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Vehicles exported successfully!');
  };

  const vehicleTypeOptions = [
    { value: '', label: 'All Types' },
    ...Array.from(new Set(vehicles.map(v => v.vehicle_type))).map(type => ({
      value: type,
      label: type
    }))
  ];

  const expiryStatusOptions = [
    { value: '', label: 'All Status' },
    { value: 'expired', label: 'Expired' },
    { value: 'expiring', label: 'Expiring Soon' },
    { value: 'valid', label: 'Valid' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vehicles Management</h1>
          <p className="text-gray-600">Comprehensive vehicle tracking with expiry management</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            icon={RefreshCw}
            variant="secondary"
            onClick={loadVehicles}
          >
            Refresh
          </Button>
          <Button
            icon={Download}
            variant="secondary"
            onClick={exportToExcel}
          >
            Export
          </Button>
          <Button
            icon={Plus}
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingVehicle(null);
            }}
          >
            Add Vehicle
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Vehicles</p>
              <p className="text-2xl font-bold">{stats.totalVehicles}</p>
            </div>
            <Truck className="w-8 h-8 text-blue-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Expired Documents</p>
              <p className="text-2xl font-bold">{stats.expiredDocuments}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Expiring Soon</p>
              <p className="text-2xl font-bold">{stats.expiringDocuments}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Valid Documents</p>
              <p className="text-2xl font-bold">{stats.validDocuments}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Select
            label="Vehicle Type"
            value={filters.vehicleType}
            onChange={(value) => setFilters(prev => ({ ...prev, vehicleType: value }))}
            options={vehicleTypeOptions}
          />

          <Select
            label="Expiry Status"
            value={filters.expiryStatus}
            onChange={(value) => setFilters(prev => ({ ...prev, expiryStatus: value }))}
            options={expiryStatusOptions}
          />

          <div className="flex items-end">
            <div className="text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-300 w-full text-center">
              <strong>{filteredVehicles.length}</strong> vehicles found
            </div>
          </div>
        </div>
      </Card>

      {/* Add/Edit Vehicle Form */}
      {(showAddForm || editingVehicle) && (
        <Card title={editingVehicle ? 'Edit Vehicle' : 'New Vehicle Entry Form'}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Vehicle No."
                value={editingVehicle ? editingVehicle.vehicle_no : newVehicle.vehicle_no}
                onChange={(value) => handleInputChange('vehicle_no', value)}
                placeholder="AP23AB1234"
                required
              />
              
              <Select
                label="Type"
                value={editingVehicle ? editingVehicle.vehicle_type : newVehicle.vehicle_type}
                onChange={(value) => handleInputChange('vehicle_type', value)}
                options={vehicleTypes}
                placeholder="Select vehicle type..."
                required
              />

              <Input
                label="Owner Name"
                value={editingVehicle ? editingVehicle.owner_name : newVehicle.owner_name}
                onChange={(value) => handleInputChange('owner_name', value)}
                placeholder="Owner name..."
                required
              />
            </div>

            <Input
              label="Contact Number"
              value={editingVehicle ? editingVehicle.contact_no : newVehicle.contact_no}
              onChange={(value) => handleInputChange('contact_no', value)}
              placeholder="Contact number..."
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                label="Insurance Exp Date"
                type="date"
                value={editingVehicle ? editingVehicle.insurance_expiry : newVehicle.insurance_expiry}
                onChange={(value) => handleInputChange('insurance_expiry', value)}
                required
              />
              
              <Input
                label="Permit Exp Date"
                type="date"
                value={editingVehicle ? editingVehicle.permit_expiry : newVehicle.permit_expiry}
                onChange={(value) => handleInputChange('permit_expiry', value)}
                required
              />
              
              <Input
                label="Fitness Exp Date"
                type="date"
                value={editingVehicle ? editingVehicle.fitness_expiry : newVehicle.fitness_expiry}
                onChange={(value) => handleInputChange('fitness_expiry', value)}
                required
              />

              <Input
                label="PUC Exp Date"
                type="date"
                value={editingVehicle ? editingVehicle.puc_expiry : newVehicle.puc_expiry}
                onChange={(value) => handleInputChange('puc_expiry', value)}
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? 'Saving...' : (editingVehicle ? 'Update' : 'Add')}
              </Button>
              
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingVehicle(null);
                }}
              >
                Close
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Vehicles Table */}
      <Card title="Vehicle List" subtitle={`${filteredVehicles.length} vehicles`}>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading vehicles...</p>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No vehicles found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">S.No</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Number</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Type</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Particulars</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-700">Tax Exp Date</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-700">Ins Exp Date</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-700">Permit Exp Date</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-700">Fitness Exp Date</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((vehicle, index) => {
                  const taxStatus = getExpiryStatus(vehicle.tax_exp_date);
                  const insuranceStatus = getExpiryStatus(vehicle.insurance_expiry);
                  const fitnessStatus = getExpiryStatus(vehicle.fitness_expiry);
                  const permitStatus = getExpiryStatus(vehicle.permit_expiry);
                  
                  return (
                    <tr key={vehicle.id} className={`border-b hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                    }`}>
                      <td className="px-3 py-2 font-medium">{vehicle.sno}</td>
                      <td className="px-3 py-2 font-medium text-blue-600">{vehicle.vehicle_no}</td>
                      <td className="px-3 py-2">{vehicle.vehicle_type}</td>
                      <td className="px-3 py-2 max-w-xs truncate" title={vehicle.owner_name}>
                        {vehicle.owner_name}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${taxStatus.color}`}>
                          {format(new Date(vehicle.tax_exp_date), 'dd-MM-yyyy')}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${insuranceStatus.color}`}>
                          {format(new Date(vehicle.insurance_expiry), 'dd-MM-yyyy')}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${permitStatus.color}`}>
                          {format(new Date(vehicle.permit_expiry), 'dd-MM-yyyy')}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${fitnessStatus.color}`}>
                          {format(new Date(vehicle.fitness_expiry), 'dd-MM-yyyy')}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={Eye}
                            onClick={() => handleViewDetails(vehicle)}
                            className="px-2"
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={Edit}
                            onClick={() => handleEdit(vehicle)}
                            className="px-2"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            icon={Trash2}
                            onClick={() => handleDelete(vehicle.id)}
                            className="px-2"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Vehicle Details Modal */}
      {showDetails && selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Vehicle Details - {selectedVehicle.vehicle_no}
                </h3>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={X}
                  onClick={() => setShowDetails(false)}
                >
                  Close
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-3">Vehicle Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>S.No:</strong> {selectedVehicle.sno}</div>
                      <div><strong>Vehicle Number:</strong> {selectedVehicle.vehicle_no}</div>
                      <div><strong>Type:</strong> {selectedVehicle.vehicle_type}</div>
                      <div><strong>Particulars:</strong> {selectedVehicle.owner_name}</div>
                      <div><strong>Date Added:</strong> {format(new Date(selectedVehicle.date_added), 'MMM dd, yyyy')}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-3">Document Expiry Status</h4>
                    <div className="space-y-3 text-sm">
                      {[
                        { label: 'Tax Expiry', date: selectedVehicle.tax_exp_date },
                        { label: 'Insurance Expiry', date: selectedVehicle.insurance_expiry },
                        { label: 'Fitness Expiry', date: selectedVehicle.fitness_expiry },
                        { label: 'Permit Expiry', date: selectedVehicle.permit_expiry },
                      ].map(({ label, date }) => {
                        const status = getExpiryStatus(date);
                        return (
                          <div key={label} className="flex items-center justify-between">
                            <span><strong>{label}:</strong></span>
                            <div className="text-right">
                              <div className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                                {format(new Date(date), 'MMM dd, yyyy')}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {status.status === 'expired' 
                                  ? `Expired ${status.days} days ago`
                                  : `${status.days} days remaining`
                                }
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;