import { useEffect, useRef } from 'react';
import { socialTagsApi } from '@/api/socialTagsApi';

/**
 * Helper function to inject HTML content into head, properly handling script tags
 */
function injectHtmlIntoHead(html: string, containerId: string): void {
  // Check if already injected
  if (document.getElementById(containerId)) {
    return;
  }

  // Create a temporary container to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Create a container in head to hold the injected content
  const container = document.createElement('div');
  container.id = containerId;
  container.style.display = 'none'; // Hide the container

  // Process each node from the parsed HTML
  const nodes = Array.from(tempDiv.childNodes);
  nodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      
      // Handle script tags specially - they need to be recreated to execute
      if (element.tagName === 'SCRIPT') {
        const script = document.createElement('script');
        
        // Copy all attributes
        Array.from(element.attributes).forEach((attr) => {
          script.setAttribute(attr.name, attr.value);
        });
        
        // Copy text content
        script.textContent = element.textContent;
        
        container.appendChild(script);
      } else {
        // For other elements, clone them
        container.appendChild(element.cloneNode(true));
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      // Handle text nodes
      container.appendChild(node.cloneNode(true));
    }
  });

  document.head.appendChild(container);
}

/**
 * Helper function to remove injected tags
 */
function removeInjectedTag(containerId: string): void {
  const container = document.getElementById(containerId);
  if (container) {
    container.remove();
  }
}

/**
 * Hook to inject social platform tags (GTM, Facebook, TikTok) into the <head> section
 * Fetches tags from API and injects them as scripts on mount
 */
export function useSocialTags() {
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
  }, []);

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

