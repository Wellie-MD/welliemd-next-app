/**
 * Patient portal treatment-case isolation contract (plan phase P7.2).
 *
 * The patient portal is a post-checkout consumer. It must key treatment cards
 * on Treatment Type / case identity, keep siblings independent, and never merge
 * two cases just because they share a provider Visit Type.
 */

import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import type { PatientTreatmentAggregate as Aggregate } from '@/shared/api/ordersApi';
import { PatientTreatmentAggregate } from './PatientTreatmentAggregate';

/**
 * Branded GLP and Compounded GLP are different Treatment Types that both route
 * to the `weightloss` Visit Type — the exact case the architecture says must
 * stay separate.
 */
const brandedCase = (overrides: Partial<Aggregate> = {}): Aggregate => ({
    clinical_status: 'prescribed',
    patient_message: '',
    treatment_case_id: 'case-branded',
    treatment_type: { id: 'tt-branded', key: 'branded-glp', name: 'Branded GLP' },
    reconciliation: {
        version: 1,
        status: 'settled',
        requested_set: [{ product_id: 1, name: 'Brand GLP-1 2.5mg', quantity: 1 }],
        prescribed_set: [{ product_id: 1, name: 'Brand GLP-1 2.5mg', quantity: 1 }],
        has_unresolved_facts: false,
    },
    settlement: { status: 'settled', patient_action_required: false },
    lifecycle: { status: 'shipped' },
    siblings: [
        {
            order_id: 'order-branded',
            treatment_case_id: 'case-branded',
            treatment_type_key: 'branded-glp',
            treatment_type_name: 'Branded GLP',
            status: 'shipped',
            lifecycle_status: 'shipped',
        },
        {
            order_id: 'order-compounded',
            treatment_case_id: 'case-compounded',
            treatment_type_key: 'compounded-glp',
            treatment_type_name: 'Compounded GLP',
            status: 'cancelled',
            lifecycle_status: 'cancelled',
        },
    ],
    ...overrides,
}) as Aggregate;

const renderCase = (aggregate: Aggregate) =>
    render(
        <MemoryRouter>
            <PatientTreatmentAggregate aggregate={aggregate} />
        </MemoryRouter>,
    );

describe('P7.2 — patient portal treatment case isolation', () => {
    it('keys the card on its own Treatment Type and case, not on Visit Type', () => {
        renderCase(brandedCase());

        // The same Product appears in both the requested and prescribed sets.
        expect(screen.getAllByText('Brand GLP-1 2.5mg').length).toBeGreaterThan(0);
        // The provider route is never surfaced as the case identity.
        expect(screen.queryByText(/weightloss/i)).not.toBeInTheDocument();
    });

    it('lists each sibling case separately even when both share a Visit Type', () => {
        renderCase(brandedCase());

        const siblingSection = screen.getByText('Treatments in this checkout').parentElement!;
        expect(within(siblingSection).getByText('Branded GLP')).toBeInTheDocument();
        expect(within(siblingSection).getByText('Compounded GLP')).toBeInTheDocument();
    });

    it('lets a sibling be cancelled while this case continues independently', () => {
        renderCase(brandedCase());

        const siblingSection = screen.getByText('Treatments in this checkout').parentElement!;
        // One sibling is cancelled...
        expect(within(siblingSection).getByText(/cancelled/i)).toBeInTheDocument();
        // ...and this case keeps its own, different lifecycle status.
        expect(screen.getAllByText(/shipped/i).length).toBeGreaterThan(0);
    });

    it('links each sibling to its own Order rather than a merged one', () => {
        renderCase(brandedCase());

        const siblingSection = screen.getByText('Treatments in this checkout').parentElement!;
        const links = within(siblingSection).getAllByRole('link');
        const hrefs = links.map((link) => link.getAttribute('href'));

        expect(new Set(hrefs).size).toBe(hrefs.length);
        expect(hrefs.some((href) => href?.includes('order-branded'))).toBe(true);
        expect(hrefs.some((href) => href?.includes('order-compounded'))).toBe(true);
    });

    it('does not render a sibling list for a single-treatment checkout', () => {
        renderCase(
            brandedCase({
                siblings: [
                    {
                        order_id: 'order-branded',
                        treatment_case_id: 'case-branded',
                        treatment_type_key: 'branded-glp',
                        treatment_type_name: 'Branded GLP',
                        status: 'shipped',
                        lifecycle_status: 'shipped',
                    },
                ],
            } as Partial<Aggregate>),
        );

        expect(screen.queryByText('Treatments in this checkout')).not.toBeInTheDocument();
    });

    it('renders a partial aggregate without throwing', () => {
        // Handoff payloads for a case still awaiting settlement omit whole
        // branches. A missing branch must degrade, never crash the card.
        const partial = {
            clinical_status: 'clinical_review',
            patient_message: '',
            treatment_case_id: 'case-branded',
            treatment_type: { id: 'tt-branded', key: 'branded-glp', name: 'Branded GLP' },
            siblings: [],
        } as unknown as Aggregate;

        expect(() => renderCase(partial)).not.toThrow();
    });
});
