import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { ArrowLeft, FileText, DollarSign, Calendar, User, Building2, Mail, Printer, Download } from 'lucide-react';

const STATUS_MAP = {
  draft: { label: 'Draft', className: 'clay-badge-info' },
  sent: { label: 'Sent', className: 'clay-badge-warning' },
  paid: { label: 'Paid', className: 'clay-badge-success' },
  overdue: { label: 'Overdue', className: 'clay-badge-danger' },
  cancelled: { label: 'Cancelled', className: 'clay-badge-danger' },
};

function formatCurrency(n) {
  const num = Number(n);
  if (isNaN(num)) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(num);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getInvoice(id);
        if (!cancelled) {
          setInvoice(data.invoice || data);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    if (!invoice) return;
    setStatusUpdating(true);
    try {
      const updated = await api.updateInvoice(invoice.id, { status: newStatus });
      setInvoice(updated.invoice || updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div>
        <div className="clay-skeleton" style={{ width: '100px', height: '36px', borderRadius: 'var(--radius-sm)', marginBottom: '24px' }} />
        <div className="clay-card" style={{ padding: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
            <div>
              <div className="clay-skeleton" style={{ width: '200px', height: '28px', marginBottom: '12px' }} />
              <div className="clay-skeleton" style={{ width: '120px', height: '22px', borderRadius: 'var(--radius-full)' }} />
            </div>
            <div>
              <div className="clay-skeleton" style={{ width: '160px', height: '14px', marginBottom: '8px' }} />
              <div className="clay-skeleton" style={{ width: '160px', height: '14px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '60px', marginBottom: '32px', flexWrap: 'wrap' }}>
            <div>
              <div className="clay-skeleton" style={{ width: '80px', height: '12px', marginBottom: '8px' }} />
              <div className="clay-skeleton" style={{ width: '140px', height: '14px', marginBottom: '4px' }} />
              <div className="clay-skeleton" style={{ width: '120px', height: '14px' }} />
            </div>
          </div>
          <div className="clay-skeleton" style={{ width: '100%', height: '1px', marginBottom: '24px' }} />
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div className="clay-skeleton" style={{ width: '200px', height: '14px' }} />
              <div className="clay-skeleton" style={{ width: '60px', height: '14px' }} />
              <div className="clay-skeleton" style={{ width: '80px', height: '14px' }} />
              <div className="clay-skeleton" style={{ width: '80px', height: '14px' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <button className="clay-btn clay-btn-ghost" onClick={() => navigate('/invoices')} style={{ marginBottom: '24px' }}>
          <ArrowLeft size={18} /> Back to Invoices
        </button>
        <div className="clay-empty-state" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--clay-shadow)', border: '1px solid rgba(255,255,255,0.6)' }}>
          <FileText size={48} style={{ opacity: 0.4, color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3>Error loading invoice</h3>
          <p style={{ marginBottom: '20px', color: 'var(--danger)' }}>{error}</p>
          <button className="clay-btn" onClick={() => navigate('/invoices')}>Go Back</button>
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  const status = STATUS_MAP[invoice.status] || STATUS_MAP.draft;
  const items = invoice.items || [];
  const subtotal = Number(invoice.subtotal) || items.reduce((s, i) => s + (Number(i.total) || 0), 0);
  const taxRate = Number(invoice.tax_rate) || 0;
  const taxAmount = subtotal * taxRate / 100;
  const discount = Number(invoice.discount) || 0;
  const grandTotal = Number(invoice.total) || Math.max(0, subtotal + taxAmount - discount);

  const statusActions = [];
  if (invoice.status === 'draft') {
    statusActions.push({ label: 'Mark as Sent', status: 'sent', className: 'clay-btn-warning' });
    statusActions.push({ label: 'Mark as Cancelled', status: 'cancelled', className: 'clay-btn-danger' });
  }
  if (invoice.status === 'sent' || invoice.status === 'overdue') {
    statusActions.push({ label: 'Mark as Paid', status: 'paid', className: 'clay-btn-success' });
    statusActions.push({ label: 'Mark as Cancelled', status: 'cancelled', className: 'clay-btn-danger' });
  }

  return (
    <div className="invoice-detail-print">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }} className="no-print">
        <button className="clay-btn clay-btn-ghost" onClick={() => navigate('/invoices')}>
          <ArrowLeft size={18} /> Back to Invoices
        </button>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="clay-btn" onClick={handlePrint}>
            <Printer size={16} /> Print
          </button>
          <button className="clay-btn" title="Download PDF">
            <Download size={16} /> Download
          </button>
        </div>
      </div>

      <div className="clay-card clay-responsive-padding" style={{ maxWidth: '860px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '36px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: 'var(--radius)',
                background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '4px 4px 12px rgba(99,102,241,0.3), -4px -4px 12px rgba(255,255,255,0.5)',
              }}>
                <FileText size={24} color="white" />
              </div>
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: 800 }}>
                  {invoice.invoice_number || `Invoice #${invoice.id}`}
                </h1>
                <span className={`clay-badge ${status.className}`} style={{ marginTop: '4px' }}>
                  {status.label}
                </span>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', justifyContent: 'flex-end', fontSize: '14px', color: 'var(--text-muted)' }}>
              <Calendar size={14} />
              <span>Issued: {formatDate(invoice.issue_date)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', fontSize: '14px', color: 'var(--text-muted)' }}>
              <Calendar size={14} />
              <span>Due: {formatDate(invoice.due_date)}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '60px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '10px' }}>Bill To</h3>
            <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '2px' }}>
              {invoice.contact_name ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={16} style={{ color: 'var(--text-muted)' }} />
                  {invoice.contact_name}
                </div>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>No contact</span>
              )}
            </div>
            {invoice.company_name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                <Building2 size={14} style={{ color: 'var(--text-muted)' }} />
                {invoice.company_name}
              </div>
            )}
            {invoice.contact_email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--accent)', marginTop: '6px' }}>
                <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                {invoice.contact_email}
              </div>
            )}
          </div>
        </div>

        <div className="clay-divider" />

        <table className="clay-table" style={{ marginBottom: '4px' }}>
          <thead>
            <tr>
              <th style={{ paddingLeft: '4px' }}>Description</th>
              <th style={{ textAlign: 'right' }}>Qty</th>
              <th style={{ textAlign: 'right' }}>Unit Price</th>
              <th style={{ textAlign: 'right', paddingRight: '4px' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? items.map((item, idx) => (
              <tr key={item.id || idx}>
                <td style={{ paddingLeft: '4px', fontWeight: 500 }}>{item.description || '(No description)'}</td>
                <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(item.unit_price)}</td>
                <td style={{ textAlign: 'right', fontWeight: 600, paddingRight: '4px' }}>{formatCurrency(item.total)}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                  No line items
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="clay-divider" />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <div style={{ maxWidth: '280px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
              <span>Subtotal</span>
              <span style={{ fontWeight: 500 }}>{formatCurrency(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
              <span>Tax ({taxRate}%)</span>
              <span style={{ fontWeight: 500 }}>{formatCurrency(taxAmount)}</span>
            </div>
            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <span>Discount</span>
                <span style={{ fontWeight: 500, color: 'var(--danger)' }}>-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="clay-divider" style={{ margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '18px', fontWeight: 800 }}>
              <span>Total</span>
              <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <>
            <div className="clay-divider" />
            <div style={{ marginTop: '16px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>Notes</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {invoice.notes}
              </p>
            </div>
          </>
        )}

        {statusActions.length > 0 && (
          <>
            <div className="clay-divider" />
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }} className="no-print">
              {statusActions.map(action => (
                <button
                  key={action.status}
                  className={`clay-btn ${action.className}`}
                  onClick={() => handleStatusChange(action.status)}
                  disabled={statusUpdating}
                >
                  {statusUpdating ? 'Updating...' : action.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .invoice-detail-print, .invoice-detail-print * { visibility: visible; }
          .invoice-detail-print { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .clay-card { box-shadow: none !important; border: 1px solid #ddd !important; }
        }
      `}</style>
    </div>
  );
}
