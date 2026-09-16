import { useState, useEffect } from 'react';
import { FiShoppingCart, FiPlus, FiTrash2, FiRefreshCw, FiList, FiInfo } from 'react-icons/fi';
import { pharmacyService } from '../../services/pharmacy.service';
import { receptionService } from '../../services/reception.service';
import { useToast } from '../../context/ToastContext';
import { useCurrency } from '../../context/CurrencyContext';
import '../SharedDashboard.css';
import './PharmacyMedicineSale.css';

interface LineItem {
    inventoryId: number;
    name: string;
    unitPrice: number;
    quantity: number;
}

const PharmacyMedicineSale = () => {
    const toast = useToast();
    const { formatMoney } = useCurrency();
    const [patients, setPatients] = useState<any[]>([]);
    const [inventory, setInventory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [patientId, setPatientId] = useState<string>('');
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [sales, setSales] = useState<any[]>([]);
    const [loadingSales, setLoadingSales] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [patientsRes, invRes] = await Promise.all([
                receptionService.getPatients().catch(() => ({ data: [] })),
                pharmacyService.getInventory().catch(() => ({ data: [] }))
            ]);
            const pData = (patientsRes as any)?.data ?? (Array.isArray(patientsRes) ? patientsRes : []);
            const iData = (invRes as any)?.data ?? (Array.isArray(invRes) ? invRes : []);
            setPatients(Array.isArray(pData) ? pData : []);
            setInventory(Array.isArray(iData) ? iData : []);
        } catch (e) {
            console.error(e);
            toast.error('Failed to load patients or inventory');
        } finally {
            setLoading(false);
        }
    };

    const fetchSales = async () => {
        try {
            setLoadingSales(true);
            const res: any = await pharmacyService.getPosSales();
            const data = res?.data ?? res ?? [];
            setSales(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            toast.error('Failed to load sales');
        } finally {
            setLoadingSales(false);
        }
    };

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { fetchSales(); }, []);

    const addLine = () => {
        if (inventory.length === 0) {
            toast.error('No inventory items available');
            return;
        }
        const first = inventory[0];
        setLineItems(prev => [...prev, {
            inventoryId: first.id,
            name: first.name,
            unitPrice: Number(first.unitPrice) || 0,
            quantity: 1
        }]);
    };

    const updateLine = (index: number, field: keyof LineItem, value: number | string) => {
        setLineItems(prev => {
            const next = [...prev];
            if (field === 'inventoryId') {
                const item = inventory.find(i => i.id === Number(value));
                if (item) {
                    next[index] = { ...next[index], inventoryId: item.id, name: item.name, unitPrice: Number(item.unitPrice) || 0, quantity: next[index].quantity };
                }
            } else if (field === 'quantity') {
                next[index] = { ...next[index], quantity: Number(value) || 0 };
            }
            return next;
        });
    };

    const removeLine = (index: number) => {
        setLineItems(prev => prev.filter((_, i) => i !== index));
    };

    const totalAmount = lineItems.reduce((sum, row) => sum + row.unitPrice * row.quantity, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!patientId) {
            toast.error('Please select a patient');
            return;
        }
        if (lineItems.length === 0 || lineItems.every(l => l.quantity <= 0)) {
            toast.error('Add at least one item with quantity');
            return;
        }
        setSubmitting(true);
        try {
            await pharmacyService.directSale({
                patientId: Number(patientId),
                items: lineItems.filter(l => l.quantity > 0).map(l => ({
                    inventoryId: l.inventoryId,
                    quantity: l.quantity,
                    price: l.unitPrice
                })),
                paid: false
            });
            toast.success('Order sent to billing');
            setPatientId('');
            setLineItems([]);
            fetchSales();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || err?.message || 'Sale failed');
        } finally {
            setSubmitting(false);
        }
    };



    return (
        <div className="dashboard-container fade-in">
            <div className="page-header">
                <div>
                    <h1>Medicine Sale</h1>
                    <p>Direct sale (POS) — sell medicines over the counter without a prescription.</p>
                </div>
                <button className="btn btn-secondary btn-sm btn-with-icon" onClick={fetchData} disabled={loading}>
                    <FiRefreshCw className={loading ? 'spin' : ''} />
                    <span>Refresh</span>
                </button>
            </div>

            <div className="content-card pharmacy-medicine-sale-form" style={{ maxWidth: '720px', width: '100%' }}>
                <div className="card-header">
                    <h2><FiShoppingCart /> New Sale</h2>
                </div>
                <form onSubmit={handleSubmit} className="pharmacy-medicine-sale-form-body">
                    <div className="form-group">
                        <label>Patient *</label>
                        <select
                            className="form-control"
                            value={patientId}
                            onChange={e => setPatientId(e.target.value)}
                            required
                        >
                            <option value="">Select patient</option>
                            {patients.map(p => (
                                <option key={p.id} value={p.id}>{p.name} {p.email ? `(${p.email})` : ''}</option>
                            ))}
                        </select>
                    </div>

                    <div className="medicine-sale-items-row">
                        <label className="medicine-sale-items-label">Items</label>
                        <button type="button" className="btn btn-primary btn-sm btn-with-icon medicine-sale-add-btn" onClick={addLine} style={{ width: 'auto', minWidth: 'unset' }}>
                            <FiPlus /> <span>Add item</span>
                        </button>
                    </div>

                    {lineItems.length > 0 && (
                        <div className="table-responsive medicine-sale-table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>Unit Price</th>
                                        <th>Qty</th>
                                        <th>Total</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lineItems.map((row, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                <select
                                                    className="form-control"
                                                    value={row.inventoryId}
                                                    onChange={e => updateLine(idx, 'inventoryId', e.target.value)}
                                                >
                                                    {inventory.map(i => (
                                                        <option key={i.id} value={i.id}>{i.name} {i.sku ? `(${i.sku})` : ''}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>{row.unitPrice.toFixed(2)}</td>
                                            <td>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    className="form-control medicine-sale-qty-input"
                                                    value={row.quantity}
                                                    onChange={e => updateLine(idx, 'quantity', e.target.value)}
                                                />
                                            </td>
                                            <td>{(row.unitPrice * row.quantity).toFixed(2)}</td>
                                            <td>
                                                <button type="button" className="btn btn-secondary btn-sm medicine-sale-remove-btn" onClick={() => removeLine(idx)} title="Remove">
                                                    <FiTrash2 />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {lineItems.length === 0 && (
                        <p className="text-muted medicine-sale-empty-hint">Click &quot;Add item&quot; to add medicines from inventory.</p>
                    )}

                    <div className="medicine-sale-total">
                        Total Value: {formatMoney(totalAmount)}
                    </div>

                    <div className="medicine-sale-actions">
                        <button type="submit" className="btn btn-primary btn-sm medicine-sale-submit-btn" disabled={submitting || lineItems.length === 0} style={{ width: 'auto' }}>
                            {submitting ? 'Processing...' : 'Send to Billing'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="content-card mt-xl" style={{ width: '100%' }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h2><FiList /> Pharmacy Sale Orders</h2>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={fetchSales} disabled={loadingSales}>
                        <FiRefreshCw className={loadingSales ? 'spin' : ''} /> Refresh
                    </button>
                </div>
                <div className="table-status-info" style={{ padding: '0 1.5rem', marginTop: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: '#FEF3C7', color: '#92400E', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FiInfo /> All walk-in sales must be sent to Billing. Dispense items ONLY after payment is confirmed in Orders View.
                    </div>
                </div>
                <div className="table-responsive" style={{ padding: '1rem 1.5rem' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Patient</th>
                                <th>Items</th>
                                <th>Amount</th>
                                <th>Payment</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingSales ? (
                                <tr><td colSpan={7} className="text-center">Loading...</td></tr>
                            ) : sales.length === 0 ? (
                                <tr><td colSpan={7} className="text-center p-lg text-muted">No sale orders yet. Create one above.</td></tr>
                            ) : sales.map((s: any) => (
                                <tr key={s.id}>
                                    <td>#{s.id}</td>
                                    <td>{s.patientName || s.patient?.name || '—'}</td>
                                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.testName || s.service}>{s.testName || s.service || '—'}</td>
                                    <td>{formatMoney(Number(s.amount || s.totalAmount) || 0)}</td>
                                    <td>
                                        <span className={`status-pill ${s.paymentStatus === 'Paid' || s.status === 'Paid' ? 'paid' : 'pending'}`}>
                                            {s.paymentStatus || s.status || 'Pending'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-pill ${(s.testStatus || s.status || 'Pending').toLowerCase().replace(' ', '-')}`}>
                                            {s.testStatus || s.status || 'Pending'}
                                        </span>
                                    </td>
                                    <td>{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>


        </div>
    );
};

export default PharmacyMedicineSale;
