import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiCheck } from 'react-icons/fi';
import { useToast } from '../../context/ToastContext';
import { useCurrency } from '../../context/CurrencyContext';
import './Invoices.css';

import { API_URL } from '../../config/config';

const Plans = () => {
    const [plans, setPlans] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState<number | null>(null);
    const [editData, setEditData] = useState<any>({});
    const { showToast } = useToast() as any;
    const { symbol, formatMoney } = useCurrency();

    const fetchPlans = async () => {
        try {
            const token = localStorage.getItem('ev_token');
            const res = await axios.get(`${API_URL}/super/plans?admin=true`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setPlans(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
            showToast('Failed to fetch plans', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleEdit = (plan: any) => {
        setIsEditing(plan.id);
        setEditData({
            name: plan.name,
            price: plan.price,
            duration: plan.duration,
            features: typeof plan.features === 'string' ? JSON.parse(plan.features || '[]').join('\n') : plan.features.join('\n'),
            isActive: plan.isActive
        });
    };

    const handleCreateNew = () => {
        setIsEditing(0);
        setEditData({
            name: 'New Plan',
            price: 99,
            duration: 'Monthly',
            features: 'Feature 1\nFeature 2',
            isActive: true
        });
    };

    const handleSave = async (id: number) => {
        try {
            const token = localStorage.getItem('ev_token');
            const payload = {
                ...editData,
                features: editData.features.split('\n').map((f: string) => f.trim()).filter(Boolean)
            };

            if (id === 0) {
                await axios.post(`${API_URL}/super/plans`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                showToast('Plan created successfully', 'success');
            } else {
                await axios.patch(`${API_URL}/super/plans/${id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                showToast('Plan updated successfully', 'success');
            }
            setIsEditing(null);
            fetchPlans();
        } catch (error: any) {
            console.error('Save error:', error);
            showToast(error.response?.data?.message || 'Failed to save plan', 'error');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this plan?')) return;
        try {
            const token = localStorage.getItem('ev_token');
            await axios.delete(`${API_URL}/super/plans/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast('Plan deleted successfully', 'success');
            fetchPlans();
        } catch (error) {
            console.error('Delete error:', error);
            showToast('Failed to delete plan', 'error');
        }
    };

    if (isLoading) return (
        <div className="invoices-page fade-in">
            <div className="loading-state">
                <div className="loader"></div>
                <p>Loading plans and pricing...</p>
            </div>
        </div>
    );

    return (
        <div className="invoices-page fade-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2>Subscription Tiers</h2>
                    <p>Manage subscription plans, features, and pricing models</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="btn btn-primary btn-no-hover"
                    style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}
                >
                    <FiPlus /> Create New Plan
                </button>
            </div>

            <div className="stats-grid mt-lg" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {isEditing === 0 && (
                    <div className="stat-card" style={{ alignItems: 'stretch', textAlign: 'left', background: '#FFFFFF', padding: '1.5rem' }}>
                        <div style={{ paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9', marginBottom: '1rem' }}>
                            <div className="search-box-wrap" style={{ minWidth: '100%', padding: '0.5rem', marginBottom: '0.75rem' }}>
                                <input value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} placeholder="Plan Name" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E1B4B' }} />
                            </div>
                            <div className="d-flex gap-md">
                                <div className="search-box-wrap" style={{ minWidth: '0', flex: 1, padding: '0.5rem' }}>
                                    <span style={{ color: '#64748B', fontWeight: 800, marginRight: '4px' }}>{symbol}</span>
                                    <input type="number" value={editData.price} onChange={e => setEditData({ ...editData, price: e.target.value })} placeholder="Price" style={{ fontSize: '1.25rem', color: '#2D3BAE', fontWeight: 800 }} />
                                </div>
                                <div className="search-box-wrap" style={{ minWidth: '0', flex: 1, padding: '0.5rem' }}>
                                    <span style={{ color: '#64748B', marginRight: '4px' }}>/</span>
                                    <input value={editData.duration} onChange={e => setEditData({ ...editData, duration: e.target.value })} placeholder="Monthly" />
                                </div>
                            </div>
                        </div>

                        <div style={{ flex: 1 }}>
                            <label className="text-xs text-muted font-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Features (One per line)</label>
                            <textarea className="search-box-wrap" style={{ width: '100%', minWidth: '100%', minHeight: '120px', padding: '0.75rem', marginTop: '0.5rem', resize: 'vertical' }} value={editData.features} onChange={e => setEditData({ ...editData, features: e.target.value })} placeholder="Feature 1&#10;Feature 2" />
                        </div>

                        <div className="d-flex align-items-center gap-sm mt-lg mb-sm">
                            <input type="checkbox" id="active-new" checked={editData.isActive} onChange={e => setEditData({ ...editData, isActive: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                            <label htmlFor="active-new" className="font-bold text-sm" style={{ cursor: 'pointer' }}>Set as Active Plan</label>
                        </div>

                        <div className="d-flex gap-md mt-lg pt-lg" style={{ borderTop: '1px solid #f1f5f9' }}>
                            <button onClick={() => setIsEditing(null)} className="btn btn-secondary" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '0.5rem' }}><FiX /> Cancel</button>
                            <button onClick={() => handleSave(0)} className="btn btn-primary btn-no-hover" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '0.5rem' }}><FiSave /> Save Plan</button>
                        </div>
                    </div>
                )}

                {plans.map(plan => (
                    isEditing === plan.id ? (
                        <div key={plan.id} className="stat-card" style={{ alignItems: 'stretch', textAlign: 'left', background: '#FFFFFF', padding: '1.5rem', borderColor: '#2D3BAE' }}>
                            <div style={{ paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9', marginBottom: '1rem' }}>
                                <div className="search-box-wrap" style={{ minWidth: '100%', padding: '0.5rem', marginBottom: '0.75rem' }}>
                                    <input value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} placeholder="Plan Name" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E1B4B' }} />
                                </div>
                                <div className="d-flex gap-md">
                                    <div className="search-box-wrap" style={{ minWidth: '0', flex: 1, padding: '0.5rem' }}>
                                        <span style={{ color: '#64748B', fontWeight: 800, marginRight: '4px' }}>{symbol}</span>
                                        <input type="number" value={editData.price} onChange={e => setEditData({ ...editData, price: e.target.value })} style={{ fontSize: '1.25rem', color: '#2D3BAE', fontWeight: 800 }} />
                                    </div>
                                    <div className="search-box-wrap" style={{ minWidth: '0', flex: 1, padding: '0.5rem' }}>
                                        <span style={{ color: '#64748B', marginRight: '4px' }}>/</span>
                                        <input value={editData.duration} onChange={e => setEditData({ ...editData, duration: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            <div style={{ flex: 1 }}>
                                <label className="text-xs text-muted font-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Features (One per line)</label>
                                <textarea className="search-box-wrap" style={{ width: '100%', minWidth: '100%', minHeight: '120px', padding: '0.75rem', marginTop: '0.5rem', resize: 'vertical' }} value={editData.features} onChange={e => setEditData({ ...editData, features: e.target.value })} />
                            </div>

                            <div className="d-flex align-items-center gap-sm mt-lg mb-sm">
                                <input type="checkbox" id={`active-${plan.id}`} checked={editData.isActive} onChange={e => setEditData({ ...editData, isActive: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                                <label htmlFor={`active-${plan.id}`} className="font-bold text-sm" style={{ cursor: 'pointer' }}>Active Plan</label>
                            </div>

                            <div className="d-flex gap-md mt-lg pt-lg" style={{ borderTop: '1px solid #f1f5f9' }}>
                                <button onClick={() => setIsEditing(null)} className="btn btn-secondary" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '0.5rem' }}><FiX /> Cancel</button>
                                <button onClick={() => handleSave(plan.id)} className="btn btn-primary btn-no-hover" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '0.5rem' }}><FiSave /> Update</button>
                            </div>
                        </div>
                    ) : (
                        <div key={plan.id} className="stat-card" style={{ alignItems: 'stretch', textAlign: 'left', opacity: plan.isActive ? 1 : 0.65, borderColor: plan.isActive ? '#10B981' : '#E2E8F0', padding: '1.75rem', display: 'flex', flexDirection: 'column' }}>
                            <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: '0.5rem' }}>
                                <h3 className="font-bold text-xl" style={{ color: '#1E1B4B', margin: 0 }}>{plan.name}</h3>
                                {!plan.isActive && <span className="status-pill unpaid" style={{ fontSize: '0.65rem', padding: '0.25rem 0.75rem' }}>Inactive</span>}
                            </div>
                            <div className="d-flex align-items-end" style={{ marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                                <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, color: '#2D3BAE', lineHeight: 1 }}>{formatMoney(plan.price)}</h2>
                                <span className="text-muted text-sm font-semibold ml-sm" style={{ marginBottom: '4px' }}>/ {plan.duration}</span>
                            </div>

                            <div style={{ flex: 1 }}>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {(typeof plan.features === 'string' ? JSON.parse(plan.features || '[]') : plan.features).map((feature: string, idx: number) => (
                                        <li key={idx} className="d-flex align-items-start gap-sm text-sm" style={{ color: '#475569', lineHeight: 1.5 }}>
                                            <FiCheck style={{ color: '#10B981', marginTop: '3px', flexShrink: 0 }} />
                                            <span style={{ fontWeight: 500 }}>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="d-flex justify-content-end gap-md mt-xl pt-lg" style={{ borderTop: '1px solid #f1f5f9' }}>
                                <button onClick={() => handleEdit(plan)} className="action-btn-mini btn-view-invoice" title="Edit Plan">
                                    <FiEdit2 size={18} />
                                </button>
                                <button onClick={() => handleDelete(plan.id)} className="action-btn-mini btn-mark-unpaid" title="Delete Plan">
                                    <FiTrash2 size={18} />
                                </button>
                            </div>
                        </div>
                    )
                ))}
            </div>
        </div>
    );
};

export default Plans;
