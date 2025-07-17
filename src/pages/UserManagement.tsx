import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Card from '../components/UI/Card';
import toast from 'react-hot-toast';
import bcrypt from 'bcryptjs';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, User as UserIcon, Shield, ChevronDown, ChevronUp, Edit as EditIcon, X as XIcon, Save as SaveIcon } from 'lucide-react';

interface Feature {
  key: string;
  name: string;
}

interface UserRow {
  id: string;
  username: string;
  is_admin: boolean;
  features: string[];
}

const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', is_admin: false, features: [] as string[] });
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editFeatures, setEditFeatures] = useState<string[]>([]);

  useEffect(() => {
    loadUsers();
    loadFeatures();
  }, []);

  const loadUsers = async () => {
    const { data: userRows } = await supabase.from('userss').select('id, username, is_admin');
    if (!userRows) return;
    const { data: accessRows } = await supabase.from('user_access').select('user_id, feature_key');
    const usersWithFeatures = userRows.map((u: any) => ({
      ...u,
      features: (accessRows || []).filter((a: any) => a.user_id === u.id).map((a: any) => a.feature_key)
    }));
    setUsers(usersWithFeatures);
  };

  const loadFeatures = async () => {
    const { data } = await supabase.from('features').select('key, name');
    setFeatures(data || []);
  };

  const handleFeatureToggle = (featureKey: string) => {
    setNewUser(prev => ({
      ...prev,
      features: prev.features.includes(featureKey)
        ? prev.features.filter(f => f !== featureKey)
        : [...prev.features, featureKey]
    }));
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) {
      toast.error('Username and password required');
      return;
    }
    setLoading(true);
    try {
      const password_hash = await bcrypt.hash(newUser.password, 10);
      const { data: createdUser, error } = await supabase
        .from('userss')
        .insert({ username: newUser.username, password_hash, is_admin: newUser.is_admin })
        .select()
        .single();
      if (error) throw error;
      for (const feature of newUser.features) {
        await supabase.from('user_access').insert({ user_id: createdUser.id, feature_key: feature });
      }
      toast.success('User created!');
      setNewUser({ username: '', password: '', is_admin: false, features: [] });
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || 'Error creating user');
    }
    setLoading(false);
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Delete this user?')) return;
    await supabase.from('userss').delete().eq('id', id);
    await supabase.from('user_access').delete().eq('user_id', id);
    toast.success('User deleted');
    loadUsers();
  };

  const handleFeatureChange = async (userId: string, featureKey: string, hasAccess: boolean) => {
    if (hasAccess) {
      await supabase.from('user_access').insert({ user_id: userId, feature_key: featureKey });
    } else {
      await supabase.from('user_access').delete().eq('user_id', userId).eq('feature_key', featureKey);
    }
    loadUsers();
  };

  const handleModalChange = (field: string, value: any) => {
    setNewUser(prev => ({ ...prev, [field]: value }));
  };

  const handleModalFeatureToggle = (featureKey: string) => {
    setNewUser(prev => ({
      ...prev,
      features: prev.features.includes(featureKey)
        ? prev.features.filter(f => f !== featureKey)
        : [...prev.features, featureKey]
    }));
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) {
      toast.error('Username and password required');
      return;
    }
    setLoading(true);
    try {
      const password_hash = await bcrypt.hash(newUser.password, 10);
      const { data: createdUser, error } = await supabase
        .from('userss')
        .insert({ username: newUser.username, password_hash, is_admin: newUser.is_admin })
        .select()
        .single();
      if (error) throw error;
      for (const feature of newUser.features) {
        await supabase.from('user_access').insert({ user_id: createdUser.id, feature_key: feature });
      }
      toast.success('User created!');
      setShowAddForm(false);
      setNewUser({ username: '', password: '', is_admin: false, features: [] });
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || 'Error creating user');
    }
    setLoading(false);
  };

  if (!user?.is_admin) {
    return <div className="p-8 text-center text-red-600 text-xl font-bold">You are not authorized to view this page.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">
      <div className="max-w-5xl w-full mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage users and feature access for your organization</p>
          </div>
          <Button
            icon={Plus}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg"
            onClick={() => setShowAddForm(v => !v)}
          >
            {showAddForm ? 'Close Add User' : 'Add User'}
          </Button>
        </div>

        {showAddForm && (
          <Card className="mb-8 p-0 overflow-visible">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 sm:px-8 py-4 sm:py-5 flex items-center gap-3 rounded-t-2xl">
              <UserIcon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              <h2 className="text-xl sm:text-2xl font-bold text-white flex-1">Add User</h2>
            </div>
            <form onSubmit={handleModalSubmit} ref={formRef} className="space-y-6 sm:space-y-8 px-4 sm:px-10 py-6 sm:py-10">
              {/* User Info Section */}
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <Input label="Username" value={newUser?.username || ''} onChange={v => handleModalChange('username', v)} required />
                <Input label="Password" type="password" value={newUser?.password || ''} onChange={v => handleModalChange('password', v)} required />
                <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                  <input type="checkbox" checked={newUser?.is_admin || false} onChange={e => handleModalChange('is_admin', e.target.checked)} className="accent-blue-600 w-5 h-5" />
                  <span className="text-blue-800 font-medium">Admin</span>
                </label>
              </div>
              {/* Divider */}
              <div className="border-t border-blue-100 my-2" />
              {/* Feature Access Section */}
              <div>
                <div className="font-semibold mb-2 text-blue-800">Feature Access</div>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {features.map(f => (
                    <label key={f.key} className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow border-2 transition-all cursor-pointer select-none text-xs sm:text-sm font-medium
                      ${newUser?.features.includes(f.key)
                        ? 'bg-gradient-to-r from-blue-200 to-indigo-200 text-blue-900 border-blue-400 scale-105'
                        : 'bg-blue-50 text-blue-800 border-blue-100 hover:border-blue-300 hover:bg-blue-100'}
                    `}>
                      <input
                        type="checkbox"
                        checked={newUser?.features.includes(f.key) || false}
                        onChange={() => handleModalFeatureToggle(f.key)}
                        className="accent-blue-600 w-5 h-5"
                      />
                      <span>{f.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full mt-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg text-base sm:text-lg py-2.5 sm:py-3">
                {loading ? 'Adding...' : 'Add User'}
              </Button>
            </form>
          </Card>
        )}

        {/* Users List as Cards */}
        <div className="flex flex-col gap-4">
          {users.map(u => (
            <div key={u.id} className={`group flex flex-col border rounded-xl shadow-md px-6 py-4 transition-shadow hover:shadow-lg bg-white relative ${expandedUserId === u.id ? 'ring-2 ring-blue-200' : 'bg-white border-gray-200'}`}
              onMouseEnter={() => setExpandedUserId(expandedUserId === u.id ? null : u.id)}
              onMouseLeave={() => {}}
            >
              {/* Main Row (always visible) */}
              <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-4 cursor-pointer w-full"
                onClick={() => setExpandedUserId(expandedUserId === u.id ? null : u.id)}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Avatar */}
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg border-4 border-white">
                    {u.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-semibold text-blue-900 truncate max-w-[120px]">{u.username}</span>
                      {u.is_admin && (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold"><Shield className="w-4 h-4" />Admin</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      {u.is_admin ? (
                        <span className="inline-block bg-gradient-to-r from-green-100 to-green-300 text-green-900 px-3 py-1 rounded-full text-xs font-semibold border border-green-200 shadow-sm">All Access (Admin)</span>
                      ) : u.features.length === 0 ? (
                        <span className="inline-block bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs font-medium border border-gray-200">No access</span>
                      ) : (
                        u.features.slice(0, 2).map(fk => {
                          const f = features.find(ff => ff.key === fk);
                          return f ? (
                            <span key={fk} className="flex items-center gap-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium border border-blue-200 shadow-sm">
                              {/* Optionally add an icon here */}
                              {f.name}
                            </span>
                          ) : null;
                        })
                      )}
                      {!u.is_admin && u.features.length > 2 && (
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-medium border border-blue-200">+{u.features.length - 2} more</span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Actions and expand/collapse */}
                <div className="flex flex-col items-end gap-2">
                  <span
                    onClick={e => { e.stopPropagation(); handleDeleteUser(u.id); }}
                    className="w-full"
                  >
                    <Button
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                      disabled={u.username === user?.username}
                      className="mt-2"
                    >
                      Delete
                    </Button>
                  </span>
                  <button
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                    onClick={e => { e.stopPropagation(); setExpandedUserId(expandedUserId === u.id ? null : u.id); }}
                    aria-label={expandedUserId === u.id ? 'Collapse details' : 'Expand details'}
                    type="button"
                  >
                    {expandedUserId === u.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              {/* Expanded Details (on click) */}
              <div
                className={`transition-all duration-200 overflow-hidden ${expandedUserId === u.id ? 'max-h-96 opacity-100 py-3 px-0' : 'max-h-0 opacity-0 py-0 px-0'} w-full bg-gray-50 rounded-b-2xl border-t border-gray-100`}
                style={{ pointerEvents: expandedUserId === u.id ? 'auto' : 'none' }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2 md:px-6">
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Username</div>
                    <div className="text-gray-800 font-medium">{u.username}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Admin Status</div>
                    <div className="text-gray-800 font-medium">{u.is_admin ? 'Admin' : 'User'}</div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="mb-1 text-xs text-gray-500 flex items-center gap-2">
                      Feature Access
                      {!u.is_admin && (
                        editingUserId === u.id ? (
                          <>
                            <button
                              className="ml-2 text-gray-500 hover:text-blue-700 text-xs flex items-center gap-1"
                              onClick={() => { setEditingUserId(null); setEditFeatures([]); }}
                              type="button"
                            >
                              <XIcon className="w-4 h-4" /> Cancel
                            </button>
                            <button
                              className="ml-2 text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                              onClick={async () => {
                                // Save feature access changes
                                setLoading(true);
                                // Remove all current access
                                await supabase.from('user_access').delete().eq('user_id', u.id);
                                // Add new access
                                for (const feature of editFeatures) {
                                  await supabase.from('user_access').insert({ user_id: u.id, feature_key: feature });
                                }
                                setEditingUserId(null);
                                setEditFeatures([]);
                                await loadUsers();
                                setLoading(false);
                                toast.success('Feature access updated!');
                              }}
                              type="button"
                              disabled={loading}
                            >
                              <SaveIcon className="w-4 h-4" /> Save
                            </button>
                          </>
                        ) : (
                          <button
                            className="ml-2 text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                            onClick={() => { setEditingUserId(u.id); setEditFeatures(u.features); }}
                            type="button"
                          >
                            <EditIcon className="w-4 h-4" /> Edit
                          </button>
                        )
                      )}
                    </div>
                    {u.is_admin ? (
                      <span className="inline-block bg-gradient-to-r from-green-100 to-green-300 text-green-900 px-3 py-1 rounded-full text-xs font-semibold border border-green-200 shadow-sm">All Access (Admin)</span>
                    ) : editingUserId === u.id ? (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {features.map(f => (
                          <label key={f.key} className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow border-2 transition-all cursor-pointer select-none text-xs font-medium
                            ${editFeatures.includes(f.key)
                              ? 'bg-gradient-to-r from-blue-200 to-indigo-200 text-blue-900 border-blue-400 scale-105'
                              : 'bg-blue-50 text-blue-800 border-blue-100 hover:border-blue-300 hover:bg-blue-100'}
                          `}>
                            <input
                              type="checkbox"
                              checked={editFeatures.includes(f.key)}
                              onChange={() => setEditFeatures(prev => prev.includes(f.key)
                                ? prev.filter(k => k !== f.key)
                                : [...prev, f.key])}
                              className="accent-blue-600 w-5 h-5"
                            />
                            <span>{f.name}</span>
                          </label>
                        ))}
                      </div>
                    ) : u.features.length === 0 ? (
                      <span className="inline-block bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs font-medium border border-gray-200">No access assigned</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {u.features.map(fk => {
                          const f = features.find(ff => ff.key === fk);
                          return f ? (
                            <span key={fk} className="flex items-center gap-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium border border-blue-200 shadow-sm">
                              {f.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserManagement; 