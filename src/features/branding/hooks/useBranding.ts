import { useContext } from 'react';
import { BrandContext } from '../../../contexts/BrandingContext';

/**
 * Custom hook to access brand colors and branding state
 * 
 * @returns {Object} Brand context containing:
 *   - colors: Current brand color palette
 *   - isLoading: Whether brand settings are being fetched
 *   - error: Error message if fetching failed
 * 
 * @example
 * const { colors, isLoading } = useBranding();
 * if (!isLoading) {
 *   console.log('Primary color:', colors.primaryColor);
 * }
 */
export const useBranding = () => {
  const context = useContext(BrandContext);
  
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandProvider');
  }
  
  return context;
};