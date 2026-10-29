import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import {
  HelpCircle,
  BookOpen,
  Send,
  CheckCircle2,
  MapPin,
  FileText,
  Compass,
} from 'lucide-react';

export const Support: React.FC = () => {
  const { showToast } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: 'verification',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      showToast('Please complete all required fields.', 'alert');
      return;
    }
    setSubmitted(true);
    showToast('Inquiry submitted to the PinPoint cartography desk.', 'success');
  };

  const faqs = [
    {
      q: 'Which coordinate datum and format does PinPoint use?',
      a: 'PinPoint standardizes on WGS84 (World Geodetic System 1984) decimal degrees with 6 decimal places of precision (~0.11m resolution). UTM grid coordinates and Google Plus Codes are automatically generated for every saved record.',
    },
    {
      q: 'How does place verification work?',
      a: 'Locations submitted with clear photographic evidence, precise GPS datum, and verifiable descriptions undergo manual peer verification by field contributors. Verified spots receive the green checkmark badge.',
    },
    {
      q: 'Can I export maps to Google Earth or QGIS?',
      a: 'Yes. Any map can be exported immediately as standard GeoJSON from the public map view or the workspace sidebar. GeoJSON files import natively into QGIS, ArcGIS, Mapbox, and Google Earth Pro.',
    },
    {
      q: 'What is the maximum photo resolution supported?',
      a: 'PinPoint preserves high-resolution photographs up to 25MB each. Image metadata (EXIF GPS and camera timestamp) is automatically scanned to assist in verifying coordinate authenticity.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#15171A] flex flex-col text-left transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-[#1A1D23] border-b border-[#D9D6CF] dark:border-[#2D333D] px-4 md:px-8 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-[#C84B31] dark:text-[#E26D54]" />
            <span className="text-xs font-mono uppercase tracking-widest text-[#68655F] dark:text-[#9C978D]">
              Knowledge Base & Field Support
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl text-[#171717] dark:text-[#F0EDE6] font-bold">
            Documentation & Support Desk
          </h1>
          <p className="text-sm text-[#68655F] dark:text-[#9C978D] mt-2 max-w-xl leading-relaxed">
            Guidance for field researchers, coordinate standards, place verification criteria, and direct inquiries.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 px-2.5 py-1 bg-[#EEF4F0] dark:bg-[#1C2C22] border border-[#BDD3C3] dark:border-[#2D5A38] rounded-[4px] text-xs text-[#3F6B4A] dark:text-[#72C78E] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#3F6B4A] dark:bg-[#72C78E] animate-pulse" />
            Cartographic Tile CDN & Geolocation APIs: Operational
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full p-4 md:p-8 space-y-10 flex-1">
        {/* FAQs */}
        <div>
          <h2 className="font-serif text-2xl text-[#171717] dark:text-[#F0EDE6] mb-4">
            Frequently Consulted Standards
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#1E2228] p-5 rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D]"
              >
                <h3 className="font-semibold text-sm text-[#171717] dark:text-[#F0EDE6] mb-2">
                  {faq.q}
                </h3>
                <p className="text-xs text-[#68655F] dark:text-[#9C978D] leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white dark:bg-[#1E2228] rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D] p-6">
          <div className="mb-6">
            <h2 className="font-serif text-2xl text-[#171717] dark:text-[#F0EDE6]">
              Submit Inquiry or Verification Request
            </h2>
            <p className="text-xs text-[#68655F] dark:text-[#9C978D] mt-1">
              Need assistance with an export, reported incorrect coordinates, or wish to verify a historic structure?
            </p>
          </div>

          {submitted ? (
            <div className="p-8 text-center bg-[#F7F5F0] dark:bg-[#15171A] rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D]">
              <CheckCircle2 className="w-8 h-8 text-[#3F6B4A] dark:text-[#529E68] mx-auto mb-2" />
              <h3 className="font-serif text-xl text-[#171717] dark:text-[#F0EDE6]">Inquiry Dispatched</h3>
              <p className="text-xs text-[#68655F] dark:text-[#9C978D] mt-1 max-w-sm mx-auto">
                Thank you, {formData.name}. Our cartography review team typically responds within 1 business day.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: '', email: '', topic: 'verification', message: '' });
                }}
              >
                Send Another Message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Your Name *"
                  placeholder="e.g. Marcus Vance"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Input
                  label="Email Address *"
                  type="email"
                  placeholder="name@organization.org"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#171717] dark:text-[#F0EDE6]">
                  Inquiry Nature
                </label>
                <select
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  className="h-9 px-3 text-xs bg-white dark:bg-[#1A1D23] text-[#171717] dark:text-[#F0EDE6] rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D] focus:outline-none focus:border-[#171717] dark:focus:border-[#E26D54]"
                >
                  <option value="verification">Location Verification & Review</option>
                  <option value="coordinates">Coordinate Error or Correction</option>
                  <option value="export">GIS & GeoJSON Technical Support</option>
                  <option value="billing">Subscription or Account Inquiries</option>
                </select>
              </div>

              <Textarea
                label="Message or Coordinate Notes *"
                rows={4}
                placeholder="Detail the location ID, coordinates, or questions..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  icon={<Send className="w-3.5 h-3.5" />}
                >
                  Submit Inquiry
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
