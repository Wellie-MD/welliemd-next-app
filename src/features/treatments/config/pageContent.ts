/**
 * Explore Treatments page content configuration.
 *
 * Centralized page content so no UI component hardcodes text inline.
 * ponytail: plain constant, not an async fetch - there's no content API yet.
 * Swap for a real fetch (and reintroduce loading state in the caller) when one exists.
 */

export interface ExplorePageContent {
  title: string;
  subtitle: string;
  howItWorks: {
    title: string;
    description: string;
  };
  browseLabel: string;
  emptyState: {
    title: string;
    description: string;
  };
}

export const EXPLORE_PAGE_CONTENT: ExplorePageContent = {
  title: 'Explore Treatments',
  subtitle: 'Browse available options and get started',
  howItWorks: {
    title: 'How it works',
    description:
      'Select a treatment, complete a short intake questionnaire, and a licensed provider will review your case. Visit type may vary based on your state.',
  },
  browseLabel: 'Browse by category',
  emptyState: {
    title: 'No treatments available',
    description:
      'This can happen if your profile is missing information a treatment depends on (like age, biological sex, or a recent weight/BMI reading). Complete your profile or contact your provider for more information.',
  },
};
