import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { PatientTreatmentAggregate as Aggregate } from '@/shared/api/ordersApi';
import { PatientTreatmentAggregate } from './PatientTreatmentAggregate';

const aggregate: Aggregate = {
    clinical_status: 'clinical_review',
    patient_message: 'Your care team is reviewing this prescription. No action is required from you.',
    treatment_case_id: 'case-1',
    treatment_type: { id: 'type-1', key: 'weight', name: 'Weight Care' },
    reconciliation: {
        version: 2,
        status: 'review_required',
        requested_set: [{ product_id: 1, name: 'Requested A', quantity: 1 }],
        prescribed_set: [{ product_id: 2, name: 'Prescribed B', quantity: 2 }],
        has_unresolved_facts: true,
    },
    settlement: { status: 'manual_action', patient_action_required: false },
    siblings: [],
};

describe('PatientTreatmentAggregate', () => {
    it('shows one patient-safe clinical status and factual Product sets without acceptance actions', () => {
        render(<PatientTreatmentAggregate aggregate={aggregate} />);

        expect(screen.getByText('Clinical review')).toBeInTheDocument();
        expect(screen.getByText('Requested A')).toBeInTheDocument();
        expect(screen.getByText('Prescribed B')).toBeInTheDocument();
        expect(screen.getByText(/No action is required from you/i)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /accept|reject/i })).not.toBeInTheDocument();
        expect(screen.queryByText(/replaced by/i)).not.toBeInTheDocument();
    });
});
