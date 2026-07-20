import React, { useState, useRef } from 'react';

import {
  Save, Mail, Settings as SettingsIcon,
  User, Lock, Camera, Phone, Shield,
  Eye, EyeOff, Sliders, Minus, Plus, AlertTriangle, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { changePasswordApi, updateProfileApi, updateSupplierSettingsApi } from '../commonApi/api';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});

  // Profile state
  const [profile, setProfile] = useState({
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    phone: user.phone || '',
    email: user.email || '',
    role: user.role || 'SUPPLIER'
  });

  const [avatarImage, setAvatarImage] = useState(user.profile_image || null);
  const fileInputRef = useRef(null);

  // Password state
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [saving, setSaving] = useState(false);

  // Supplier settings state
  const [lowStockThreshold, setLowStockThreshold] = useState(user.low_stock_threshold !== undefined ? user.low_stock_threshold : 10);
  const [mockQuantity, setMockQuantity] = useState(8);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await updateProfileApi({
        first_name: profile.firstName,
        last_name: profile.lastName,
        phone: profile.phone
      });
      if (response.success) {
        toast.success('Profile updated successfully!');
        const updatedUser = response.data;
        // Keep the local avatarImage if any
        updatedUser.profile_image = avatarImage;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match!');
      return;
    }
    setSaving(true);
    try {
      const response = await changePasswordApi({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      if (response.success) {
        toast.success('Password changed successfully!');
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleSupplierSettingsSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await updateSupplierSettingsApi(lowStockThreshold);
      if (response.success) {
        toast.success('Supplier settings updated successfully!');
        const updatedUser = response.data;
        // Keep the local avatarImage if any
        updatedUser.profile_image = avatarImage;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update supplier settings');
    } finally {
      setSaving(false);
    }
  };



  const renderTabs = () => {
    const tabs = [
      { id: 'profile', label: 'Profile Information', icon: User },
      { id: 'password', label: 'Change Password', icon: Lock },
    ];

    if (user.role === 'SUPPLIER') {
      tabs.push({ id: 'supplierSettings', label: 'Supplier Settings', icon: Sliders });
    }



    return (
      <div className="flex flex-col gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                ? 'bg-active-btn text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
            >
              <tab.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>
    );
  };

  const renderProfileForm = () => (
    <div className="max-w-3xl animate-fade-in">
      <h3 className="text-[1.35rem] font-semibold text-slate-800 mb-8">Profile Information</h3>

      {/* Avatar Upload */}
      <div className="flex items-center gap-6 mb-10">
        <div className="relative">
          <div className="h-[90px] w-[90px] rounded-full flex items-center justify-center border-2 border-slate-100 shadow-sm overflow-hidden">
            <User className="h-10 w-10 text-slate-300" />
            <img
              src={avatarImage || `https://ui-avatars.com/api/?name=${encodeURIComponent((user?.first_name || 'Admin') + ' ' + (user?.last_name || 'User'))}&background=0D8ABC&color=fff&rounded=true`}
              alt="Avatar"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 p-1.5 bg-active-btn text-white rounded-full border-[3px] border-white shadow-sm hover:scale-105 transition-transform z-10"
          >
            <Camera className="w-[14px] h-[14px]" />
          </button>
        </div>
        <div>
          <h4 className="text-[15px] font-bold text-slate-800">Profile Photo</h4>
          <p className="text-sm text-slate-500 mt-1">Upload a new photo to update your avatar.</p>
        </div>
      </div>

      <form onSubmit={handleProfileSave} className="space-y-7">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-7">
          {/* Full Name */}
          <div className="relative mt-2">
            <label className="absolute -top-[9px] left-3 bg-white px-1 text-[11px] font-semibold text-slate-500 tracking-wide uppercase z-10">
              Full Name <span className='text-red-500'>*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={`${profile.firstName} ${profile.lastName}`.trim()}
                onChange={(e) => {
                  const parts = e.target.value.split(' ');
                  setProfile({ ...profile, firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '' });
                }}
                className="w-full pl-10 pr-4 py-3 bg-transparent border border-slate-300 rounded-[10px] text-[15px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200"
                required
              />
            </div>
          </div>

          {/* Phone Number */}
          <div className="relative mt-2">
            <label className="absolute -top-[9px] left-3 bg-white px-1 text-[11px] font-semibold text-slate-500 tracking-wide uppercase z-10">
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Phone className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-transparent border border-slate-300 rounded-[10px] text-[15px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200"
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="relative mt-2">
            <label className="absolute -top-[9px] left-3 bg-white px-1 text-[11px] font-semibold text-slate-500 tracking-wide uppercase z-10">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full pl-10 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-[10px] text-[15px] text-slate-500 cursor-not-allowed"
              />
            </div>
            <p className="text-[12px] text-slate-400 mt-2 pl-1">Email cannot be changed.</p>
          </div>

          {/* Role */}
          <div className="relative mt-2">
            <label className="absolute -top-[9px] left-3 bg-white px-1 text-[11px] font-semibold text-slate-500 tracking-wide uppercase z-10">
              Role
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Shield className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={profile.role === 'SUPPLIER' ? 'Supplier' : 'System Admin'}
                disabled
                className="w-full pl-10 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-[10px] text-[15px] text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center px-7 py-3 bg-active-btn text-white rounded-xl hover:opacity-90 transition-all duration-200 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderPasswordForm = () => (
    <div className="max-w-2xl animate-fade-in">
      <h3 className="text-[1.35rem] font-bold text-slate-800 mb-8">Change Password</h3>

      <form onSubmit={handlePasswordSave} className="space-y-7">
        <div className="relative mt-2">
          <label className="absolute -top-[9px] left-3 bg-white px-1 text-[11px] font-semibold text-slate-500 tracking-wide uppercase z-10">
            Current Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type={showPasswords.current ? "text" : "password"}
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              className="w-full pl-10 pr-12 py-3 bg-transparent border border-slate-300 rounded-[10px] text-[15px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200"
              required
            />
            <button
              type="button"
              onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-7 mt-2">
          <div className="relative mt-2">
            <label className="absolute -top-[9px] left-3 bg-white px-1 text-[11px] font-semibold text-slate-500 tracking-wide uppercase z-10">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type={showPasswords.new ? "text" : "password"}
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                className="w-full pl-10 pr-12 py-3 bg-transparent border border-slate-300 rounded-[10px] text-[15px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="relative mt-2">
            <label className="absolute -top-[9px] left-3 bg-white px-1 text-[11px] font-semibold text-slate-500 tracking-wide uppercase z-10">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type={showPasswords.confirm ? "text" : "password"}
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                className="w-full pl-10 pr-12 py-3 bg-transparent border border-slate-300 rounded-[10px] text-[15px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center px-7 py-3 bg-active-btn text-white rounded-xl hover:opacity-90 transition-all duration-200 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderSupplierSettingsForm = () => {
    // Helper to get preview badge style
    const getPreviewBadge = (qty, threshold) => {
      if (qty === 0) {
        return {
          label: 'Out of Stock',
          style: 'bg-rose-600 text-white',
          desc: 'Stock count is 0. The design will show as completely Out of Stock.'
        };
      } else if (qty <= threshold) {
        return {
          label: 'Low Stock',
          style: 'bg-amber-500 text-white animate-pulse',
          desc: `Stock is at or below your set threshold of ${threshold}. This triggers warning notifications and badges.`
        };
      } else {
        return {
          label: 'In Stock',
          style: 'bg-emerald-600 text-white',
          desc: `Stock is above your threshold of ${threshold}. The product will show normally as In Stock.`
        };
      }
    };

    const badgeInfo = getPreviewBadge(mockQuantity, lowStockThreshold);

    return (
      <div className="max-w-4xl animate-fade-in text-left">
        <div className="mb-8">
          <h3 className="text-[1.35rem] font-semibold text-slate-800">Supplier Settings</h3>
          <p className="text-sm text-slate-500 mt-1">Configure your inventory parameters and alerts.</p>
        </div>

        {/* Info Tip banner */}
        <div className="mb-8 p-4.5 bg-blue-50/50 border border-blue-100 rounded-2xl flex gap-3 text-left">
          <AlertTriangle className="w-5.5 h-5.5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-blue-900">Dynamic Inventory Alerting</h4>
            <p className="text-xs text-blue-700/90 mt-1 leading-relaxed">
              Updating your low stock quantity threshold dynamically adjusts how the system labels and alerts your products.
              Your product catalog and supplier dashboard will reflect this custom limit immediately.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Side */}
          <form onSubmit={handleSupplierSettingsSave} className="space-y-6 lg:col-span-7 font-sans">
            <div className="bg-slate-50/50 border border-slate-200/65 p-6 rounded-2xl space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Low Stock Alert Quantity
                </label>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Choose the minimum quantity below which an item is considered low stock.
                </p>

                {/* Stepper Input */}
                <div className="flex items-center gap-3 mb-5">
                  <button
                    type="button"
                    onClick={() => setLowStockThreshold(prev => Math.max(1, prev - 1))}
                    className="p-3 bg-white border border-slate-350 hover:bg-slate-100 rounded-xl transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                  >
                    <Minus className="w-4 h-4 text-slate-700" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 text-center py-2.5 bg-white border border-slate-350 rounded-xl text-[16px] font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setLowStockThreshold(prev => Math.min(999, prev + 1))}
                    className="p-3 bg-white border border-slate-350 hover:bg-slate-100 rounded-xl transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                  >
                    <Plus className="w-4 h-4 text-slate-700" />
                  </button>
                </div>

                {/* Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400 font-semibold px-0.5">
                    <span>1 Unit</span>
                    <span>50 Units</span>
                    <span>100 Units</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={lowStockThreshold > 100 ? 100 : lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-205 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center px-7 py-3 bg-active-btn text-white rounded-xl hover:opacity-90 transition-all duration-200 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>

          {/* Interactive Preview Side */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-left relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 bg-blue-50/50 rounded-bl-2xl text-blue-600">
                <Sparkles className="w-4.5 h-4.5 animate-bounce" />
              </div>

              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                Live Preview Widget
              </h4>

              {/* Sample Product Visual */}
              <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50 mb-5">
                <div className="aspect-[4/3] bg-gradient-to-tr from-slate-100 to-slate-200 relative flex items-center justify-center">
                  {/* Decorative Design Preview */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 to-transparent"></div>
                  <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Sample Product Design</span>
                  
                  {/* Stock Level Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-semibold tracking-wider uppercase transition-all duration-300 ${badgeInfo.style}`}>
                      {mockQuantity} pcs
                    </span>
                  </div>

                  {/* Stock Status Badge */}
                  <div className="absolute bottom-3 left-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[8.5px] font-bold uppercase tracking-wider transition-all duration-300 shadow-sm ${badgeInfo.style}`}>
                      {badgeInfo.label}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <span className="text-[8px] font-bold text-blue-600 tracking-wider uppercase block mb-0.5">Classic Georgette</span>
                  <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wide truncate mb-1">MOCK SILK SAREE</h5>
                  <div className="flex gap-2">
                    <span className="text-[9px] text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded-sm font-semibold uppercase">
                      CODE: MOCK-01
                    </span>
                  </div>
                </div>
              </div>

              {/* Interactive Controller */}
              <div className="space-y-4 pt-1 border-t border-slate-100">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-750">
                      Test Inventory Count
                    </label>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      {mockQuantity} units
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={mockQuantity}
                    onChange={(e) => setMockQuantity(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50/70 text-[11px] text-slate-500 leading-relaxed transition-all duration-300">
                  <strong className="text-slate-700 block mb-1">Behavior:</strong>
                  {badgeInfo.desc}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-[1200px] mx-auto pb-10">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <SettingsIcon className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
        </div>
        <p className="text-sm text-slate-500 ml-8">Manage your account preferences</p>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-200 flex flex-col md:flex-row min-h-[650px] overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-[280px] p-6 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/40">
          {renderTabs()}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 md:p-12">
          {activeTab === 'profile' && renderProfileForm()}
          {activeTab === 'password' && renderPasswordForm()}
          {activeTab === 'supplierSettings' && renderSupplierSettingsForm()}

        </div>
      </div>
    </div>
  );
};

export default Settings;
