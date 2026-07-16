import React from 'react';
import { AlertCircle, Search, Smartphone, X } from 'lucide-react';
import ProviderIcon from './ProviderIcon';
import LogWeightModal from './LogWeightModal';
import { CATS } from '../constants';
import type { Provider, WeightData } from '../types';

interface DeviceModalsProps {
  pickerOpen: boolean;
  setPickerOpen: (open: boolean) => void;
  pickerCat: string;
  setPickerCat: (category: string) => void;
  pickerQuery: string;
  setPickerQuery: (query: string) => void;
  allowedProviders: Provider[];
  onConnect: (providerId: string) => void;
  goalModalOpen: boolean;
  setGoalModalOpen: (open: boolean) => void;
  goalInput: string;
  setGoalInput: (value: string) => void;
  weight: WeightData;
  onSaveGoal: () => void;
  logWeightOpen: boolean;
  setLogWeightOpen: (open: boolean) => void;
  onSaveLogWeight: (value: number) => void;
  consentOpen: boolean;
  setConsentOpen: (open: boolean) => void;
  consentReviewOnly: boolean;
  onAgreeConsent: () => void;
  deleteDataOpen: boolean;
  setDeleteDataOpen: (open: boolean) => void;
  onConfirmDeleteData: () => void;
  linkOpen: boolean;
  linkProvider: string;
  linkErrorOpen: boolean;
  setLinkErrorOpen: (open: boolean) => void;
  linkErrorMsg: string;
}

function Overlay({ show, onClose, children, maxW = 400 }: { show: boolean; onClose: () => void; children: React.ReactNode; maxW?: number }) {
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--km-s1)', border: '1px solid var(--km-b)', borderRadius: 18, width: '100%', maxWidth: maxW, padding: 22 }}>{children}</div>
    </div>
  );
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 700 }}>{title}</span><button type="button" aria-label="Close" onClick={onClose} style={{ border: 0, background: 'transparent', color: 'var(--km-tm)', cursor: 'pointer' }}><X size={17} /></button></div>;
}

const buttonStyle: React.CSSProperties = { flex: 1, fontSize: 13.5, fontWeight: 600, padding: '11px 18px', borderRadius: 11, background: 'var(--km-s2)', color: 'var(--km-t)', border: '1px solid var(--km-b)', cursor: 'pointer' };

export default function DeviceModals(props: DeviceModalsProps) {
  const { allowedProviders } = props;
  const visibleProviders = allowedProviders.filter((provider) => (props.pickerCat === 'all' || provider.cat === props.pickerCat) && (!props.pickerQuery.trim() || `${provider.name} ${provider.kind} ${provider.gives}`.toLowerCase().includes(props.pickerQuery.trim().toLowerCase())));
  return <>
    <Overlay show={props.pickerOpen} onClose={() => props.setPickerOpen(false)} maxW={440}>
      <ModalHeader title="Connect a device" onClose={() => props.setPickerOpen(false)} />
      <div className="km-swrap" style={{ marginBottom: 12 }}><Search size={16} /><input className="km-sinp" placeholder="Search 300+ devices & apps" value={props.pickerQuery} onChange={(event) => props.setPickerQuery(event.target.value)} /></div>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 14 }}>{CATS.map((category) => <button type="button" key={category.id} onClick={() => props.setPickerCat(category.id)} style={{ cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '6px 13px', borderRadius: 20, border: '1px solid var(--km-b)', background: props.pickerCat === category.id ? 'var(--km-navy)' : 'var(--km-s1)', color: props.pickerCat === category.id ? 'var(--km-navyfg)' : 'var(--km-t2)' }}>{category.label}</button>)}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '55vh', overflow: 'auto' }}>{visibleProviders.map((provider) => <div key={provider.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', border: '1px solid var(--km-b)', borderRadius: 14 }}><ProviderIcon {...(provider.logoUrl ? { logoUrl: provider.logoUrl } : {})} fallback={provider.ic} size={40} radius={11} fontSize={20} /><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: 13.5 }}>{provider.name}</div><div style={{ fontSize: 11.5, color: 'var(--km-tm)' }}>{provider.kind} · {provider.gives}</div></div>{provider.mobile && <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 20, background: 'var(--km-s2)', color: 'var(--km-tm)' }}>Mobile app</span>}<button type="button" onClick={() => { props.setPickerOpen(false); props.onConnect(provider.id); }} style={{ ...buttonStyle, flex: 'none', padding: '7px 16px' }}>Connect</button></div>)}</div>
    </Overlay>

    <Overlay show={props.goalModalOpen} onClose={() => props.setGoalModalOpen(false)} maxW={380}>
      <ModalHeader title="Set your target BMI" onClose={() => props.setGoalModalOpen(false)} />
      <p style={{ fontSize: 12.5, color: 'var(--km-tm)', lineHeight: 1.5 }}>Your target BMI is stored with your patient health goals and shown on your BMI history.</p>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--km-t2)' }}>Target BMI<input className="km-inp" type="number" min={10} max={80} step={0.1} value={props.goalInput} onChange={(event) => props.setGoalInput(event.target.value)} placeholder="e.g. 24.0" style={{ width: '100%', marginTop: 6 }} /></label>
      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}><button type="button" onClick={() => props.setGoalModalOpen(false)} style={buttonStyle}>Cancel</button><button type="button" onClick={props.onSaveGoal} style={{ ...buttonStyle, background: 'var(--km-am)', color: '#fff', borderColor: 'var(--km-am)' }}>Save goal</button></div>
    </Overlay>

    <LogWeightModal open={props.logWeightOpen} onClose={() => props.setLogWeightOpen(false)} onSave={props.onSaveLogWeight} />

    <Overlay show={props.consentOpen} onClose={() => props.setConsentOpen(false)} maxW={430}>
      <ModalHeader title={props.consentReviewOnly ? 'What you share' : 'Before you connect'} onClose={() => props.setConsentOpen(false)} />
      <p style={{ fontSize: 13, color: 'var(--km-t2)', lineHeight: 1.6 }}>Connecting a device shares your health data with your care team, who use it to monitor your progress and adjust your treatment.</p>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.4px', textTransform: 'uppercase', color: 'var(--km-tm)', marginBottom: 8 }}>Data you'll share</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>{['Sleep', 'Activity', 'Heart rate', 'Body & weight', 'Glucose', 'Nutrition', 'Workouts'].map((item) => <span key={item} style={{ fontSize: 11.5, background: 'var(--km-s2)', border: '1px solid var(--km-b)', borderRadius: 999, padding: '5px 11px' }}>{item}</span>)}</div>
      <div style={{ display: 'flex', gap: 10 }}><button type="button" onClick={() => props.setConsentOpen(false)} style={buttonStyle}>Cancel</button><button type="button" onClick={props.consentReviewOnly ? () => props.setConsentOpen(false) : props.onAgreeConsent} style={{ ...buttonStyle, flex: 1.4, background: 'var(--km-am)', color: '#fff', borderColor: 'var(--km-am)' }}>{props.consentReviewOnly ? 'Done' : 'Agree & connect'}</button></div>
    </Overlay>

    <Overlay show={props.deleteDataOpen} onClose={() => props.setDeleteDataOpen(false)} maxW={400}>
      <ModalHeader title="Delete your health data?" onClose={() => props.setDeleteDataOpen(false)} />
      <p style={{ fontSize: 13, color: 'var(--km-t2)', lineHeight: 1.6 }}>This disconnects all devices and permanently removes the health data synced via Junction. This can't be undone.</p>
      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}><button type="button" onClick={() => props.setDeleteDataOpen(false)} style={buttonStyle}>Cancel</button><button type="button" onClick={props.onConfirmDeleteData} style={{ ...buttonStyle, background: 'var(--km-re)', color: '#fff', borderColor: 'var(--km-re)' }}>Delete my data</button></div>
    </Overlay>

    {props.linkOpen && <Overlay show onClose={() => undefined} maxW={360}><div style={{ textAlign: 'center' }}><Smartphone size={28} /><div style={{ fontWeight: 700, fontSize: 15, marginTop: 12 }}>Connecting to {props.linkProvider}…</div><p style={{ fontSize: 12.5, color: 'var(--km-tm)' }}>Junction is opening the provider's secure sign-in.</p></div></Overlay>}
    {props.linkErrorOpen && <Overlay show onClose={() => props.setLinkErrorOpen(false)} maxW={360}><div style={{ textAlign: 'center' }}><AlertCircle size={24} color="var(--km-am)" /><div style={{ fontWeight: 700, fontSize: 15, marginTop: 10 }}>Could not connect</div><p style={{ fontSize: 12.5, color: 'var(--km-tm)' }}>{props.linkErrorMsg}</p><button type="button" onClick={() => props.setLinkErrorOpen(false)} style={{ ...buttonStyle, width: '100%' }}>OK</button></div></Overlay>}
  </>;
}
