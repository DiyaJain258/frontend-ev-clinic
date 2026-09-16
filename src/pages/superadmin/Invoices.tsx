/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { FiSearch, FiDollarSign, FiFileText, FiCheckCircle, FiAlertCircle, FiFilter, FiCalendar, FiDownload } from 'react-icons/fi';
import { useApp } from '../../context/AppContext';
import { superService } from '../../services/super.service';
import { useCurrency } from '../../context/CurrencyContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Invoices.css';

const Invoices = () => {
    const { clinics } = useApp() as any;
    const { formatMoney } = useCurrency();
    const [searchTerm, setSearchTerm] = useState('');
    const [invoices, setInvoices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filters, setFilters] = useState({
        status: 'all',
        startDate: '',
        endDate: '',
        clinicId: ''
    });
    const [reports, setReports] = useState<any>(null);

    useEffect(() => {
        fetchInvoices();
        fetchReports();
    }, [filters]);

    const fetchInvoices = async () => {
        setIsLoading(true);
        try {
            const res = await superService.getInvoices({
                ...filters,
                search: searchTerm
            });
            setInvoices(res.data || []);
        } catch (error) {
            console.error('Failed to fetch invoices:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchReports = async () => {
        try {
            const res = await superService.getReports(filters);
            setReports(res.data);
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        }
    };

    const handleFilterChange = (e: any) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const formatCurrency = (amount: number) => formatMoney(amount);

    const formatDate = (date: string) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const parseInvoiceDescription = (desc: string) => {
        try {
            const parsed = JSON.parse(desc);
            return typeof parsed === 'object' ? parsed : { note: desc, base: 0, tax: 0, percent: 0 };
        } catch {
            return { note: desc, base: 0, tax: 0, percent: 0 };
        }
    };

    const handleDownloadInvoice = (invoice: any) => {
        const doc = new jsPDF();
        const details = parseInvoiceDescription(invoice.description);

        // Header
        doc.setFillColor(30, 27, 75);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('TAX INVOICE', 15, 25);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Invoice #: ${invoice.invoiceNumber}`, 140, 20);
        doc.text(`Date: ${formatDate(invoice.issuedDate)}`, 140, 26);
        doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, 140, 32);

        // EV Clinic Details
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('EV Clinic Platform', 15, 55);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Exclusive Vision HIS', 15, 62);
        doc.text('evclinic.com | support@evclinic.com', 15, 68);

        // Bill To
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Billed To:', 140, 55);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${invoice.clinic?.name || 'Unknown Facility'}`, 140, 62);
        if (invoice.clinic?.location) doc.text(invoice.clinic.location, 140, 68);
        if (invoice.clinic?.email) doc.text(invoice.clinic.email, 140, 74);
        if (invoice.clinic?.contact) doc.text(invoice.clinic.contact, 140, 80);

        // Status Ribbon
        const isPaid = invoice.status === 'Paid';
        doc.setFillColor(isPaid ? 16 : 239, isPaid ? 185 : 68, isPaid ? 129 : 68);
        doc.rect(15, 85, 30, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(invoice.status.toUpperCase(), 18, 91);

        // Table
        const subtotal = details.base || Number(invoice.amount) || 0;
        const tax = details.tax || 0;
        const total = Number(invoice.amount) || 0;

        autoTable(doc, {
            startY: 105,
            head: [['Description', 'Plan', 'Qty/Users', 'Unit Price', 'Total']],
            body: [
                [
                    details.note || invoice.description,
                    details.plan || 'Standard Subscription',
                    details.users || '1',
                    details.pricePerUser ? formatCurrency(details.pricePerUser) : formatCurrency(subtotal),
                    formatCurrency(subtotal)
                ],
            ],
            theme: 'striped',
            headStyles: { fillColor: [45, 59, 174], textColor: 255, fontStyle: 'bold' },
            bodyStyles: { textColor: 50 },
            alternateRowStyles: { fillColor: [245, 247, 250] },
            margin: { left: 15, right: 15 }
        });

        // Totals
        const finalY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Subtotal:', 140, finalY);
        doc.setTextColor(50, 50, 50);
        doc.text(formatCurrency(subtotal), 180, finalY, { align: 'right' });

        doc.setTextColor(100, 100, 100);
        doc.text(`Tax (GST ${details.percent || 0}%):`, 140, finalY + 8);
        doc.setTextColor(50, 50, 50);
        doc.text(formatCurrency(tax), 180, finalY + 8, { align: 'right' });

        doc.setDrawColor(200, 200, 200);
        doc.line(140, finalY + 13, 195, finalY + 13);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 27, 75);
        doc.text('Total Amount:', 140, finalY + 20);
        doc.text(formatCurrency(total), 180, finalY + 20, { align: 'right' });

        // Footer terms
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150, 150, 150);
        doc.text('Thank you for choosing EV Clinic HIS.', 15, 270);
        doc.text('Payment is due within 7 days of the invoice date.', 15, 275);

        doc.save(`${invoice.invoiceNumber}.pdf`);
    };

    const handleUpdateStatus = async (id: number, newStatus: string) => {
        try {
            await superService.updateInvoiceStatus(id, newStatus);
            // Update local state
            setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: newStatus } : inv));
            fetchReports(); // Refresh stats
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update invoice status');
        }
    };

    return (
        <div className="invoices-page fade-in">
            <div className="page-header">
                <div>
                    <h2>Subscription & Revenue</h2>
                    <p>Track clinic payments, generate invoices, and monitor financial health</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon-square" style={{ backgroundColor: '#10B98115', color: '#10B981' }}>
                        <FiDollarSign />
                    </div>
                    <div>
                        <p className="stat-label">Total Revenue</p>
                        <h3 className="stat-value">{formatCurrency(reports?.totalRevenue || 0)}</h3>
                        <span className="stat-sub text-success">Paid Invoices</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-square" style={{ backgroundColor: '#3F46B815', color: '#3F46B8' }}>
                        <FiFileText />
                    </div>
                    <div>
                        <p className="stat-label">Total Invoices</p>
                        <h3 className="stat-value">{reports?.totalInvoices || 0}</h3>
                        <span className="stat-sub text-muted">All Time</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-square" style={{ backgroundColor: '#10B98115', color: '#10B981' }}>
                        <FiCheckCircle />
                    </div>
                    <div>
                        <p className="stat-label">Paid</p>
                        <h3 className="stat-value">{reports?.paidInvoices || 0}</h3>
                        <span className="stat-sub text-success">Collected</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-square" style={{ backgroundColor: '#EF444415', color: '#EF4444' }}>
                        <FiAlertCircle />
                    </div>
                    <div>
                        <p className="stat-label">Unpaid</p>
                        <h3 className="stat-value">{reports?.unpaidInvoices || 0}</h3>
                        <span className="stat-sub text-danger">Pending</span>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="filters-container mt-lg">
                <div className="filters-header">
                    <div className="search-box-wrap">
                        <FiSearch />
                        <input
                            type="text"
                            placeholder="Search by invoice number or clinic name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && fetchInvoices()}
                        />
                    </div>
                    <div className="filters-actions">
                        <div className="filter-item">
                            <label>Invoice Status</label>
                            <div className="filter-input-group">
                                <FiFilter />
                                <select name="status" value={filters.status} onChange={handleFilterChange}>
                                    <option value="all">Global (All)</option>
                                    <option value="Paid">Paid Only</option>
                                    <option value="Unpaid">Unpaid Only</option>
                                </select>
                            </div>
                        </div>
                        <div className="filter-item">
                            <label>Date Range</label>
                            <div className="filter-input-group">
                                <FiCalendar />
                                <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
                                <span className="text-muted">→</span>
                                <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
                            </div>
                        </div>
                        <div className="filter-item">
                            <label>Select Facility</label>
                            <div className="filter-input-group">
                                <select name="clinicId" value={filters.clinicId} onChange={handleFilterChange}>
                                    <option value="">All Facilities</option>
                                    {clinics.map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <button className="btn-apply" onClick={fetchInvoices}>Filter Result</button>
                    </div>
                </div>

                {/* Invoices Table */}
                <div className="table-container">
                    {isLoading ? (
                        <div className="loading-state">
                            <div className="loader"></div>
                            <p>Querying financial records...</p>
                        </div>
                    ) : invoices.length === 0 ? (
                        <div className="empty-state">
                            <FiFileText size={48} />
                            <p>No invoices found matching your criteria</p>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Ref #</th>
                                    <th>Facility</th>
                                    <th>Billing Description</th>
                                    <th>Total Amount</th>
                                    <th>Issue Date</th>
                                    <th>Current Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((invoice) => (
                                    <tr key={invoice.id}>
                                        <td><span className="invoice-number">{invoice.invoiceNumber}</span></td>
                                        <td>
                                            <div className="clinic-info-cell">
                                                <strong>{invoice.clinic?.name || 'N/A'}</strong>
                                                <span className="text-xs text-muted">{invoice.clinic?.email}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-sm">{parseInvoiceDescription(invoice.description).note || invoice.description}</div>
                                            <div className="text-xs text-muted">Plan: {invoice.clinic?.subscriptionPlan || 'Monthly'}</div>
                                        </td>
                                        <td><span className="amount-display">{formatCurrency(Number(invoice.amount))}</span></td>
                                        <td>
                                            <div className="text-sm font-semibold">{formatDate(invoice.issuedDate)}</div>
                                            <div className="text-xs text-danger">Due: {formatDate(invoice.dueDate)}</div>
                                        </td>
                                        <td>
                                            <span
                                                className={`status-pill ${invoice.status.toLowerCase()} clickable-status`}
                                                title="Click to toggle status"
                                                onClick={() => handleUpdateStatus(invoice.id, invoice.status === 'Paid' ? 'Unpaid' : 'Paid')}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td className="action-btns">
                                            <button
                                                className={`action-btn-mini ${invoice.status === 'Paid' ? 'btn-mark-unpaid' : 'btn-mark-paid'}`}
                                                title={`Mark as ${invoice.status === 'Paid' ? 'Unpaid' : 'Paid'}`}
                                                onClick={() => handleUpdateStatus(invoice.id, invoice.status === 'Paid' ? 'Unpaid' : 'Paid')}
                                            >
                                                {invoice.status === 'Paid' ? <FiAlertCircle /> : <FiCheckCircle />}
                                            </button>
                                            <button
                                                className="action-btn-mini btn-view-invoice"
                                                title="Download PDF"
                                                onClick={() => handleDownloadInvoice(invoice)}
                                            >
                                                <FiDownload />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

        </div>
    );
};

export default Invoices;
