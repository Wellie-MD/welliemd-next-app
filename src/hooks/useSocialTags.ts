import { useEffect, useRef } from 'react';
import { socialTagsApi } from '@/api/socialTagsApi';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Helper function to inject HTML content into head, properly handling script tags
 * Scripts are injected directly into head to ensure they execute
 */
function injectHtmlIntoHead(html: string, containerId: string): void {
  // Check if already injected by looking for a marker
  if (document.head.querySelector(`[data-tag-container="${containerId}"]`)) {
    return;
  }

  // Create a temporary container to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Process each node from the parsed HTML and inject directly into head
  const nodes = Array.from(tempDiv.childNodes);
  nodes.forEach((node, index) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      
      // Handle script tags specially - they need to be recreated and appended directly to head
      if (element.tagName === 'SCRIPT') {
        const script = document.createElement('script');
        
        // Copy all attributes
        Array.from(element.attributes).forEach((attr) => {
          script.setAttribute(attr.name, attr.value);
        });
        
        // Copy text content or src
        if (element.textContent) {
          script.textContent = element.textContent;
        }
        
        // Add marker to identify this script
        script.setAttribute('data-tag-container', containerId);
        script.setAttribute('data-tag-index', index.toString());
        
        // Append directly to head - this ensures the script executes
        document.head.appendChild(script);
      } else if (element.tagName === 'NOSCRIPT') {
        // Handle noscript tags (common in GTM)
        const noscript = document.createElement('noscript');
        noscript.innerHTML = element.innerHTML;
        noscript.setAttribute('data-tag-container', containerId);
        noscript.setAttribute('data-tag-index', index.toString());
        document.head.appendChild(noscript);
      } else {
        // For other elements (meta, link, etc.), clone and append directly
        const cloned = element.cloneNode(true) as Element;
        cloned.setAttribute('data-tag-container', containerId);
        cloned.setAttribute('data-tag-index', index.toString());
        document.head.appendChild(cloned);
      }
    } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      // Handle text nodes (comments, etc.) - create a comment node
      const comment = document.createComment(node.textContent);
      document.head.appendChild(comment);
    }
  });
}

/**
 * Helper function to remove injected tags
 * Removes all elements with the data-tag-container attribute matching containerId
 */
function removeInjectedTag(containerId: string): void {
  const elements = document.head.querySelectorAll(`[data-tag-container="${containerId}"]`);
  elements.forEach((element) => {
    element.remove();
  });
}

/**
 * Hook to inject social platform tags (GTM, Facebook, TikTok) into the <head> section
 * Fetches tags from API and injects them as scripts on mount
 */
export function useSocialTags() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const injectedRef = useRef<{
    gtm: boolean;
    facebook: boolean;
    tiktok: boolean;
  }>({
    gtm: false,
    facebook: false,
    tiktok: false,
  });

  useEffect(() => {
    // Only try to inject tags if user is authenticated
    if (!isAuthenticated) {
      return;
    }

    let isMounted = true;

    const injectTags = async () => {
      try {
        const tags = await socialTagsApi.getCurrent();

        // Handle GTM tag - remove if empty, inject if exists
        if (tags.gtm_tag && tags.gtm_tag.trim()) {
          if (!injectedRef.current.gtm) {
            injectHtmlIntoHead(tags.gtm_tag, 'gtm-tag-container');
            injectedRef.current.gtm = true;
          }
        } else {
          // Tag is empty or doesn't exist - remove it if present
          removeInjectedTag('gtm-tag-container');
          injectedRef.current.gtm = false;
        }

        // Handle Facebook tag - remove if empty, inject if exists
        if (tags.facebook_tag && tags.facebook_tag.trim()) {
          if (!injectedRef.current.facebook) {
            injectHtmlIntoHead(tags.facebook_tag, 'facebook-tag-container');
            injectedRef.current.facebook = true;
          }
        } else {
          // Tag is empty or doesn't exist - remove it if present
          removeInjectedTag('facebook-tag-container');
          injectedRef.current.facebook = false;
        }

        // Handle TikTok tag - remove if empty, inject if exists
        if (tags.tiktok_tag && tags.tiktok_tag.trim()) {
          if (!injectedRef.current.tiktok) {
            injectHtmlIntoHead(tags.tiktok_tag, 'tiktok-tag-container');
            injectedRef.current.tiktok = true;
          }
        } else {
          // Tag is empty or doesn't exist - remove it if present
          removeInjectedTag('tiktok-tag-container');
          injectedRef.current.tiktok = false;
        }
      } catch (error) {
        // Silently fail - tags are optional
        console.warn('Failed to load social tags:', error);
      }
    };

    if (isMounted) {
      injectTags();
    }

    // Cleanup function
    return () => {
      isMounted = false;
      // Remove injected tags on unmount
      removeInjectedTag('gtm-tag-container');
      removeInjectedTag('facebook-tag-container');
      removeInjectedTag('tiktok-tag-container');
      
      injectedRef.current = { gtm: false, facebook: false, tiktok: false };
    };
  }, [isAuthenticated]); // Re-run when authentication state changes

  // Function to refresh tags (can be called after saving)
  const refreshTags = async () => {
    try {
      const tags = await socialTagsApi.getCurrent();
      
      // Remove existing containers
      removeInjectedTag('gtm-tag-container');
      removeInjectedTag('facebook-tag-container');
      removeInjectedTag('tiktok-tag-container');
      
      injectedRef.current = { gtm: false, facebook: false, tiktok: false };
      
      // Re-inject tags only if they exist and are not empty
      if (tags.gtm_tag && tags.gtm_tag.trim()) {
        injectHtmlIntoHead(tags.gtm_tag, 'gtm-tag-container');
        injectedRef.current.gtm = true;
      } else {
        injectedRef.current.gtm = false;
      }
      
      if (tags.facebook_tag && tags.facebook_tag.trim()) {
        injectHtmlIntoHead(tags.facebook_tag, 'facebook-tag-container');
        injectedRef.current.facebook = true;
      } else {
        injectedRef.current.facebook = false;
      }
      
      if (tags.tiktok_tag && tags.tiktok_tag.trim()) {
        injectHtmlIntoHead(tags.tiktok_tag, 'tiktok-tag-container');
        injectedRef.current.tiktok = true;
      } else {
        injectedRef.current.tiktok = false;
      }
    } catch (error) {
      console.warn('Failed to refresh social tags:', error);
    }
  };

  return { refreshTags };
}

