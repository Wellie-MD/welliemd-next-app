import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, ChevronDown, MessageSquare, Phone } from 'lucide-react';

interface FaqItemProps {
  question: string;
  answer: string;
}

function FaqItem({ question, answer }: FaqItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`km-faq-item${isOpen ? ' open' : ''}`}>
      <div className="km-faq-q" onClick={() => setIsOpen(!isOpen)}>
        {question}
        <ChevronDown size={16} />
      </div>
      <div className="km-faq-a">{answer}</div>
    </div>
  );
}

export default function Help() {
  const navigate = useNavigate();

  const faqs = [
    {
      question: "How do async visits work?",
      answer: "Async visits allow you to communicate with your provider without a scheduled real-time appointment. You submit your information and your provider responds within the agreed timeframe."
    },
    {
      question: "How long does it take to get a response?",
      answer: "Most visits are reviewed within 24–48 hours of submission. You'll be notified via message when your provider has responded."
    },
    {
      question: "How do I start a new treatment?",
      answer: "Go to Explore Treatments from the menu and click \"Get Started\" next to any available treatment."
    },
    {
      question: "How do I update my billing information?",
      answer: "Go to Billing in the menu to manage your payment methods and view your charge history."
    },
    {
      question: "Can I message my doctor directly?",
      answer: "Yes! Head to Messages and select the \"@doctor\" option when composing a message to send directly to your care provider."
    }
  ];

  return (
    <div className="pg" id="pg-help">
      <div className="km-fade" style={{ marginBottom: 18 }}>
        <p className="km-page-title">Help & Support</p>
        <p className="km-page-sub">Get help and find answers to common questions.</p>
      </div>

      <div className="km-fade" style={{ marginBottom: 20 }}>
        <button 
          className="km-btn km-btn-primary" 
          onClick={() => navigate('/dashboard/messages?prefill=' + encodeURIComponent('Hi, I need assistance with my account.'))}
          style={{ gap: 8 }}
        >
          <MessageSquare size={16} />
          Contact Support
        </button>
      </div>

      <div className="km-sc km-fade fd">
        <div className="km-sct" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="km-eic" style={{ width: 24, height: 24, background: 'var(--km-s3)' }}>
            <HelpCircle size={14} style={{ color: 'var(--km-ac)' }} />
          </div>
          Frequently Asked Questions
        </div>
        <div style={{ padding: '4px 0 8px' }}>
          {faqs.map((faq, idx) => (
            <FaqItem key={idx} {...faq} />
          ))}
        </div>
      </div>

      <div className="km-sc km-fade fd" style={{ textAlign: 'center', padding: 30 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📞</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--km-t)', marginBottom: 4 }}>Still need help?</div>
        <div style={{ fontSize: 13, color: 'var(--km-tm)', marginBottom: 18 }}>
          Our support team is available Mon–Fri, 9am–5pm EST.
        </div>
        <button 
          className="km-btn km-btn-outline" 
          onClick={() => navigate('/dashboard/messages?prefill=' + encodeURIComponent('Hi, I need assistance with my account.'))}
          style={{ margin: '0 auto' }}
        >
          Send a message
        </button>
      </div>
    </div>
  );
}
