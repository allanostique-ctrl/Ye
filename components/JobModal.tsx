'use client';

import { useState } from 'react';

export interface NewJobInput {
  name: string;
  salesRep: string;
  address: string;
}

export function JobModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (input: NewJobInput) => void;
}) {
  const [name, setName] = useState('');
  const [salesRep, setSalesRep] = useState('');
  const [address, setAddress] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({ name: name.trim(), salesRep: salesRep.trim(), address: address.trim() });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-bold">New Job</h2>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="field-label" htmlFor="job-name">
              Job / Customer Name
            </label>
            <input
              id="job-name"
              autoFocus
              className="field-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Smith Residence"
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="job-rep">
              Sales Rep
            </label>
            <input
              id="job-rep"
              className="field-input"
              value={salesRep}
              onChange={(e) => setSalesRep(e.target.value)}
              placeholder="e.g. Allan Ostique"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="job-address">
              Job Site Address
            </label>
            <input
              id="job-address"
              className="field-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, Anytown USA"
            />
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
