import { ClipboardCheck, FileText, SearchCheck, ShieldCheck } from 'lucide-react';

import { AvailableTreatmentsList } from '@/features/treatments';
import { EXPLORE_PAGE_CONTENT as content } from '@/features/treatments/config/pageContent';
import '@/features/treatments/exploreTreatments.css';

const stepIcons = [SearchCheck, FileText, ClipboardCheck] as const;

export default function ExploreTreatments() {
  return (
    <section id="pg-explore" className="explore-page" aria-labelledby="explore-page-title">
      <header className="explore-page__header km-fade">
        <div>
          <h1 id="explore-page-title" className="explore-page__title">
            {content.title}
          </h1>
          <p className="explore-page__subtitle">{content.subtitle}</p>
        </div>
        <div className="explore-page__trust-note">
          <ShieldCheck aria-hidden="true" size={16} />
          <span>Availability based on your profile</span>
        </div>
      </header>

      <section className="explore-guide km-fade" aria-labelledby="explore-guide-title">
        <div className="explore-guide__copy">
          <div className="explore-guide__icon" aria-hidden="true">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 id="explore-guide-title">{content.howItWorks.title}</h2>
            <p>{content.howItWorks.description}</p>
          </div>
        </div>

        <ol className="explore-guide__steps" aria-label="Treatment request steps">
          {content.howItWorks.steps.map((step, index) => {
            const StepIcon = stepIcons[index] ?? ClipboardCheck;
            return (
              <li
                key={step}
                className={index === 0 ? 'is-current' : undefined}
                aria-current={index === 0 ? 'step' : undefined}
              >
                <span className="explore-guide__step-number" aria-hidden="true">
                  <StepIcon size={14} />
                </span>
                <span>{step}</span>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="km-fade">
        <AvailableTreatmentsList
          browseLabel={content.browseLabel}
          searchLabel={content.searchLabel}
          searchPlaceholder={content.searchPlaceholder}
          emptyStateTitle={content.emptyState.title}
          emptyStateDescription={content.emptyState.description}
        />
      </div>
    </section>
  );
}
