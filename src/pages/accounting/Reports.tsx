import { useState, useMemo } from 'react';
import { FiDownload, FiFilter, FiCalendar, FiSearch, FiInfo } from 'react-icons/fi';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import './Reports.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addClinicHeader } from '../../utils/pdfUtils';

const AccountingReports = () => {
    const { invoices, patients } = useApp() as any;
    const { selectedClinic } = useAuth() as any;
    const { formatMoney, symbol } = useCurrency();
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const filteredInvoices = useMemo(() => {
        const clinicInvoices = (invoices as any[]).filter((inv: any) => inv.clinicId === selectedClinic?.id);

        return clinicInvoices.filter((inv: any) => {
            const matchesStatus = filterStatus === 'All' || inv.status === filterStatus;
            const patient = (patients || []).find((p: any) => p.id === Number(inv.patientId));
            const patientName = patient?.name?.toLowerCase() || 'unknown';
            const invoiceId = inv.id?.toLowerCase() || '';
            const serviceDesc = (inv.items || []).map((i: any) => i.description || '').join(' ').toLowerCase();

            const matchesSearch = patientName.includes(searchTerm.toLowerCase()) ||
                invoiceId.includes(searchTerm.toLowerCase()) ||
                serviceDesc.includes(searchTerm.toLowerCase());

            let matchesDate = true;
            if (dateRange.start) {
                matchesDate = matchesDate && new Date(inv.date || inv.createdAt) >= new Date(dateRange.start);
            }
            if (dateRange.end) {
                const end = new Date(dateRange.end);
                end.setHours(23, 59, 59, 999);
                matchesDate = matchesDate && new Date(inv.date || inv.createdAt) <= end;
            }

            return matchesStatus && matchesSearch && matchesDate;
        });
    }, [invoices, filterStatus, searchTerm, dateRange, patients, selectedClinic?.id]);

    const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount || inv.amount), 0);

    const exportToPDF = async () => {
        try {
            const doc = new jsPDF();
            await addClinicHeader(doc, selectedClinic, 'DETAILED FINANCIAL REPORT');

            const tableColumn = ["Date", "Invoice #", "Patient", "Status", "Amount"];
            const tableRows: any[] = [];

            filteredInvoices.forEach((inv: any) => {
                const patient = (patients || []).find((p: any) => p.id === Number(inv.patientId));
                const invoiceData = [
                    inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '-',
                    inv.id,
                    patient?.name || 'Unknown',
                    inv.status.toUpperCase(),
                    `${symbol} ${Number(inv.totalAmount || inv.amount).toFixed(2)}`
                ];
                tableRows.push(invoiceData);
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 50,
                theme: 'grid',
                styles: { fontSize: 8.5, cellPadding: 3.5 },
                headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                columnStyles: {
                    4: { halign: 'right', fontStyle: 'bold' }
                }
            });

            const finalY = (doc as any).lastAutoTable.finalY + 15;
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text(`Total Aggregated Revenue: ${symbol} ${totalRevenue.toFixed(2)}`, doc.internal.pageSize.width - 15, finalY, { align: 'right' });

            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(7.5);
                doc.setTextColor(150);
                doc.text(`Financial Audit Report | Generated on ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
            }

            doc.save(`Financial_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF. Please try again.");
        }
    };

    return (
        <div className="reports-page-container">
            <div className="reports-header">
                <div>
                    <h1>Financial Reporting</h1>
                    <p>Audit and analyze all clinical transactions and invoices.</p>
                </div>
                <button className="btn-download-pdf" onClick={exportToPDF}>
                    <FiDownload />
                    <span>Download Audit Report</span>
                </button>
            </div>

            <div className="filter-section card">
                <div className="filter-grid">
                    <div className="filter-group">
                        <label><FiSearch /> Comprehensive Search</label>
                        <input
                            type="text"
                            placeholder="Invoice #, Patient, Item..."
                            className="filter-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="filter-group">
                        <label><FiFilter /> Status</label>
                        <select
                            className="filter-input"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="All">All Transactions</option>
                            <option value="Paid">Cleared / Paid</option>
                            <option value="Pending">Outstanding / Pending</option>
                            <option value="Cancelled">Voided / Cancelled</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label><FiCalendar /> Start Date</label>
                        <input
                            type="date"
                            className="filter-input"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        />
                    </div>
                    <div className="filter-group">
                        <label><FiCalendar /> End Date</label>
                        <input
                            type="date"
                            className="filter-input"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <div className="reports-table-card card">
                <div className="table-responsive">
                    <table className="reports-table">
                        <thead>
                            <tr>
                                <th>Billing Date</th>
                                <th>Invoice #</th>
                                <th>Patient Name</th>
                                <th>Charge Items</th>
                                <th>Total Value</th>
                                <th>Cleared Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.length > 0 ? filteredInvoices.map((inv: any) => {
                                const patient = patients.find((p: any) => p.id === Number(inv.patientId));
                                return (
                                    <tr key={inv.id}>
                                        <td style={{ color: '#64748b', fontSize: '0.8125rem' }}>
                                            {new Date(inv.createdAt || inv.date).toLocaleDateString()}
                                        </td>
                                        <td><strong>{inv.id}</strong></td>
                                        <td style={{ fontWeight: 600 }}>{patient?.name || 'Unknown Patient'}</td>
                                        <td style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                                            {inv.items?.length || 0} items
                                        </td>
                                        <td style={{ fontWeight: 800, color: '#1e293b' }}>{formatMoney(inv.totalAmount || inv.amount)}</td>
                                        <td>
                                            <span className={`status-pill ${inv.status.toLowerCase()}`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                            <FiInfo size={32} />
                                            No financial records match your current refined filters.
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {filteredInvoices.length > 0 && (
                    <div className="total-footer">
                        <div className="total-box">
                            <span className="total-label">Aggregated Total:</span>
                            <span className="total-amount">{formatMoney(totalRevenue)}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountingReports;
