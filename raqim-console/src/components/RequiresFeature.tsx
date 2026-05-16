import React from 'react';
import { headers } from 'next/headers';
import { FeatureGateOverlay } from './FeatureGateOverlay';

interface RequiresFeatureProps {
  featureName: string;
  children: React.ReactNode;
}

export async function RequiresFeature({ featureName, children }: RequiresFeatureProps) {
  const headersList = await headers();
  const featuresHeader = headersList.get('x-raqim-features');
  
  let features: string[] = [];
  try {
    if (featuresHeader) {
      features = JSON.parse(featuresHeader);
    }
  } catch (e) {
    console.error('Failed to parse x-raqim-features header', e);
  }

  const isAuthorized = features.includes(featureName);

  if (isAuthorized) {
    return <>{children}</>;
  }

  return (
    <FeatureGateOverlay featureName={featureName}>
      {children}
    </FeatureGateOverlay>
  );
}
