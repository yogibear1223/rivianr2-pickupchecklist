'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, FileText, LoaderCircle, Upload, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { applyImportedDetails, importLabels, MAX_IMPORT_TEXT, parseConfigurationText, type ImportField, type ImportMode, type ImportResult } from '@/lib/configuration-import';
import type { VehicleMeta } from '@/lib/model';

type Review = { result: ImportResult; fields: Partial<Record<ImportField, { value: string; include: boolean }>>; accessories: { value: string; include: boolean }[] };

export function ConfigurationImport({ current, editing, onApply }: { current: VehicleMeta; editing: boolean; onApply: (meta: VehicleMeta) => void }) {
  const [expanded, setExpanded] = useState(false), [text, setText] = useState(''), [mode, setMode] = useState<ImportMode>('auto');
  const [review, setReview] = useState<Review | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false), [progress, setProgress] = useState('');
  const [fileLabel, setFileLabel] = useState(''), [pdfNotice, setPdfNotice] = useState(''), [applied, setApplied] = useState('');
  const input = useRef<HTMLInputElement>(null), controller = useRef<AbortController | null>(null), job = useRef(0);
  useEffect(() => () => { job.current++; controller.current?.abort(); }, []);
  const analyze = (source = text, selectedMode = mode) => {
    try {
      const result = parseConfigurationText(source, selectedMode);
      setReview({ result, fields: Object.fromEntries(result.fields.map(field => [field.field, { value: field.candidates.length === 1 ? field.candidates[0].value : '', include: field.certain && !(editing && field.field === 'vin') }])), accessories: result.accessories.map(item => ({ value: item.value, include: item.certain })) });
      setError(''); setApplied('');
    } catch (err) { setError((err as Error).message); setReview(null); }
  };
  const readFile = async (file?: File) => {
    if (!file) return;
    controller.current?.abort();
    const abort = new AbortController(); controller.current = abort;
    const thisJob = ++job.current;
    setBusy(true); setError(''); setProgress('Opening PDF…'); setReview(null); setApplied(''); setPdfNotice(''); setFileLabel(''); setText('');
    try {
      const { extractPdfText } = await import('@/lib/pdf-text');
      if (thisJob !== job.current) return;
      const result = await extractPdfText(file, (page, total) => { if (thisJob === job.current) setProgress(`Reading page ${page} of ${total}…`); }, abort.signal);
      if (thisJob !== job.current) return;
      setText(result.text); setFileLabel(`${file.name} · ${result.pages} ${result.pages === 1 ? 'page' : 'pages'}`);
      if (result.emptyPages) setPdfNotice(`${result.emptyPages} ${result.emptyPages === 1 ? 'page had' : 'pages had'} little or no readable text. Check for missing details on those pages.`);
      analyze(result.text);
    } catch (err) { if (thisJob === job.current) setError((err as Error).message); }
    finally { if (thisJob === job.current) { setBusy(false); setProgress(''); } }
  };
  const cancelRead = () => { job.current++; controller.current?.abort(); setBusy(false); setProgress(''); };
  const reset = () => { cancelRead(); setText(''); setReview(null); setError(''); setFileLabel(''); setPdfNotice(''); setApplied(''); if (input.current) input.current.value = ''; };
  const updateField = (field: ImportField, patch: Partial<{ value: string; include: boolean }>) => setReview(value => value ? { ...value, fields: { ...value.fields, [field]: { value: '', include: false, ...value.fields[field], ...patch } } } : value);
  const selectedCount = review ? Object.values(review.fields).filter(value => value?.include && value.value.trim()).length + review.accessories.filter(value => value.include && value.value.trim()).length : 0;
  const apply = () => {
    if (!review) return;
    try {
      const fields = Object.fromEntries(Object.entries(review.fields).filter(([, value]) => value?.include).map(([field, value]) => [field, value!.value])) as Partial<Record<ImportField, string>>;
      if (fields.vin && !/^[A-HJ-NPR-Z0-9]{17}$/.test(fields.vin.toUpperCase().replace(/\s/g, ''))) throw new Error('Review the VIN: use 17 characters without I, O or Q.');
      if (fields.vin) fields.vin = fields.vin.toUpperCase().replace(/\s/g, '');
      onApply(applyImportedDetails(current, fields, review.accessories.filter(value => value.include).map(value => value.value), editing));
      reset(); setExpanded(false); setApplied('Details added to the form. Review them below, then ' + (editing ? 'save vehicle details.' : 'create your inspection.'));
    } catch (err) { setError((err as Error).message); }
  };
  return <section className="configuration-import" aria-label="Import configuration and accessories">
    <button type="button" className="import-toggle" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}><FileText size={21}/><span><strong>Import configuration & accessories</strong><small>Paste an order summary or choose a PDF</small></span><ChevronDown size={18} style={{ transform: expanded ? 'rotate(180deg)' : undefined }}/></button>
    {applied && <p className="import-applied" role="status"><Check size={17}/>{applied}</p>}
    {expanded && <div className="import-body">
      <p className="import-hint">Use your selected configuration, purchase summary, or accessory receipt. You’ll review the detected details before filling the form.</p>
      <div className="field"><label htmlFor="import-kind">Document type</label><Select value={mode} disabled={busy} onValueChange={value => { setMode(value as ImportMode); setReview(null); setError(''); }}><SelectTrigger id="import-kind" className="select-control"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="auto">Detect automatically</SelectItem><SelectItem value="vehicle">Vehicle configuration / order</SelectItem><SelectItem value="accessories">Accessory or Gear Shop receipt</SelectItem></SelectContent></Select></div>
      <input ref={input} type="file" accept="application/pdf,.pdf" className="sr-only" aria-label="Choose configuration PDF" tabIndex={-1} onChange={event => { void readFile(event.target.files?.[0]); event.target.value = ''; }}/>
      <div className="import-file-actions"><button type="button" className="btn" disabled={busy} onClick={() => input.current?.click()}><Upload size={17}/>Choose PDF</button><span className="field-help">Selectable text · up to 12 MB / 20 pages</span></div>
      {busy && <div className="import-reading" role="status"><LoaderCircle size={17} className="compact-spinner"/><span>{progress}</span><button type="button" className="btn subtle" onClick={cancelRead}>Cancel</button></div>}
      {fileLabel && <p className="import-file-name"><FileText size={16}/>{fileLabel}</p>}
      <div className="field"><label htmlFor="import-text">Or paste your order text</label><textarea id="import-text" value={text} disabled={busy} maxLength={MAX_IMPORT_TEXT} rows={5} onChange={event => { setText(event.target.value); setReview(null); setFileLabel(''); setPdfNotice(''); setError(''); }} placeholder={'R2 Performance\nExterior: Launch Green\nInterior: Black Crater Signature\nWheels: 21” Liquid Tungsten\nAccessories: R2 All-Weather Floor Mats'}/></div>
      <div className="import-actions"><button type="button" className="btn primary" disabled={busy || !text.trim()} onClick={() => analyze()}><FileText size={17}/>{review ? 'Read details again' : 'Find details'}</button>{text && <button type="button" className="btn subtle" disabled={busy} onClick={reset}><X size={16}/>Clear</button>}</div>
      <p className="field-help">The PDF and pasted text are read on this device. Only the details you confirm are saved with your inspection. Scans need copied text or a PDF with selectable text.</p>
      {pdfNotice && <div className="notice amber">{pdfNotice}</div>}
      {review && <div className="import-review">
        <h3>Review detected details</h3><p className="import-hint">Check the values you want to use. Existing values are shown below each field; accessories are added to your current list.</p>
        {review.result.warnings.map(warning => <p className="import-warning" key={warning}>{warning}</p>)}
        {review.result.fields.map(field => {
          const value = review.fields[field.field]!;
          const locked = editing && field.field === 'vin';
          const label = importLabels[field.field];
          return <div className={'import-field-row ' + (locked ? 'locked' : '')} key={field.field}>
            <label className="import-check"><Checkbox checked={value.include} disabled={locked} onCheckedChange={checked => updateField(field.field, { include: checked === true })} aria-label={'Import ' + label}/><strong>{label}</strong>{field.candidates.length > 1 && <span className="pill">Choose a match</span>}</label>
            {field.candidates.length > 1 && <Select value={value.value || undefined} disabled={locked} onValueChange={selected => updateField(field.field, { value: selected, include: true })}><SelectTrigger className="select-control" aria-label={'Detected ' + label + ' choices'}><SelectValue placeholder="Choose the value on your order"/></SelectTrigger><SelectContent>{field.candidates.map(candidate => <SelectItem value={candidate.value} key={candidate.value}>{candidate.value}</SelectItem>)}</SelectContent></Select>}
            <input aria-label={'Detected ' + label} type={field.field === 'deliveryDate' ? 'date' : field.field === 'deliveryTime' ? 'time' : 'text'} value={value.value} maxLength={field.field === 'vin' ? 17 : 250} disabled={locked} onChange={event => updateField(field.field, { value: event.target.value, include: true })}/>
            <p className="field-help">{locked ? 'The VIN of an existing inspection stays fixed.' : current[field.field] ? 'Current: ' + current[field.field] : 'Currently empty'}</p>
            <details className="import-evidence"><summary>Source text</summary>{field.candidates.map(candidate => <p key={candidate.value}>{candidate.evidence}</p>)}</details>
          </div>;
        })}
        {review.accessories.length > 0 && <div className="import-accessories"><h4>Options & accessories</h4>{review.accessories.map((item, index) => <div className="import-accessory-row" key={index}><Checkbox checked={item.include} aria-label={'Import accessory ' + item.value} onCheckedChange={checked => setReview(value => value ? { ...value, accessories: value.accessories.map((entry, i) => i === index ? { ...entry, include: checked === true } : entry) } : value)}/><div><input value={item.value} aria-label={'Accessory ' + (index + 1)} maxLength={250} onChange={event => setReview(value => value ? { ...value, accessories: value.accessories.map((entry, i) => i === index ? { ...entry, value: event.target.value, include: true } : entry) } : value)}/>{!review.result.accessories[index].certain && <p className="field-help">Confirm this was included or purchased.</p>}</div></div>)}<p className="field-help">Repeated item names are skipped. Edit quantities yourself if these are different purchases of the same item.</p></div>}
        {(review.result.fields.length > 0 || review.accessories.length > 0) && <button type="button" className="btn primary full" disabled={!selectedCount} onClick={apply}><Check size={18}/>Use {selectedCount} selected {selectedCount === 1 ? 'detail' : 'details'}</button>}
      </div>}
      {error && <div className="error-box" role="alert">{error}</div>}
    </div>}
  </section>;
}
