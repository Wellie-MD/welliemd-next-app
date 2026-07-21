import { AlertCircle, CheckCircle2, Clock3, FlaskConical, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { PatientTreatmentAggregate as Aggregate, TreatmentAggregateProduct } from '@/shared/api/ordersApi';
import { CLINICAL_STATUS_CLASSES, CLINICAL_STATUS_LABELS, LAB_GATE_STATUS_LABELS, PROVIDER_REVIEW_STATUS_LABELS, RECOLLECTION_ACTION_LABELS, SETTLEMENT_STATUS_LABELS, TREATMENT_LIFECYCLE_LABELS } from './constants';
import { TREATMENT_ORDER_PORTAL_PATH } from './orderActionConstants';

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
    const review = ['clinical_review', 'clinical_review_required'].includes(aggregate.clinical_status);
    const settled = aggregate.clinical_status === 'prescription_settled';
    const differences = aggregate.reconciliation.factual_differences;
    const revised = Boolean(
        (aggregate.reconciliation.version || 0) > 1
        || differences?.prescribed_addition_product_ids?.length
        || differences?.requested_absence_product_ids?.length
    );
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
        {aggregate.settlement.patient_action_required && <div style={{ padding: '10px 14px', background: 'var(--km-amp)', color: 'var(--km-am)', fontSize: 12, borderBottom: '1px solid var(--km-b)' }}>
            Your payment authorization needs attention before this treatment can continue.{' '}
            <Link to={TREATMENT_ORDER_PORTAL_PATH.billing}>Review payment methods</Link>
        </div>}
        {revised && <div style={{ padding: '10px 14px', background: 'var(--km-acp)', color: 'var(--km-ac)', fontSize: 12, borderBottom: '1px solid var(--km-b)' }}>
            Your clinician revised this prescription. The current prescribed products below are authoritative.
        </div>}
        {aggregate.settlement.refund_pending && <div style={{ padding: '10px 14px', background: 'var(--km-amp)', color: 'var(--km-am)', fontSize: 12, borderBottom: '1px solid var(--km-b)' }}>
            A {aggregate.settlement.refund_required_amount} refund adjustment is pending review. You do not need to pay again.
        </div>}
        <div style={{ display: 'grid', gap: 14, padding: 14 }}>
            <ProductSet label="Requested products" products={aggregate.reconciliation.requested_set || []} empty="No requested Product snapshot is available." />
            <ProductSet label="Current prescribed products" products={aggregate.reconciliation.prescribed_set || []} empty="Awaiting your clinician’s prescription." />
        </div>
        {aggregate.lab_gate.required && <div style={{ padding: 14, borderTop: '1px solid var(--km-b)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--km-tm)' }}>
                <FlaskConical size={13} /> Required labs
            </div>
            {aggregate.lab_gate.items.map((lab) => <div key={lab.lab_order_id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '8px 0', borderTop: '1px solid var(--km-b)' }}>
                <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{lab.panel_name || lab.display_id || 'Lab panel'}</div>
                    {lab.recollection?.patient_action && <div style={{ marginTop: 3, fontSize: 11, color: 'var(--km-am)' }}>
                        {RECOLLECTION_ACTION_LABELS[lab.recollection.patient_action] || readable(lab.recollection.patient_action)}
                        {lab.recollection.patient_action === 'view_collection_instructions' && <> <Link to={TREATMENT_ORDER_PORTAL_PATH.labs}>Open Labs</Link></>}
                    </div>}
                </div>
                <span style={{ fontSize: 11, color: lab.recollection_required ? 'var(--km-am)' : 'var(--km-tm)' }}>
                  {lab.partial_results ? `${lab.result_count} partial result${lab.result_count === 1 ? '' : 's'} received` : LAB_GATE_STATUS_LABELS[lab.status] || readable(lab.status)}
                </span>
            </div>)}
            {aggregate.lab_gate.has_partial_results && <div style={{ marginTop: 8, fontSize: 11, color: 'var(--km-tm)' }}>
                Your available results are being tracked. Provider review begins after every required lab is complete.
            </div>}
            <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700 }}>
                {PROVIDER_REVIEW_STATUS_LABELS[aggregate.lab_gate.provider_review_state] || readable(aggregate.lab_gate.provider_review_state)}
            </div>
        </div>}
        {aggregate.siblings.length > 1 && <div style={{ padding: 14, borderTop: '1px solid var(--km-b)' }}>
            <div style={{ marginBottom: 8, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--km-tm)' }}>
                Treatments in this checkout
            </div>
            {aggregate.siblings.map((sibling) => <Link
                key={sibling.treatment_case_id}
                to={TREATMENT_ORDER_PORTAL_PATH.order(sibling.order_id)}
                style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '8px 0', borderTop: '1px solid var(--km-b)', color: 'inherit', textDecoration: 'none' }}
            >
                <span style={{ fontSize: 12, fontWeight: 700 }}>{sibling.treatment_type_name || readable(sibling.treatment_type_key)}</span>
                <span style={{ fontSize: 11, color: 'var(--km-tm)' }}>
                    {TREATMENT_LIFECYCLE_LABELS[sibling.lifecycle_status] || readable(sibling.lifecycle_status || sibling.status)}
                </span>
            </Link>)}
        </div>}
        {aggregate.lifecycle.support_recovery_required && <div style={{ padding: '10px 14px', borderTop: '1px solid var(--km-b)', fontSize: 11, color: 'var(--km-tm)' }}>
            Support is reviewing this treatment. <Link to={TREATMENT_ORDER_PORTAL_PATH.messages}>Contact support</Link>
        </div>}
        <div style={{ padding: '9px 14px', background: 'var(--km-s2)', borderTop: '1px solid var(--km-b)', fontSize: 11, color: 'var(--km-tm)' }}>
            {TREATMENT_LIFECYCLE_LABELS[aggregate.lifecycle.status] || readable(aggregate.lifecycle.status)}
            {' · '}Payment and settlement: {SETTLEMENT_STATUS_LABELS[aggregate.settlement.status] || readable(aggregate.settlement.status)}
        </div>
    </section>;
}
