import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Check, HelpCircle } from 'lucide-react';

export const Pricing: React.FC = () => {
  const { navigateTo, isAuthenticated } = useApp();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  const plans = [
    {
      id: 'free',
      name: 'Field Contributor',
      price: '$0',
      period: 'forever',
      description: 'Core cartographic tools for individual spatial researchers, local explorers, and photographers.',
      features: [
        'Unlimited public maps',
        'Up to 150 pinned locations',
        'Standard GPS coordinates (WGS84)',
        'Full Leaflet & OpenStreetMap access',
        'Photo attachments (up to 5 per place)',
        'GeoJSON export',
        'Community verification access',
      ],
      cta: isAuthenticated ? 'Current Tier' : 'Get Started Free',
      variant: 'secondary' as const,
      highlight: false,
    },
    {
      id: 'explorer',
      name: 'Surveyor Pro',
      price: billingCycle === 'annual' ? '$8' : '$10',
      period: 'per month',
      description: 'For field researchers, architects, and dedicated curators requiring private archives and high-precision data.',
      features: [
        'Unlimited private & public maps',
        'Unlimited location pins',
        'UTM, Plus Codes & Elevation data',
        'Full resolution uncompressed photo archival',
        'Batch GeoJSON & KML exports',
        'Field notes & technical tags',
        'Custom coordinate formats',
        'Offline tile cache support',
      ],
      cta: 'Subscribe to Surveyor Pro',
      variant: 'primary' as const,
      highlight: true,
    },
    {
      id: 'organization',
      name: 'Research Studio',
      price: billingCycle === 'annual' ? '$24' : '$29',
      period: 'per seat / month',
      description: 'Collaborative spatial archives for studios, academic teams, and historic preservation societies.',
      features: [
        'Everything in Surveyor Pro',
        'Multi-contributor shared workspaces',
        'Role-based location verification',
        'Dedicated organizational domain',
        'High-bandwidth map tile CDN',
        'Spatial API access (read/write)',
        'Priority technical assistance',
      ],
      cta: 'Contact for Studio Access',
      variant: 'secondary' as const,
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#15171A] flex flex-col text-left transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-[#1A1D23] border-b border-[#D9D6CF] dark:border-[#2D333D] px-4 md:px-8 py-12 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="text-xs font-mono uppercase tracking-widest text-[#68655F] dark:text-[#9C978D]">
            Transparent Subscriptions
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#171717] dark:text-[#F0EDE6] font-bold mt-2">
            Restrained pricing for serious spatial documentation.
          </h1>
          <p className="text-sm text-[#68655F] dark:text-[#9C978D] mt-3 max-w-xl mx-auto leading-relaxed">
            No synthetic tier locks. Our free tier is genuinely functional for individuals, and paid plans fund independent cartographic software development.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="mt-8 inline-flex items-center p-1 bg-[#F7F5F0] dark:bg-[#242930] border border-[#D9D6CF] dark:border-[#2D333D] rounded-[6px]">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1.5 text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-[#1A1D23] text-[#171717] dark:text-[#F0EDE6] shadow-xs'
                  : 'text-[#68655F] dark:text-[#9C978D]'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-3 py-1.5 text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
                billingCycle === 'annual'
                  ? 'bg-white dark:bg-[#1A1D23] text-[#171717] dark:text-[#F0EDE6] shadow-xs'
                  : 'text-[#68655F] dark:text-[#9C978D]'
              }`}
            >
              Annual Billing <span className="text-[#3F6B4A] dark:text-[#529E68] font-semibold">(20% off)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto w-full p-4 md:p-8 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white dark:bg-[#1E2228] rounded-[6px] border p-6 flex flex-col justify-between ${
                plan.highlight
                  ? 'border-[#C84B31] dark:border-[#E26D54] ring-1 ring-[#C84B31] dark:ring-[#E26D54]'
                  : 'border-[#D9D6CF] dark:border-[#2D333D]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-base text-[#171717] dark:text-[#F0EDE6]">{plan.name}</h3>
                  {plan.highlight && (
                    <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-[#FAF0ED] dark:bg-[#341B18] text-[#C84B31] dark:text-[#E26D54] rounded-[3px] border border-[#E8BFB5] dark:border-[#52251F]">
                      Recommended
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1 my-4">
                  <span className="font-serif text-4xl text-[#171717] dark:text-[#F0EDE6] font-bold">
                    {plan.price}
                  </span>
                  <span className="text-xs text-[#68655F] dark:text-[#9C978D] font-mono">/ {plan.period}</span>
                </div>

                <p className="text-xs text-[#68655F] dark:text-[#9C978D] leading-relaxed mb-6">
                  {plan.description}
                </p>

                <div className="pt-4 border-t border-[#D9D6CF] dark:border-[#2D333D] space-y-2.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#68655F] dark:text-[#9C978D] block mb-2">
                    Included Capabilities
                  </span>
                  {plan.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-2 text-xs text-[#171717] dark:text-[#F0EDE6]">
                      <Check className="w-3.5 h-3.5 text-[#3F6B4A] dark:text-[#529E68] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4">
                <Button
                  variant={plan.variant}
                  size="md"
                  className="w-full justify-center"
                  onClick={() => navigateTo(isAuthenticated ? 'map-workspace' : 'sign-up')}
                >
                  {plan.cta}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ note */}
        <div className="mt-12 bg-white dark:bg-[#1E2228] rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D] p-6 max-w-2xl mx-auto">
          <h4 className="font-semibold text-sm text-[#171717] dark:text-[#F0EDE6] mb-2 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#68655F] dark:text-[#9C978D]" />
            Data Ownership & Portability Guarantee
          </h4>
          <p className="text-xs text-[#68655F] dark:text-[#9C978D] leading-relaxed">
            All your geographic coordinates, notes, and uploaded photographs remain entirely your property. You can export your data anytime in standard GeoJSON, KML, or structured CSV formats without lock-in.
          </p>
        </div>
      </div>
    </div>
  );
};
