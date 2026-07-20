import { AlertCircle, CheckCircle2, Clock3, Stethoscope } from 'lucide-react';

import type { PatientTreatmentAggregate as Aggregate, TreatmentAggregateProduct } from '@/shared/api/ordersApi';
import { CLINICAL_STATUS_CLASSES, CLINICAL_STATUS_LABELS, SETTLEMENT_STATUS_LABELS } from './constants';

const readable = (value: string) => value.split('_').join(' ');
const productName = (product: TreatmentAggregateProduct) =>
    product.name || product.med_id || `Product ${product.product_id || ''}`.trim();

function ProductSet({ label, products, empty }: { label: string; products: TreatmentAggregateProduct[]; empty: string }) {
    return <div>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--km-tm)', marginBottom: 7 }}>{label}</div>
        {products.length ? products.map((product, index) => <div
            key={String(product.product_id || product.source_product_id || product.med_id || index)}
            style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '8px 0', borderTop: index ? '1px solid var(--km-b)' : undefined }}
        >
            <span style={{ fontSize: 13, fontWeight: 700 }}>{productName(product)}</span>
            <span style={{ flexShrink: 0, fontSize: 11, color: 'var(--km-tm)' }}>Qty {product.quantity || 1}</span>
        </div>) : <div style={{ fontSize: 12, color: 'var(--km-tm)', padding: '5px 0 10px' }}>{empty}</div>}
    </div>;
}

export function PatientTreatmentAggregate({ aggregate, compact = false }: { aggregate: Aggregate; compact?: boolean }) {
    const review = aggregate.clinical_status === 'clinical_review';
    const settled = aggregate.clinical_status === 'prescription_settled';
    const Icon = review ? AlertCircle : settled ? CheckCircle2 : Clock3;
    const label = CLINICAL_STATUS_LABELS[aggregate.clinical_status] || readable(aggregate.clinical_status);
    const badgeClass = CLINICAL_STATUS_CLASSES[aggregate.clinical_status] || CLINICAL_STATUS_CLASSES.awaiting_prescription;

    if (compact) {
        return <div style={{ padding: '0 14px 12px', display: 'flex', alignItems: 'center', gap: 7, color: 'var(--km-tm)', fontSize: 11 }}>
            <Icon size={13} /><span className={badgeClass}>{label}</span>
            <span>{aggregate.reconciliation.prescribed_set.length || aggregate.reconciliation.requested_set.length} products</span>
        </div>;
    }

    return <section className="km-fade" style={{ background: 'var(--km-s1)', borderRadius: 10, border: '1px solid var(--km-b)', marginBottom: 10, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, padding: 14, background: 'var(--km-s2)', borderBottom: '1px solid var(--km-b)' }}>
            <div><div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700 }}><Stethoscope size={15} style={{ color: 'var(--km-ac)' }} />{aggregate.treatment_type.name || aggregate.treatment_type.key}</div>
                <div style={{ marginTop: 3, fontSize: 10, color: 'var(--km-tm)' }}>Prescription version {aggregate.reconciliation.version || '—'}</div>
            </div>
            <span className={badgeClass}>{label}</span>
        </div>
        {review && <div style={{ padding: '10px 14px', background: 'var(--km-amp)', color: 'var(--km-am)', fontSize: 12, borderBottom: '1px solid var(--km-b)' }}>
            {aggregate.patient_message || 'Your care team is reviewing this prescription. No action is required from you.'}
        </div>}
        <div style={{ display: 'grid', gap: 14, padding: 14 }}>
            <ProductSet label="Requested products" products={aggregate.reconciliation.requested_set || []} empty="No requested Product snapshot is available." />
            <ProductSet label="Current prescribed products" products={aggregate.reconciliation.prescribed_set || []} empty="Awaiting your clinician’s prescription." />
        </div>
        <div style={{ padding: '9px 14px', background: 'var(--km-s2)', borderTop: '1px solid var(--km-b)', fontSize: 11, color: 'var(--km-tm)' }}>
            Payment and settlement: {SETTLEMENT_STATUS_LABELS[aggregate.settlement.status] || readable(aggregate.settlement.status)}
        </div>
    </section>;
}
